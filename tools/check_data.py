# -*- coding: utf-8 -*-
"""rocks.js（岩石データ）とアプリの部品を点検する。ブラウザもネットも要らない。

使い方:  python tools/check_data.py
  問題があれば NG を出して終了コード 1。rocks.js を直したら必ず動かす。
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows の端末で文字化けしないように
except Exception:
    pass
NG = []
WARN = []


def ng(msg):
    NG.append(msg)
    print("  NG", msg)


def warn(msg):
    WARN.append(msg)
    print("  注意", msg)


def load_db():
    src = open(os.path.join(ROOT, "rocks.js"), encoding="utf-8").read()
    m = re.match(r"\s*window\.ROCKS_DB\s*=\s*", src)
    if not m:
        ng("rocks.js が 'window.ROCKS_DB = ' で始まっていない")
        sys.exit(1)
    body = src[m.end():].rstrip()
    if body.endswith(";"):
        body = body[:-1]
    try:
        return json.loads(body)
    except json.JSONDecodeError as e:
        line = body.splitlines()[e.lineno - 1] if e.lineno - 1 < len(body.splitlines()) else ""
        ng(f"rocks.js の JSON が読めない: {e.msg}（{e.lineno + 1} 行目あたり）: {line.strip()[:80]}")
        print("  よくある原因: 最後の要素のあとのカンマ、\" の閉じ忘れ、// の注釈")
        sys.exit(1)


def parse_prof(s):
    out = {}
    for t in str(s or "").split():
        k, _, v = t.partition(":")
        out[k] = float(v) if v else 2.0
    return out


def main():
    db = load_db()
    groups = {g["id"] for g in db["groups"]}
    feats = {f["id"]: f for f in db["features"]}
    opts = {fid: {o["v"] for o in f["opts"]} for fid, f in feats.items()}
    ids = [r["id"] for r in db["rocks"]]
    print(f"岩石 {len(ids)} 種・観察項目 {len(feats)} 個")

    for fid, f in feats.items():
        for k in ("label", "w", "opts"):
            if k not in f:
                ng(f"観察項目 {fid} に {k} がない")
        vs = [o["v"] for o in f["opts"]]
        if len(vs) != len(set(vs)):
            ng(f"観察項目 {fid} の選択肢の v が重なっている")

    seen = set()
    for r in db["rocks"]:
        rid = r.get("id", "?")
        if rid in seen:
            ng(f"id が重なっている: {rid}")
        seen.add(rid)
        if not re.fullmatch(r"[a-z][a-z0-9_]*", rid):
            ng(f"id は半角英小文字・数字・_ だけにする: {rid}")
        for k in ("name", "kana", "en", "group", "desc", "keys", "similar", "japan", "p"):
            if not r.get(k) and k != "similar":
                ng(f"{rid}: {k} が空")
        if r.get("group") not in groups:
            ng(f"{rid}: group '{r.get('group')}' は groups にない")
        if not isinstance(r.get("keys"), list) or not r["keys"]:
            ng(f"{rid}: keys は1つ以上の文の配列にする")
        for s in r.get("similar", []):
            if s.get("id") not in seen and s.get("id") not in ids:
                ng(f"{rid}: similar の id '{s.get('id')}' は岩石にない")
            if s.get("id") == rid:
                ng(f"{rid}: similar に自分自身が入っている")
            if not s.get("how"):
                ng(f"{rid}: similar '{s.get('id')}' に how（見分け方）がない")
        p = r.get("p", {})
        for k, v in p.items():
            if k == "minNo":
                for m in str(v).split():
                    if m not in opts["min"]:
                        ng(f"{rid}: minNo の '{m}' は鉱物の選択肢にない")
                continue
            if k not in feats:
                ng(f"{rid}: p の '{k}' は観察項目にない")
                continue
            prof = parse_prof(v)
            for o, w in prof.items():
                if o not in opts[k]:
                    ng(f"{rid}: p.{k} の '{o}' は選択肢にない（使えるのは {' '.join(sorted(opts[k]))}）")
                if w not in (1.0, 2.0):
                    ng(f"{rid}: p.{k} の '{o}:{w:g}' は 1 か 2 にする")
        both = set(parse_prof(p.get("min"))) & set(str(p.get("minNo", "")).split())
        if both:
            ng(f"{rid}: min と minNo の両方に入っている鉱物がある: {' '.join(both)}")
        for need in ("fabric", "grain", "struct", "hard", "acid"):
            if need not in p:
                warn(f"{rid}: p.{need} がない（判定の手がかりが減る）")

    # アプリの部品
    for fn in ("index.html", "app.js", "judge.js", "ai.js", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"):
        if not os.path.exists(os.path.join(ROOT, fn)):
            ng(f"{fn} がない")
    sw = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read() if os.path.exists(os.path.join(ROOT, "sw.js")) else ""
    m = re.search(r"const SHELL = '([^']+)'", sw)
    app = open(os.path.join(ROOT, "app.js"), encoding="utf-8").read() if os.path.exists(os.path.join(ROOT, "app.js")) else ""
    v = re.search(r"const APP_VERSION = '([^']+)'", app)
    if m and v:
        print(f"アプリの版 {v.group(1)}・キャッシュ名 {m.group(1)}")
        if not m.group(1).endswith(v.group(1)):
            ng(f"sw.js の SHELL（{m.group(1)}）の末尾を app.js の APP_VERSION（{v.group(1)}）とそろえる。そろえないとスマホに新しい版が届かない")
    for own in re.findall(r"'\./([^']*)'", sw):
        if own and not os.path.exists(os.path.join(ROOT, own)):
            ng(f"sw.js の OWN にある {own} がない")
    for fn in ("app.js", "judge.js", "ai.js"):
        path = os.path.join(ROOT, fn)
        if os.path.exists(path) and re.search(r"AIza[0-9A-Za-z_\-]{20,}", open(path, encoding="utf-8").read()):
            ng(f"{fn} に API キーらしい文字列がある。キーはコードに書かない")

    print()
    if NG:
        print(f"NG {len(NG)} 件")
        sys.exit(1)
    print(f"OK（注意 {len(WARN)} 件）")


if __name__ == "__main__":
    main()
