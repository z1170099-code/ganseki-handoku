# -*- coding: utf-8 -*-
"""岩石判読を、使う人と同じ操作でひととおり試す（Playwright ＋ Edge、なければ Chromium）

使い方:  python tools/e2e_test.py [出力フォルダ]
  画面の写真・書き出したファイル・結果の一覧（results.json）を出力フォルダ（既定は _e2e）に置く。
  Gemini と地質図への問い合わせは、テストの中で用意した返事に差し替えるので、API キーもネットも要らない。
  Playwright がないときは  pip install playwright && python -m playwright install chromium
"""
import io, json, os, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "_e2e")
os.makedirs(OUT, exist_ok=True)
R = []
FAKE_KEY = "AIza-fake-key-for-test"  # 本物のキーの形（AIza＋35文字）にしない

AI_RESULT = {
    "is_rock": True, "photo_note": "",
    "observed": {"fabric": "porphyritic", "clast": "noclast", "grain": "fine", "struct": "none", "color": "gray", "luster": "dull", "minerals": ["plag", "px", "zzz"]},
    "candidates": [
        {"id": "andesite", "name": "安山岩", "confidence": 62, "reasons": ["灰色の石基に白い斜長石の斑晶が散らばる"], "against": ["かんらん石の有無は写真ではわからない"]},
        {"id": "basalt", "name": "玄武岩", "confidence": 20, "reasons": ["暗い色調"], "against": []},
        {"id": "xxx", "name": "花崗岩", "confidence": 5, "reasons": [], "against": []},
        {"id": "other", "name": "コンクリート", "confidence": 3, "reasons": [], "against": []},
    ],
    "next_checks": ["希塩酸をかけて泡が出るか確かめる", "ルーペでかんらん石（黄緑の粒）をさがす"],
    "comment": "斑状組織と灰色の石基から、安山岩の可能性が高い。",
}
LEGEND = {"symbol": "N2_sbs", "r": 255, "g": 250, "b": 130, "formationAge_ja": "新生代 新第三紀 中新世", "group_ja": "堆積岩",
          "lithology_ja": "汽水成層ないし海成・非海成混合層 砂岩，砂岩泥岩互層"}


def check(scene, name, ok, detail=""):
    R.append((scene, name, bool(ok), str(detail)))
    print(("  OK " if ok else "  NG ") + f"[{scene}] {name}  {detail}", flush=True)


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def make_photo(path, gps=True):
    """斑状の岩っぽい絵。EXIF に松江市の緯度経度を入れる"""
    im = Image.new("RGB", (2000, 1500), (128, 122, 116))
    d = ImageDraw.Draw(im)
    import random
    rnd = random.Random(1)
    for _ in range(4000):
        x, y = rnd.randrange(2000), rnd.randrange(1500)
        c = rnd.choice([(110, 104, 98), (150, 144, 138)])
        d.ellipse([x, y, x + 6, y + 6], fill=c)
    for _ in range(60):
        x, y = rnd.randrange(2000), rnd.randrange(1500)
        d.rectangle([x, y, x + rnd.randrange(30, 70), y + rnd.randrange(12, 25)], fill=(245, 242, 236))
    kw = {}
    if gps:
        ex = Image.Exif()
        ex[0x8825] = {1: "N", 2: (35.0, 28.0, 20.28), 3: "E", 4: (133.0, 3.0, 1.8)}
        kw["exif"] = ex
    im.save(path, quality=88, **kw)


def gem_body(obj, model="gemini-test"):
    return json.dumps({"candidates": [{"content": {"role": "model", "parts": [{"text": json.dumps(obj, ensure_ascii=False)}]}, "finishReason": "STOP"}],
                       "modelVersion": model}, ensure_ascii=False)


CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"}


