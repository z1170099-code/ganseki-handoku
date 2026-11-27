/* 岩石判読：AI（Gemini）と外部データ
 * - 写真を縮める（長い辺 1280px の JPEG）
 * - Gemini に写真と観察を送り、候補を JSON で受け取る（混雑・回数切れのときは軽いモデルでやり直す）
 *   写真の主役が鉱物（水晶・黄鉄鉱など）なら、鉱物の候補を返してもらう（subject = mineral）
 * - 位置から 20万分の1日本シームレス地質図 V2 の凡例を引く（産総研 地質調査総合センター）
 * - 写真の位置情報（EXIF の GPS）を読む
 * API キーは呼び出し側（app.js）が端末の localStorage から渡す。ここには書かない。
 */
(function () {
  'use strict';
  const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const DEFAULT_MODEL = 'gemini-3.5-flash';
  const FALLBACK_MODEL = 'gemini-flash-lite-latest';
  const TIMEOUT = 120000;

  class AIError extends Error {
    constructor(msg, kind, status) { super(msg); this.kind = kind || 'error'; this.status = status || 0; }
  }

  // ---------- 写真 ----------
  function loadImg(blob) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); res(im); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('画像を読めませんでした')); };
      im.src = u;
    });
  }
  async function resizeImage(file, max, q) {
    max = max || 1280; q = q || 0.85;
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { src = await loadImg(file); }
    const w0 = src.width, h0 = src.height;
    const sc = Math.min(1, max / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * sc)), h = Math.max(1, Math.round(h0 * sc));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    if (src.close) src.close();
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('画像を変換できませんでした'))), 'image/jpeg', q));
  }
  function blobToB64(blob) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(',')[1] || '');
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  // ---------- 写真の位置情報（EXIF GPS） ----------
  async function exifGps(file) {
    try {
      const buf = await file.slice(0, 256 * 1024).arrayBuffer();
      const v = new DataView(buf);
      if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null;
      let off = 2;
      while (off + 4 < v.byteLength) {
        const marker = v.getUint16(off);
        const len = v.getUint16(off + 2);
        if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) return tiffGps(v, off + 10);
        if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        off += 2 + len;
      }
    } catch (e) { /* 読めない写真は位置なし */ }
    return null;
  }
  function tiffGps(v, t) {
    const le = v.getUint16(t) === 0x4949;
    const u16 = (o) => v.getUint16(o, le), u32 = (o) => v.getUint32(o, le);
    const ifd0 = t + u32(t + 4);
    let gps = null;
    for (let i = 0, n = u16(ifd0); i < n; i++) {
      const e = ifd0 + 2 + i * 12;
      if (u16(e) === 0x8825) gps = t + u32(e + 8);
    }
    if (gps == null) return null;
    const g = {};
    for (let i = 0, n = u16(gps); i < n; i++) {
      const e = gps + 2 + i * 12, tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
      if (tag === 1 || tag === 3) g[tag] = String.fromCharCode(v.getUint8(e + 8));
      else if ((tag === 2 || tag === 4) && type === 5 && cnt === 3) {
        const p = t + u32(e + 8);
        const r = (k) => { const d = u32(p + k * 8 + 4); return d ? u32(p + k * 8) / d : 0; };
        g[tag] = r(0) + r(1) / 60 + r(2) / 3600;
      }
    }
    if (!g[2] || !g[4]) return null;
    return { lat: g[1] === 'S' ? -g[2] : g[2], lon: g[3] === 'W' ? -g[4] : g[4] };
  }

  // ---------- 地質図（シームレス地質図 V2 の凡例） ----------
  async function fetchT(url, opt, ms) {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), ms);
    try { return await fetch(url, Object.assign({}, opt, { signal: ac.signal })); }
    finally { clearTimeout(tm); }
  }
  async function geology(lat, lon) {
    const u = 'https://gbank.gsj.jp/seamless/v2/api/1.2/legend.json?point=' + lat.toFixed(5) + ',' + lon.toFixed(5);
    let r;
    try { r = await fetchT(u, {}, 15000); }
    catch (e) { throw new Error('地質図に問い合わせできませんでした（ネット接続を確認）'); }
    if (!r.ok) throw new Error('地質図の凡例を取れませんでした（' + r.status + '）');
    const txt = await r.text();
    let j = null;
    try { j = JSON.parse(txt); } catch (e) { j = null; }
    if (!j || !j.symbol) return { none: true };
    return { symbol: j.symbol, age: j.formationAge_ja || '', group: j.group_ja || '', lith: j.lithology_ja || '', rgb: [j.r, j.g, j.b] };
  }

  // ---------- Gemini ----------
  const OBS_FIELDS = ['fabric', 'clast', 'grain', 'struct', 'color', 'luster'];
  const SCHEMA = {
    type: 'OBJECT',
    properties: {
      is_rock: { type: 'BOOLEAN' },
      subject: { type: 'STRING', enum: ['rock', 'mineral', 'fossil', 'other'] },
      photo_note: { type: 'STRING' },
      observed: {
        type: 'OBJECT',
        properties: {
          fabric: { type: 'STRING' }, clast: { type: 'STRING' }, grain: { type: 'STRING' },
          struct: { type: 'STRING' }, color: { type: 'STRING' }, luster: { type: 'STRING' },
          minerals: { type: 'ARRAY', items: { type: 'STRING' } },
        },
      },
      candidates: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            name: { type: 'STRING' },
            kind: { type: 'STRING', enum: ['rock', 'mineral', 'other'] },
            confidence: { type: 'INTEGER' },
            props: { type: 'STRING' },
            reasons: { type: 'ARRAY', items: { type: 'STRING' } },
            against: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['id', 'name', 'confidence', 'reasons'],
        },
      },
      next_checks: { type: 'ARRAY', items: { type: 'STRING' } },
      comment: { type: 'STRING' },
    },
    required: ['is_rock', 'candidates', 'observed'],
  };

  function buildPrompt(input) {
    const J = window.Judge;
    const L = [];
    L.push('あなたは日本の大学で岩石学・鉱物学を教えている教員です。写真の石（岩石の手標本・露頭、または鉱物の標本）を、肉眼とルーペで観察できる範囲で判定してください。');
    L.push('');
    L.push('# 守ること');
    L.push('- 写真に実際に見える特徴だけを根拠にする。写真ではわからない性質（硬さ・塩酸との反応・重さ・磁性）は、下の「利用者の観察」にあればそれを使い、なければ next_checks に回す。');
    L.push('- candidates は可能性の高い順に最大5つ。confidence は 0〜100 の整数で、合計が100を超えないようにする。写真だけで決めきれないときは、高い数字をつけない。');
    L.push('- subject は写真の主役：岩石なら "rock"、鉱物の結晶や鉱物の塊（水晶・黄鉄鉱・方解石・蛍石・ざくろ石など）なら "mineral"、化石が主役なら "fossil"、石でない物（人工物など）なら "other"。');
    L.push('- 岩石のとき：candidates の id は下の「岩石リスト」の id を使い、kind は "rock"。リストにない岩石なら id を "other" にして name に岩石名を書く。人工物（コンクリート・れんが・スラグなど）も id "other"、kind "other"。');
    L.push('- 鉱物のとき：candidates は鉱物にし、id は "mineral"、kind は "mineral"、name は「和名（英名）」の形（例：石英（quartz）、黄鉄鉱（pyrite））。宝石名より鉱物名を使う（例：紫水晶 → 石英（紫水晶））。');
    L.push('- 鉱物の候補には props に、見分けに使う性質を短く書く：モース硬度・条痕の色・光沢・へき開や割れ方・結晶の形・比重の感じ（例：「硬度 7・条痕 白・ガラス光沢・へき開なし・六角柱状」）。岩石の候補では props は空でよい。');
    L.push('- is_rock は、写真の主役が岩石・鉱物・化石なら true、それ以外は false。');
    L.push('- reasons（根拠）と against（合わない点・不確かな点）は、写真のどこに何が見えるかを具体的に、短い日本語の文で書く。');
    L.push('- observed には、写真から読み取れた特徴を下の「観察の選択肢」のコードで入れる。判断できない項目は "unknown"。minerals は見えた鉱物のコードの配列（なければ空）。');
    L.push('- next_checks には、候補をしぼるために利用者が現物で確かめるとよいことを2〜4個。家にある物で一般の人にもできる方法を優先する（例：鉄くぎで傷がつくか、酢をかけて泡が出るか、白い陶器の裏（素焼きの所）にこすって粉の色〔条痕〕を見る、磁石につくか、ルーペで割ったばかりの面の粒を見る）。');
    L.push('- observed は岩石の観察の選択肢なので、鉱物のときは判断できる項目（color・luster など）だけ入れ、ほかは "unknown"。');
    L.push('- photo_note には、写真の撮り方で判定しにくかった点があれば一言（ピンぼけ・風化面だけ・大きさがわからない など）。なければ空。');
    L.push('- comment には、判定全体についての短いまとめや注意（1〜2文）。');
    L.push('- 日本語で書く。岩石学の用語は正確に使ってよい。');
    L.push('');
    L.push('# 岩石リスト（id: 名前）');
    for (const r of J.ROCKS) L.push(r.id + ': ' + r.name + '（' + r.groupName + '）');
    L.push('');
    L.push('# 観察の選択肢（observed に使うコード）');
    for (const fid of OBS_FIELDS.concat(['min'])) {
      const f = J.FMAP[fid];
      L.push((fid === 'min' ? 'minerals' : fid) + '（' + f.label + '）: ' + f.opts.map((o) => o.v + '=' + o.label).join(' / '));
    }
    L.push('');
    L.push('# 利用者の観察');
    const obs = [];
    for (const f of J.F) {
      const a = input.answers[f.id];
      if (J.isEmpty(a)) continue;
      if (f.multi) obs.push('- ' + f.label + ': ' + a.map((m) => J.optLabel(f.id, m)).join('、'));
      else obs.push('- ' + f.label + ': ' + (J.optOf(f.id, a) || {}).label);
    }
    L.push(obs.length ? obs.join('\n') : '（なし）');
    L.push('');
    L.push('# 場所');
    const pl = input.place || {};
    if (pl.lat != null) L.push('- 緯度経度: ' + pl.lat.toFixed(4) + ', ' + pl.lon.toFixed(4));
    if (pl.text) L.push('- メモ: ' + pl.text);
    if (input.answers.setting === 'float') L.push('- 転石（川原・海岸などで拾った石）。周りの地質と違う可能性がある。');
    const g = input.geo;
    if (g && !g.none) L.push('- この地点の 20万分の1日本シームレス地質図 V2 の凡例: ' + [g.age, g.group, g.lith].filter(Boolean).join(' / ') + '（位置のずれや転石もありうるので参考程度に）');
    if (pl.lat == null && !pl.text) L.push('（なし）');
    L.push('');
    L.push('写真は ' + input.photos.length + ' 枚です。');
    return L.join('\n');
  }

  function friendly(status, body, model) {
    const msg = (body && body.error && body.error.message) || '';
    const reason = JSON.stringify((body && body.error && body.error.details) || '');
    if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(msg + reason)) return new AIError('API キーが正しくありません。設定タブで貼り直してください。', 'key', status);
    if (status === 400) return new AIError('Gemini が依頼を受け付けませんでした（' + (msg || '400') + '）', 'bad', status);
    if (status === 401 || status === 403) return new AIError('この API キーでは Gemini を使えません（権限がない・制限がかかっている）。設定タブのキーを確かめてください。', 'key', status);
    if (status === 404) return new AIError('モデル「' + model + '」が見つかりません。', 'model', status);
    if (status === 429) return new AIError('無料枠の回数を使い切ったか、短い時間に送りすぎました。少し待ってからやり直してください（1日の枠は日本時間の16〜17時に戻ります）。', 'quota', status);
    if (status >= 500) return new AIError('Gemini が混みあっています。少し待ってからやり直してください。', 'busy', status);
    return new AIError('Gemini でエラーが起きました（' + status + ' ' + msg + '）', 'error', status);
  }

  async function callModel(model, key, body) {
    let r;
    try {
      r = await fetchT(API + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
      }, TIMEOUT);
    } catch (e) {
      if (e && e.name === 'AbortError') throw new AIError('Gemini の返事が ' + (TIMEOUT / 1000) + ' 秒以内に来ませんでした。電波のよい所でやり直してください。', 'timeout');
      throw new AIError('Gemini に接続できませんでした。ネットにつながっているか確かめてください。', 'net');
    }
    let j = null;
    try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok) throw friendly(r.status, j, model);
    return j;
  }

  function textOf(j) {
    if (j && j.promptFeedback && j.promptFeedback.blockReason) throw new AIError('Gemini が写真の判定を断りました（' + j.promptFeedback.blockReason + '）', 'blocked');
    const c = j && j.candidates && j.candidates[0];
    if (!c) throw new AIError('Gemini から答えが返ってきませんでした。', 'empty');
    const parts = (c.content && c.content.parts) || [];
    const t = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('');
    if (!t) throw new AIError('Gemini の答えが空でした（' + (c.finishReason || '理由不明') + '）', 'empty');
    return t;
  }

  function parseJSON(t) {
    try { return JSON.parse(t); } catch (e) { /* 前後に余計な文字があるとき */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* 下で失敗にする */ } }
    throw new AIError('Gemini の答えを読み取れませんでした。もう一度ためしてください。', 'parse');
  }

  // 答えを整える：存在しないコードを捨て、岩石 id を図鑑に結びつける
  function normalize(res) {
    const J = window.Judge;
    const subj = ['rock', 'mineral', 'fossil', 'other'].includes(res.subject) ? res.subject : (res.is_rock === false ? 'other' : 'rock');
    const out = {
      is_rock: res.is_rock !== false && subj !== 'other',
      subject: subj,
      photo_note: String(res.photo_note || ''),
      comment: String(res.comment || ''),
      observed: {},
      candidates: [],
      next_checks: (Array.isArray(res.next_checks) ? res.next_checks : []).map(String).filter(Boolean).slice(0, 5),
    };
    const ob = res.observed || {};
    for (const fid of OBS_FIELDS) if (ob[fid] && J.optOf(fid, ob[fid])) out.observed[fid] = ob[fid];
    if (Array.isArray(ob.minerals)) out.observed.min = ob.minerals.filter((m) => J.optOf('min', m) && m !== 'none');
    const seen = new Set();
    for (const c of Array.isArray(res.candidates) ? res.candidates : []) {
      const kind = ['rock', 'mineral', 'other'].includes(c.kind) ? c.kind : (c.id === 'mineral' ? 'mineral' : 'rock');
      let rock = kind === 'mineral' ? null : (J.BYID[c.id] || J.findRock(c.name));
      const id = rock ? rock.id : 'other';
      const key = rock ? id : kind + ':' + c.name;
      if (seen.has(key)) continue;
      seen.add(key);
      out.candidates.push({
        id: rock ? id : (kind === 'mineral' ? 'mineral' : 'other'),
        name: rock ? rock.name : String(c.name || '（名前なし）'),
        kind: rock ? 'rock' : kind,
        props: kind === 'mineral' ? String(c.props || '') : '',
        confidence: Math.max(0, Math.min(100, Math.round(Number(c.confidence) || 0))),
        reasons: (Array.isArray(c.reasons) ? c.reasons : []).map(String).filter(Boolean),
        against: (Array.isArray(c.against) ? c.against : []).map(String).filter(Boolean),
      });
    }
    out.candidates.sort((a, b) => b.confidence - a.confidence);
    out.candidates = out.candidates.slice(0, 5);
    return out;
  }

  async function identify(input, opt) {
    const key = (opt.key || '').trim();
    if (!key) throw new AIError('API キーが入っていません。設定タブで Gemini の API キーを入れてください。', 'nokey');
    if (!input.photos.length) throw new AIError('写真を1枚以上入れてください。', 'nophoto');
    const status = opt.onStatus || function () {};
    status('写真を準備しています…');
    const parts = [{ text: buildPrompt(input) }];
    for (const b of input.photos) parts.push({ inlineData: { mimeType: b.type || 'image/jpeg', data: await blobToB64(b) } });
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
    };
    const models = [opt.model || DEFAULT_MODEL];
    if (models[0] !== FALLBACK_MODEL) models.push(FALLBACK_MODEL);
    let last = null;
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      status(i === 0 ? 'Gemini（' + m + '）が写真を見ています…' : '混んでいたので ' + m + ' でやり直しています…');
      try {
        const j = await callModel(m, key, body);
        const res = normalize(parseJSON(textOf(j)));
        return { model: m, modelVersion: (j && j.modelVersion) || m, fellBack: i > 0, firstError: last ? last.message : '', result: res, at: new Date().toISOString() };
      } catch (e) {
        last = e;
        if (!(e instanceof AIError) || !['quota', 'busy', 'model', 'timeout', 'empty', 'parse'].includes(e.kind)) throw e;
      }
    }
    throw last;
  }

  async function ping(key, model) {
    const j = await callModel(model || DEFAULT_MODEL, (key || '').trim(), {
      contents: [{ role: 'user', parts: [{ text: '接続テストです。「OK」とだけ返してください。' }] }],
    });
    return textOf(j).trim();
  }

  window.AI = { DEFAULT_MODEL, FALLBACK_MODEL, AIError, resizeImage, exifGps, geology, buildPrompt, normalize, identify, ping, SCHEMA };
})();
