# 岩石判読アプリ（Claude Code 向けの指示）

このリポジトリは、写真と肉眼観察から岩石（火成岩・堆積岩・変成岩・断層岩）を判読する Web アプリ。
公開先は GitHub Pages（https://z1170099-code.github.io/ganseki-handoku/ ）。main ブランチの直下がそのまま公開される。
持ち主はスマホの Claude Code からもこのリポジトリを直す。

## 持ち主について・話し方

- 地球科学（防災・災害）を学ぶ学生。プログラミングは初心者〜初中級。
- 日本語で答える。結論だけでなく「なぜそうするか」を短く添える。
- プログラミングの用語は平易な言葉で補う。地球科学の用語は正確な学術用語を使ってよい。
- アプリの文言は短く平易に。「つまり」「このように」で始まるまとめの文、飾りの言葉、同じことのくり返しを避ける。

## ファイルの役割

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の骨組みと見た目（CSS）。4 タブ：判定・図鑑・記録・設定 |
| `rocks.js` | 岩石データ（46 種）と観察チェックの項目。`window.ROCKS_DB = ` の右は JSON |
| `judge.js` | 観察チェックの点数づけ（AI を使わない判定）と「次に確かめる項目」 |
| `ai.js` | Gemini への問い合わせ、写真の縮小、写真の位置情報（EXIF）、シームレス地質図の凡例 |
| `app.js` | 画面の動き、保存（IndexedDB・localStorage）、書き出し・読み込み |
| `sw.js` | Service Worker。電波のない所でもアプリを開けるようにする |
| `tools/check_data.py` | データと部品の点検（ブラウザ不要） |
| `tools/e2e_test.py` | 実際の操作をまねたテスト（Playwright。Gemini と地質図は用意した返事に差し替える） |
| `tools/make_icons.py` | アイコンを作る |

## 直したら必ずやること

1. `python tools/check_data.py` を動かして NG が 0 件であること（どこでも動く）。
2. Playwright が使えるなら `python tools/e2e_test.py` も動かす（PC は Edge、なければ Chromium）。
   入っていなければ `pip install playwright && python -m playwright install chromium`。入れられない環境ならその旨を持ち主に伝える。
3. 見た目や動きを変えたら、`app.js` の `APP_VERSION` と `sw.js` の `SHELL` の末尾を同じ新しい版に上げる。
   上げないと、スマホのホーム画面に追加したアプリに古い版が残る（check_data.py が食い違いを点検する）。
4. 変更点をコミットする。main に入ると 1〜2 分で公開版に反映される。
   スマホ（クラウド）の作業ブランチで直したときは、持ち主に確認してから main へマージする。

## 守ること

- **岩石の `id` を変えない・消さない。** 記録（IndexedDB の records）が id で岩石を指している。名前を変えるのは `name` で。
- **保存の形を変えずに足す。** IndexedDB `ganseki-handoku`（`records`・`kv`）、localStorage の `ganseki.key` `ganseki.model` `ganseki.modelCustom` `ganseki.tab`、記録の項目（id, at, u, v, photos, ans, place, geo, ai, rule, final, memo）は消したり名前を変えたりしない。
- **API キーをコード・コミット・Issue に書かない。** キーは使う人の端末の localStorage にだけある。
- 公開リポジトリなので、持ち主の氏名・学籍番号・メールなどの個人情報を入れない。
- 岩石の説明・産地は学術的に正しく。自信のない産地は書かない。出典の書き方は「著者（年）」。

## 岩石データ（rocks.js）の書き方

- `p` は観察チェックの各項目について「よくある特徴」と「ありうる特徴」を並べる。例 `"color": "gray:2 dark:1"`。
  `2` = よくある、`1` = ありうる、書いていない選択肢 = 合わない特徴（答えると減点）。
- `min` は見える鉱物、`minNo` は「ふつう見えない」鉱物（選ばれると減点）。
- 選択肢のコードは `features` の `opts[].v` だけが使える。新しい項目・選択肢を足したら、`tools/check_data.py` と自己点検（`index.html#selftest`：各岩石のよくある特徴で答えると 3 位以内に来るか）を通す。
- 岩石を足したら `similar`（似ている岩石と見分け方）も書く。

## AI（Gemini）

- 既定のモデルは `gemini-3.5-flash`、混雑（5xx）・回数切れ（429）・見つからない（404）のときは `gemini-flash-lite-latest` でやり直す（`ai.js`）。
- 問い合わせ先は `https://generativelanguage.googleapis.com/v1beta/`。キーは URL ではなく `x-goog-api-key` ヘッダーで送る。
- 答えは JSON の形（`responseSchema`）で受け取り、`normalize()` で存在しないコードを捨てて図鑑の岩石に結びつける。
- 無料枠の 1 日の回数は太平洋時間 0 時（日本時間 16〜17 時）に戻る。

## 外部のデータ

- 地質図の凡例：産総研地質調査総合センター「20万分の1日本シームレス地質図 V2」の legend API
  `https://gbank.gsj.jp/seamless/v2/api/1.2/legend.json?point=緯度,経度`（CORS 許可あり、CC BY 4.0。出典の表示を消さない）。