class Gemini:
    """Gemini への問い合わせを横取りして、決めた返事をする"""
    def __init__(self):
        self.calls, self.mode = [], "ok"

    def __call__(self, route, request):
        if request.method == "OPTIONS":
            route.fulfill(status=204, headers=dict(CORS, **{"access-control-allow-methods": "POST"})); return
        try:
            body = request.post_data_json
        except Exception:
            body = None
        self.calls.append({"url": request.url, "headers": request.headers, "body": body})
        if self.mode == "badkey":
            route.fulfill(status=400, headers=CORS, content_type="application/json",
                          body=json.dumps({"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.", "status": "INVALID_ARGUMENT", "details": [{"reason": "API_KEY_INVALID"}]}}))
            return
        if self.mode == "busy-first" and "gemini-3.5-flash" in request.url:
            route.fulfill(status=503, headers=CORS, content_type="application/json", body=json.dumps({"error": {"code": 503, "message": "overloaded", "status": "UNAVAILABLE"}}))
            return
        if body and len(body.get("contents", [{}])[0].get("parts", [])) == 1 and "接続テスト" in body["contents"][0]["parts"][0].get("text", ""):
            route.fulfill(status=200, headers=CORS, content_type="application/json",
                          body=json.dumps({"candidates": [{"content": {"parts": [{"text": "OK"}]}, "finishReason": "STOP"}]}))
            return
        model = request.url.split("/models/")[1].split(":")[0]
        route.fulfill(status=200, headers=CORS, content_type="application/json; charset=utf-8", body=gem_body(AI_RESULT, model + "-test"))


def gbank(route, request):
    route.fulfill(status=200, headers=CORS, content_type="application/json; charset=utf-8", body=json.dumps(LEGEND, ensure_ascii=False))


def launch(p):
    args = ["--disable-gpu"]
    try:
        return p.chromium.launch(channel="msedge", headless=True, args=args), "Edge"
    except Exception:
        return p.chromium.launch(headless=True, args=args), "Chromium"


def watch(page, logs):
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: logs.append(f"PAGEERROR: {e}"))
    page.on("dialog", lambda d: d.accept())


def ready(page):
    page.wait_for_function("window.__gansekiReady === true", timeout=30000)


def chip(page, f, v):
    page.click(f'#obsForm .chip[data-f="{f}"][data-v="{v}"]')


def top_rule(page):
    return page.eval_on_selector_all("#ruleBox .rname", "els => els.map(e => e.textContent)")


def errs(logs):
    # 「Failed to load resource」は、テストでわざと返した 503・400 や圏外のときにブラウザが出す記録なので数えない
    return [l for l in logs if "favicon" not in l and "net::ERR_INTERNET_DISCONNECTED" not in l and "Failed to load resource" not in l]


def main():
    port = free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"], cwd=ROOT,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    base = f"http://127.0.0.1:{port}/index.html"
    photo = os.path.join(OUT, "test_photo.jpg"); make_photo(photo)
    try:
        with sync_playwright() as p:
            br, name = launch(p)
            print(f"ブラウザ: {name}")
            run_selftest(br, base)
            run_pc(br, base, photo)
            run_phone(br, base)
            run_offline(br, base)
            br.close()
    finally:
        srv.terminate()
    ok = sum(1 for r in R if r[2])
    print(f"\n{ok} / {len(R)} OK")
    json.dump([dict(scene=a, name=b, ok=c, detail=d) for a, b, c, d in R], open(os.path.join(OUT, "results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sys.exit(0 if ok == len(R) else 1)


def run_selftest(br, base):
    sc = "自己点検"
    pg = br.new_page()
    logs = []; watch(pg, logs)
    pg.goto(base + "#selftest"); ready(pg)
    res = pg.evaluate("window.__selftest")
    bad = [f"{x['name']}={x['pos']}位({' '.join(x['top'])})" for x in res["rows"] if x["pos"] > 3]
    check(sc, "どの岩石も、よくある特徴で答えると3位以内", res["ok"], "; ".join(bad) or f"{len(res['rows'])} 種")
    check(sc, "エラーなし", not errs(logs), errs(logs)[:3])
    pg.close()


def run_pc(br, base, photo):
    sc = "PC"
    ctx = br.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True, locale="ja-JP")
    gem = Gemini()
    ctx.route("https://generativelanguage.googleapis.com/**", gem)
    ctx.route("https://gbank.gsj.jp/**", gbank)
    pg = ctx.new_page()
    logs = []; watch(pg, logs)
    pg.goto(base); ready(pg)
    check(sc, "起動してエラーなし", not errs(logs), errs(logs)[:3])
    check(sc, "版の表示", pg.inner_text("#ver").startswith("v"), pg.inner_text("#ver"))
    check(sc, "観察チェックの項目が12個", pg.locator("#obsForm .q").count() == 12, pg.locator("#obsForm .q").count())
    check(sc, "模式図が描かれている（組織・礫・面構造）", pg.locator("#obsForm .chips.tiles svg").count() == 17, pg.locator("#obsForm .chips.tiles svg").count())

    # 図鑑
    pg.click('#tabs [data-tab="zukan"]')
    n = pg.locator("#zList .zitem").count()
    check(sc, "図鑑に46種", n == 46, n)
    pg.fill("#inZukan", "片岩")
    names = pg.eval_on_selector_all("#zList .zitem b", "els => els.map(e => e.textContent)")
    check(sc, "「片岩」でさがすと片岩が出る", sum("片岩" in x for x in names) >= 4, names)
    pg.fill("#inZukan", "")
    pg.click('#zGroups [data-zg="fault"]')
    names = pg.eval_on_selector_all("#zList .zitem b", "els => els.map(e => e.textContent)")
    check(sc, "断層岩で絞ると3種", len(names) == 3, names)
    pg.click('#zGroups [data-zg="all"]')
    pg.click('#zList .zitem[data-rock="eclogite"]')
    pg.wait_for_selector("#sheet:not([hidden])")
    check(sc, "岩石の詳細が開く", pg.inner_text("#sheetTitle") == "エクロジャイト", pg.inner_text("#sheetTitle"))
    check(sc, "詳細に見分け方と特徴の表", pg.locator("#sheetBody .sim").count() >= 2 and pg.locator("#sheetBody table tr").count() >= 8)
    pg.screenshot(path=os.path.join(OUT, "pc_rock.png"))
    pg.click('#sheetBody .sim[data-rock="amphibolite"]')
    check(sc, "似ている岩石へ移れる", pg.inner_text("#sheetTitle") == "角閃岩", pg.inner_text("#sheetTitle"))
    pg.click("#sheetBack")
    pg.wait_for_function("document.querySelector('#sheetTitle').textContent === 'エクロジャイト'")
    check(sc, "もどるで1つ前の岩石へ", True)
    pg.go_back()
    pg.wait_for_selector("#sheet", state="hidden")
    check(sc, "ブラウザの戻るで詳細が閉じる", pg.locator("#sheet").is_hidden())

    # 観察チェック → 安山岩
    pg.click('#tabs [data-tab="judge"]')
    for f, v in [("fabric", "porphyritic"), ("grain", "fine"), ("color", "gray"), ("min", "plag"), ("min", "px"), ("min", "hbl"), ("hard", "hard"), ("acid", "none")]:
        chip(pg, f, v)
    tops = top_rule(pg)
    check(sc, "斑状・灰色・斜長石・輝石・角閃石 → 1位が安山岩", tops[:1] == ["安山岩"], tops[:4])
    check(sc, "次に確かめる項目の案内が出る", pg.locator("#ruleBox .next").count() == 1, pg.inner_text("#ruleBox .next") if pg.locator("#ruleBox .next").count() else "")
    pg.click("#btnObsReset")
    for f, v in [("fabric", "massive"), ("color", "light"), ("hard", "soft"), ("acid", "fizz"), ("min", "fossil")]:
        chip(pg, f, v)
    tops = top_rule(pg)
    check(sc, "緻密・白・軟らかい・塩酸で泡・化石 → 1位が石灰岩", tops[:1] == ["石灰岩"], tops[:4])
    pg.click("#btnObsReset")
    for f, v in [("fabric", "crystalline"), ("grain", "coarse"), ("color", "green"), ("min", "grt"), ("min", "px"), ("weight", "heavy")]:
        chip(pg, f, v)
    tops = top_rule(pg)
    check(sc, "結晶質・緑・ざくろ石・輝石・重い → 上位にエクロジャイト", "エクロジャイト" in tops[:2], tops[:4])
    pg.click("#btnObsReset")
    for f, v in [("fabric", "clastic"), ("clast", "angular"), ("struct", "sheared"), ("hard", "crumbly"), ("setting", "fault")]:
        chip(pg, f, v)
    tops = top_rule(pg)
    check(sc, "砕屑性・角ばる・せん断・もろい・断層 → 1位が断層角礫・ガウジ", tops[:1] == ["断層角礫・断層ガウジ"], tops[:4])
    pg.click("#btnObsReset")

    # キーなしで AI を押す
    pg.click("#btnAi")
    check(sc, "写真なしで AI を押すと案内", pg.locator("#toast").is_visible(), pg.inner_text("#toast"))

    # 写真（EXIF の位置 → 地質図）
    pg.set_input_files("#inPick", photo)
    pg.wait_for_function("document.querySelectorAll('#photoGrid img').length === 1")
    check(sc, "写真が入る", True)
    pg.wait_for_function("document.querySelector('#inLatLon').value !== ''", timeout=5000)
    ll = pg.input_value("#inLatLon")
    check(sc, "写真の位置情報（EXIF）から緯度経度が入る", ll.startswith("35.4723") and "133.0505" in ll, ll)
    pg.wait_for_selector("#geoInfo", timeout=10000)
    check(sc, "地質図の凡例が出る", "砂岩泥岩互層" in pg.inner_text("#geoInfo"), pg.inner_text("#geoInfo")[:60])
    blob = pg.evaluate("(() => { const b = window.__ganseki.S.photos[0].blob; return [b.size, b.type]; })()")
    check(sc, "写真は JPEG に縮めて持つ", blob[1] == "image/jpeg" and blob[0] < 900_000, blob)
    dims = pg.evaluate("new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = document.querySelector('#photoGrid img').src; })")
    check(sc, "長い辺は1280px", max(dims) == 1280, dims)

    # キーなしで AI
    pg.click("#btnAi")
    check(sc, "キーがないと設定へ案内", "API キーが入っていません" in pg.inner_text("#aiBox"))
    # 設定でキーを入れる
    pg.click('#tabs [data-tab="settings"]')
    pg.fill("#inKey", FAKE_KEY)
    pg.click("#btnKeySave")
    check(sc, "キーを保存", "保存しました" in pg.inner_text("#keyMsg"))
    pg.click("#btnKeyTest")
    pg.wait_for_function("document.querySelector('#keyMsg').textContent.includes('つながりました') || document.querySelector('#keyMsg .err')", timeout=15000)
    check(sc, "接続テスト", "つながりました" in pg.inner_text("#keyMsg"), pg.inner_text("#keyMsg"))
    pg.click('#tabs [data-tab="judge"]')

    # AI：最初のモデルが混雑 → 軽いモデルでやり直す
    chip(pg, "acid", "none")
    gem.mode = "busy-first"; gem.calls.clear()
    pg.click("#btnAi")
    pg.wait_for_selector("#aiBox .cands", timeout=20000)
    names = pg.eval_on_selector_all("#aiBox .cand-h", "els => els.map(e => e.innerText.replace(/\\s+/g, ' '))")
    check(sc, "AI の1位が安山岩", "安山岩" in names[0], names)
    check(sc, "「花崗岩」が図鑑の花こう岩に結びつく", any("花こう岩" in x for x in names), names)
    check(sc, "図鑑にない名前も出せる", any("コンクリート" in x and "図鑑にない" in x for x in names), names)
    check(sc, "混雑で軽いモデルに切り替えた", len(gem.calls) == 2 and "gemini-flash-lite-latest" in gem.calls[1]["url"] and "混雑のため切り替え" in pg.inner_text("#aiBox"),
          [c["url"].split("/models/")[1] for c in gem.calls])
    c0 = gem.calls[0]
    parts = c0["body"]["contents"][0]["parts"]
    check(sc, "キーは URL ではなくヘッダーで送る", c0["headers"].get("x-goog-api-key") == FAKE_KEY and FAKE_KEY not in c0["url"])
    check(sc, "写真を送っている", len(parts) == 2 and parts[1].get("inlineData", {}).get("mimeType") == "image/jpeg" and len(parts[1]["inlineData"]["data"]) > 1000)
    prompt = parts[0]["text"]
    check(sc, "依頼文に岩石リスト・観察・地質図が入る", "andesite: 安山岩" in prompt and "発泡しない" not in prompt and "泡が出ない" in prompt and "砂岩泥岩互層" in prompt, prompt[-300:])
    check(sc, "JSON の形を指定している", c0["body"]["generationConfig"]["responseMimeType"] == "application/json")
    check(sc, "確かめることが出る", "希塩酸" in pg.inner_text("#aiBox"))
    pg.screenshot(path=os.path.join(OUT, "pc_ai.png"), full_page=True)
    # AI の読み取りを観察チェックへ
    pg.click("#btnAiFill")
    marks = pg.locator("#obsForm .ai-mark").count()
    pressed = pg.evaluate("window.__ganseki.S.ans")
    check(sc, "AI の読み取りが観察チェックに入る（印つき）", marks >= 5 and pressed.get("fabric") == "porphyritic" and pressed.get("acid") == "none", f"印 {marks} 個 {pressed}")
    check(sc, "存在しない鉱物コードは入らない", "zzz" not in pressed.get("min", []), pressed.get("min"))
    tops = top_rule(pg)
    check(sc, "入れたあと観察の1位も安山岩", tops[:1] == ["安山岩"], tops[:3])
    check(sc, "AI の候補に観察チェックとの一致が出る", "観察チェックとの一致" in pg.inner_text("#aiBox"))

    # キーの誤り
    gem.mode = "badkey"
    pg.click("#btnAi")
    pg.wait_for_selector("#aiBox .msg.err", timeout=15000)
    check(sc, "キーの誤りを日本語で知らせる", "API キーが正しくありません" in pg.inner_text("#aiBox"), pg.inner_text("#aiBox")[:80])
    gem.mode = "ok"
    pg.click("#btnAi")
    pg.wait_for_selector("#aiBox .cands", timeout=15000)

    # 保存
    pg.fill("#inFinal", "安山岩")
    pg.fill("#inPlace", "テスト用の地点")
    pg.fill("#inMemo", "テストのメモ")
    pg.click("#btnSave")
    pg.wait_for_function("document.querySelector('#recCount').textContent === '1'")
    check(sc, "記録に保存（件数1）", True)
    check(sc, "保存後はボタンが上書きに変わる", pg.inner_text("#btnSave") == "記録を上書き保存")
    pg.click("#btnSave")
    time.sleep(0.5)
    check(sc, "もう一度押しても増えない（上書き）", pg.inner_text("#recCount") == "1", pg.inner_text("#recCount"))

    # 再読み込みしても下書きが残る
    pg.reload(); ready(pg)
    st = pg.evaluate("[window.__ganseki.S.photos.length, Object.keys(window.__ganseki.S.ans).length, !!window.__ganseki.S.ai]")
    check(sc, "再読み込み後も写真・答え・AI 結果が残る", st[0] == 1 and st[1] >= 5 and st[2], st)

    # 記録タブ
    pg.click('#tabs [data-tab="records"]')
    pg.wait_for_selector("#recList .rec")
    check(sc, "記録の一覧に出る", "安山岩" in pg.inner_text("#recList"))
    pg.click("#recList .rec")
    pg.wait_for_selector("#recSave")
    check(sc, "記録の詳細に写真・地質図・AI", pg.locator("#sheetBody .bigph").count() == 1 and "砂岩泥岩互層" in pg.inner_text("#sheetBody") and "AI の判定" in pg.inner_text("#sheetBody"))
    pg.fill("#recMemo", "直したメモ")
    pg.click("#recSave")
    pg.click("#sheetBack")
    pg.wait_for_selector("#sheet", state="hidden")
    with pg.expect_download() as d:
        pg.click("#btnExport")
    jpath = os.path.join(OUT, "export.json"); d.value.save_as(jpath)
    j = json.load(open(jpath, encoding="utf-8"))
    rec = j["records"][0]
    check(sc, "まるごと書き出し（写真入り .json）", j["app"] == "ganseki-handoku" and len(j["records"]) == 1 and rec["photos"][0].startswith("data:image/jpeg") and rec["memo"] == "直したメモ", rec["memo"])
    with pg.expect_download() as d:
        pg.click("#btnCsv")
    cpath = os.path.join(OUT, "export.csv"); d.value.save_as(cpath)
    csv = open(cpath, encoding="utf-8-sig").read()
    check(sc, "一覧の .csv（Excel 用 BOM つき）", open(cpath, "rb").read(3) == b"\xef\xbb\xbf" and "自分の判定" in csv and "安山岩" in csv and "砂岩泥岩互層" in csv)
    pg.click("#recList .rec")
    pg.wait_for_selector("#recDel")
    pg.click("#recDel")
    pg.wait_for_selector("#sheet", state="hidden")
    pg.wait_for_function("document.querySelector('#recCount').textContent === ''")
    check(sc, "記録を消せる", "まだ記録はありません" in pg.inner_text("#recList"))
    pg.set_input_files("#inImport", jpath)
    pg.wait_for_function("document.querySelector('#recCount').textContent === '1'", timeout=10000)
    check(sc, "書き出した .json を読み込んで戻せる", True)
    pg.click("#recList .rec")
    pg.wait_for_selector("#sheetBody .bigph")
    ok = pg.evaluate("new Promise(r => { const i = document.querySelector('#sheetBody .bigph'); if (i.complete) r(i.naturalWidth > 0); else i.onload = () => r(i.naturalWidth > 0); })")
    check(sc, "読み込んだ記録の写真も見える", ok)
    pg.click("#recLoad")
    pg.wait_for_selector("#tab-judge:not([hidden])")
    check(sc, "記録を判定画面に読み込める", pg.input_value("#inFinal") == "安山岩" and pg.inner_text("#btnSave") == "記録を上書き保存")

    # 新しい石
    pg.click("#btnNew")
    st = pg.evaluate("[window.__ganseki.S.photos.length, Object.keys(window.__ganseki.S.ans).length, window.__ganseki.S.ai]")
    check(sc, "「新しい石を判定」で空になる", st[0] == 0 and st[1] == 0 and st[2] is None, st)
    check(sc, "最後までエラーなし", not errs(logs), errs(logs)[:3])
    ctx.close()


def run_phone(br, base):
    sc = "スマホ"
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme="dark", locale="ja-JP")
    ctx.route("https://generativelanguage.googleapis.com/**", Gemini())
    ctx.route("https://gbank.gsj.jp/**", gbank)
    pg = ctx.new_page()
    logs = []; watch(pg, logs)
    pg.goto(base); ready(pg)
    wide = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(sc, "横にはみ出さない（判定）", wide <= 0, wide)
    pg.screenshot(path=os.path.join(OUT, "phone_judge_top.png"))
    for f, v in [("fabric", "crystalline"), ("grain", "coarse"), ("color", "speckled"), ("min", "qtz"), ("min", "kfs"), ("min", "bt")]:
        pg.tap(f'#obsForm .chip[data-f="{f}"][data-v="{v}"]')
    pg.locator("#q-hard").scroll_into_view_if_needed()
    time.sleep(0.3)
    check(sc, "答えると下に候補の帯が出る", pg.locator("#mini").is_visible() and "花こう岩" in pg.inner_text("#miniTops"), pg.inner_text("#miniTops") if pg.locator("#mini").is_visible() else "")
    pg.screenshot(path=os.path.join(OUT, "phone_obs.png"))
    pg.tap("#miniBtn")
    time.sleep(0.8)
    pg.screenshot(path=os.path.join(OUT, "phone_rule.png"))
    check(sc, "帯を押すと候補へ移る", pg.locator("#mini").is_hidden())
    pg.tap('#tabs [data-tab="zukan"]')
    wide = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(sc, "横にはみ出さない（図鑑）", wide <= 0, wide)
    pg.screenshot(path=os.path.join(OUT, "phone_zukan.png"))
    pg.tap('#zList .zitem[data-rock="mylonite"]')
    pg.wait_for_selector("#sheet:not([hidden])")
    pg.screenshot(path=os.path.join(OUT, "phone_rock.png"))
    wide = pg.evaluate("document.querySelector('#sheet').scrollWidth - document.querySelector('#sheet').clientWidth")
    check(sc, "横にはみ出さない（岩石の詳細）", wide <= 0, wide)
    pg.tap("#sheetBack")
    pg.tap('#tabs [data-tab="settings"]')
    pg.screenshot(path=os.path.join(OUT, "phone_settings.png"))
    wide = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(sc, "横にはみ出さない（設定）", wide <= 0, wide)
    check(sc, "エラーなし", not errs(logs), errs(logs)[:3])
    ctx.close()


def run_offline(br, base):
    sc = "圏外"
    ctx = br.new_context(viewport={"width": 390, "height": 844}, locale="ja-JP")
    pg = ctx.new_page()
    logs = []; watch(pg, logs)
    pg.goto(base); ready(pg)
    pg.evaluate("navigator.serviceWorker.ready.then(() => true)")
    pg.reload(); ready(pg)   # Service Worker の管理下で読み直す
    ctx.set_offline(True)
    pg.reload(); ready(pg)
    check(sc, "電波がなくても開ける", pg.locator("#obsForm .chip").count() > 50)
    chip(pg, "acid", "fizz")
    check(sc, "電波がなくても観察チェックが動く", len(top_rule(pg)) > 0, top_rule(pg)[:3])
    pg.click('#tabs [data-tab="zukan"]')
    check(sc, "電波がなくても図鑑が見られる", pg.locator("#zList .zitem").count() == 46)
    ctx.set_offline(False)
    ctx.close()


if __name__ == "__main__":
    main()
