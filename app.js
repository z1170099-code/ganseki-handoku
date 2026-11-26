/* 岩石判読：画面の動き
 * 判定（写真・場所・観察チェック・AI・保存）／図鑑／記録／設定 の 4 タブ。
 * 保存先：記録と下書き＝IndexedDB「ganseki-handoku」（records・kv）、設定＝localStorage「ganseki.*」。
 * 保存の形（記録の項目名）は変えずに足すこと。変えると端末にたまった記録が読めなくなる。
 */
(function () {
  'use strict';
  const APP_VERSION = '1.1.0';
  const J = window.Judge, AI = window.AI;
  const LS = { key: 'ganseki.key', model: 'ganseki.model', modelCustom: 'ganseki.modelCustom', tab: 'ganseki.tab' };
  const MAX_PHOTOS = 3;

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = (o) => JSON.parse(JSON.stringify(o == null ? null : o));
  function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* 保存できない環境 */ } }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function ymd() { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[ァ-ン]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s/g, ''); }

  let toastTimer;
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms || 3200);
  }

  // ---------- 保存（IndexedDB） ----------
  const IDB = {
    _p: null,
    open() {
      if (this._p) return this._p;
      this._p = new Promise((res, rej) => {
        let r;
        try { r = indexedDB.open('ganseki-handoku', 1); } catch (e) { rej(e); return; }
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return this._p;
    },
    async req(store, mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction(store, mode);
        const rq = fn(tx.objectStore(store));
        let val;
        if (rq) rq.onsuccess = () => { val = rq.result; };
        tx.oncomplete = () => res(val);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    },
    get(store, key) { return this.req(store, 'readonly', (s) => s.get(key)); },
    put(store, val, key) { return this.req(store, 'readwrite', (s) => (key === undefined ? s.put(val) : s.put(val, key))); },
    del(store, key) { return this.req(store, 'readwrite', (s) => s.delete(key)); },
    all(store) { return this.req(store, 'readonly', (s) => s.getAll()); },
    count(store) { return this.req(store, 'readonly', (s) => s.count()); },
    clear(store) { return this.req(store, 'readwrite', (s) => s.clear()); },
  };

  // ---------- 状態 ----------
  const S = {
    photos: [],            // {id, blob, url}
    ans: {},               // 観察チェックの答え {fabric:'porphyritic', min:['plag','px'], ...}
    aiFilled: {},          // AI が入れた答え（印を付ける）
    place: { lat: null, lon: null, text: '', src: '' },
    geo: null, geoBusy: false, geoErr: '',
    ai: null, aiBusy: false, aiStatus: '', aiErr: null,
    savedId: null,         // 保存済みならその記録の id（もう一度保存すると上書き）
  };

  let draftTimer;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(async () => {
      try {
        await IDB.put('kv', {
          photos: S.photos.map((p) => p.blob), ans: S.ans, aiFilled: S.aiFilled, place: S.place, geo: S.geo, ai: S.ai,
          savedId: S.savedId, final: $('#inFinal').value, memo: $('#inMemo').value,
        }, 'draft');
      } catch (e) { /* 下書きが残せなくても動かす */ }
    }, 300);
  }
  async function restoreDraft() {
    let d = null;
    try { d = await IDB.get('kv', 'draft'); } catch (e) { d = null; }
    if (!d) return;
    S.photos = (d.photos || []).filter(Boolean).map((b) => ({ id: rid(), blob: b, url: URL.createObjectURL(b) }));
    S.ans = d.ans || {};
    S.aiFilled = d.aiFilled || {};
    S.place = Object.assign({ lat: null, lon: null, text: '', src: '' }, d.place || {});
    S.geo = d.geo || null;
    S.ai = d.ai || null;
    S.savedId = d.savedId || null;
    $('#inFinal').value = d.final || '';
    $('#inMemo').value = d.memo || '';
    $('#inPlace').value = S.place.text || '';
    if (S.place.lat != null) $('#inLatLon').value = S.place.lat.toFixed(5) + ', ' + S.place.lon.toFixed(5);
  }

  // ---------- 模式図（観察チェックの選択肢に添える小さな絵） ----------
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function illus(fid, v) {
    const W = 72, H = 48, R = rng(hash(fid + ':' + v));
    const r = (a, b) => a + (b - a) * R();
    const pick = (a) => a[Math.floor(R() * a.length)];
    const f1 = (n) => n.toFixed(1);
    let g = '';
    const bg = (c) => { g += '<rect width="' + W + '" height="' + H + '" fill="' + c + '"/>'; };
    const dots = (n, cols, r0, r1) => { for (let i = 0; i < n; i++) g += '<circle cx="' + f1(r(0, W)) + '" cy="' + f1(r(0, H)) + '" r="' + r(r0, r1).toFixed(2) + '" fill="' + pick(cols) + '"/>'; };
    const poly = (pts, c, extra) => { g += '<polygon points="' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' ') + '" fill="' + c + '"' + (extra || '') + '/>'; };
    const shard = (cx, cy, s, c) => { const n = 3 + Math.floor(R() * 3), a0 = r(0, 6.28), pts = []; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * 6.28 + r(-0.3, 0.3); pts.push([cx + Math.cos(a) * s * r(0.6, 1.1), cy + Math.sin(a) * s * r(0.6, 1.1)]); } poly(pts, c); };
    const wave = (y, amp, fr, ph, col, w) => { let d = 'M0,' + f1(y); for (let x = 3; x <= W; x += 3) d += ' L' + x + ',' + f1(y + amp * Math.sin(x * fr + ph)); g += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + w + '" fill="none"/>'; };
    switch (fid + ':' + v) {
      case 'fabric:crystalline': {
        const nx = 7, ny = 5, P = [];
        for (let i = 0; i <= nx; i++) { P[i] = []; for (let j = 0; j <= ny; j++) P[i][j] = [i * W / nx + (i % nx ? r(-3, 3) : 0), j * H / ny + (j % ny ? r(-3, 3) : 0)]; }
        const cols = ['#f3efe8', '#e9c3a8', '#fbfaf7', '#d6d0c7', '#2f2a26', '#efe8dd', '#e2b294', '#3a3430'];
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) poly([P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1]], pick(cols), ' stroke="#a59c90" stroke-width=".4"');
        break;
      }
      case 'fabric:porphyritic':
        bg('#878079'); dots(170, ['#756e68', '#9d968f', '#6a645e'], 0.3, 0.7);
        for (let i = 0; i < 8; i++) { const x = r(3, W - 12), y = r(3, H - 8), w = r(7, 12), h = r(3, 5); g += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="#f7f4ee" transform="rotate(' + f1(r(-50, 50)) + ' ' + f1(x + w / 2) + ' ' + f1(y + h / 2) + ')"/>'; }
        for (let i = 0; i < 3; i++) { const x = r(4, W - 8), y = r(4, H - 8); g += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(r(3, 5)) + '" height="' + f1(r(1.5, 2.5)) + '" fill="#1e1b19" transform="rotate(' + f1(r(-60, 60)) + ' ' + f1(x) + ' ' + f1(y) + ')"/>'; }
        break;
      case 'fabric:clastic':
        bg('#cdbb9c'); dots(120, ['#b9a582', '#ddd0b8'], 0.3, 0.6);
        for (let i = 0; i < 12; i++) { const rx = r(3, 7), cx = r(3, W - 3), cy = r(3, H - 3); g += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(rx * r(0.6, 0.9)) + '" fill="' + pick(['#8e8a85', '#6f6a63', '#b8b0a4', '#e7e0d3', '#a0785a']) + '" transform="rotate(' + f1(r(0, 180)) + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
        break;
      case 'fabric:massive':
        bg('#6e6964'); dots(90, ['#66615c', '#78736e'], 0.3, 0.8);
        break;
      case 'fabric:vesicular':
        bg('#4f4844'); dots(26, ['#1d1a18'], 1.2, 4); dots(30, ['#6a625c'], 0.3, 0.7);
        break;
      case 'fabric:pyroclastic':
        bg('#d8d0bf'); dots(140, ['#c8bfac', '#e6e0d2', '#b9ae99'], 0.3, 0.6);
        for (let i = 0; i < 10; i++) shard(r(4, W - 4), r(4, H - 4), r(2.5, 6), pick(['#f6f3ec', '#5a5550', '#9b8f7c', '#7d6a57', '#f9f7f1']));
        break;
      case 'clast:round':
        bg('#cbb99a'); dots(100, ['#b8a684', '#ddd2bd'], 0.3, 0.6);
        for (let i = 0; i < 8; i++) { const rx = r(4, 8); g += '<ellipse cx="' + f1(r(5, W - 5)) + '" cy="' + f1(r(5, H - 5)) + '" rx="' + f1(rx) + '" ry="' + f1(rx * r(0.65, 0.95)) + '" fill="' + pick(['#8e8a85', '#6f6a63', '#b8b0a4', '#ebe5da', '#9a7258']) + '"/>'; }
        break;
      case 'clast:angular':
        bg('#c9bca6'); dots(100, ['#b6a88f', '#dcd2c0'], 0.3, 0.6);
        for (let i = 0; i < 9; i++) shard(r(5, W - 5), r(5, H - 5), r(4, 8), pick(['#77716a', '#4d4844', '#a39a8e', '#e9e3d8', '#8a6a52']));
        break;
      case 'clast:noclast':
        bg('#a8a097'); dots(160, ['#9a9289', '#b8b1a8', '#8f877e'], 0.3, 0.8);
        break;
      case 'struct:none':
        bg('#bdb6ad'); dots(190, ['#8f877e', '#e6e1da', '#6d665f', '#d2ccc4'], 0.4, 1.2);
        break;
      case 'struct:bedding': {
        let y = 0; const cols = ['#d8c7a5', '#b39b75', '#e6dac3', '#9f8662', '#cbb894'];
        while (y < H) { const h = r(5, 11), c = pick(cols); g += '<rect x="0" y="' + f1(y) + '" width="' + W + '" height="' + f1(h + 0.5) + '" fill="' + c + '"/>'; const s = r(0.3, 1.1); for (let i = 0; i < 30; i++) g += '<circle cx="' + f1(r(0, W)) + '" cy="' + f1(r(y, y + h)) + '" r="' + s.toFixed(2) + '" fill="rgba(60,45,30,.35)"/>'; y += h; }
        break;
      }
      case 'struct:flow':
        bg('#e8dfd2');
        for (let i = 0; i < 8; i++) wave(3 + i * 6 + r(-1, 1), r(1.5, 3), 0.09 + r(0, 0.03), r(0, 6), pick(['#c8b9a6', '#a99683', '#d9cbb8', '#b9a38c']), r(0.8, 2));
        break;
      case 'struct:slaty':
        bg('#3e4145');
        for (let x = -H; x < W + H; x += 3) g += '<line x1="' + x + '" y1="0" x2="' + (x + H * 0.35) + '" y2="' + H + '" stroke="' + (x % 2 ? '#4f5358' : '#585c61') + '" stroke-width="1"/>';
        break;
      case 'struct:phyllitic':
        bg('#55595d');
        for (let y = 2; y < H; y += 3.2) { let d = 'M0,' + f1(y); for (let x = 2; x <= W; x += 2) d += ' L' + x + ',' + f1(y + ((x / 2) % 2 ? 0.9 : -0.9)); g += '<path d="' + d + '" stroke="' + pick(['#8a9096', '#9fa6ad', '#737980']) + '" stroke-width=".7" fill="none"/>'; }
        break;
      case 'struct:schistose':
        bg('#4b5049');
        for (let i = 0; i < 70; i++) { const x = r(-4, W), y = r(0, H); g += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(r(3, 7)) + '" ry="' + f1(r(0.6, 1.3)) + '" fill="' + pick(['#9aa39a', '#c9d1c9', '#7f8a7f', '#b5bdb2']) + '" transform="rotate(-8 ' + f1(x) + ' ' + f1(y) + ')"/>'; }
        dots(14, ['#ffffff'], 0.3, 0.6);
        break;
      case 'struct:gneissic': {
        let y = -2;
        while (y < H + 4) { const h = r(3, 7), dark = Math.floor(y) % 2 === 0; let d = 'M0,' + f1(y); for (let x = 4; x <= W; x += 4) d += ' L' + x + ',' + f1(y + 1.6 * Math.sin(x * 0.1 + y)); g += '<path d="' + d + '" stroke="' + (dark ? '#36322f' : '#ece6dc') + '" stroke-width="' + f1(h) + '" fill="none"/>'; y += h * 0.95; }
        break;
      }
      case 'struct:sheared': {
        bg('#7a756f');
        const A = [[22, 18], [52, 31]];
        for (let y0 = 1; y0 < H; y0 += 3) {
          let d = '';
          for (let x = 0; x <= W; x += 2) {
            let y = y0;
            for (const [ax, ay] of A) y += (y0 > ay ? 1 : -1) * 5 * Math.exp(-((x - ax) * (x - ax)) / 70) * Math.exp(-((y0 - ay) * (y0 - ay)) / 60);
            d += (x ? ' L' : 'M') + x + ',' + f1(y);
          }
          g += '<path d="' + d + '" stroke="' + pick(['#5f5a55', '#97918a', '#6b6660']) + '" stroke-width=".9" fill="none"/>';
        }
        for (const [ax, ay] of A) g += '<path d="M' + (ax - 9) + ',' + (ay + 2) + ' Q' + ax + ',' + (ay - 6) + ' ' + (ax + 9) + ',' + (ay - 2) + ' Q' + ax + ',' + (ay + 6) + ' ' + (ax - 9) + ',' + (ay + 2) + 'Z" fill="#f2ede4"/>';
        break;
      }
      default:
        bg('#cccccc');
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + g + '</svg>';
  }

  // ---------- 共通の小物 ----------
  function gb(rock) { return '<span class="gb" data-g="' + esc(rock.group) + '">' + esc(rock.groupName) + '</span>'; }
  function rockName(id) { const r = J.BYID[id]; return r ? r.name : id; }

  // ---------- タブ ----------
  let curTab = 'judge';
  function switchTab(t) {
    curTab = t;
    for (const b of $$('#tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === t));
    for (const s of $$('.tab')) s.hidden = s.id !== 'tab-' + t;
    lsSet(LS.tab, t);
    window.scrollTo(0, 0);
    if (t === 'zukan') renderZukan();
    if (t === 'records') renderRecords();
    if (t === 'settings') renderSettings();
    renderMini();
  }

  // ---------- 1. 写真 ----------
  function renderPhotos() {
    $('#photoGrid').innerHTML = S.photos.map((p, i) => '<div class="ph"><img src="' + p.url + '" alt="写真' + (i + 1) + '" data-ph="' + p.id + '"><button type="button" data-delph="' + p.id + '" aria-label="写真' + (i + 1) + 'を消す">×</button></div>').join('');
    const full = S.photos.length >= MAX_PHOTOS;
    $('#lblCam').toggleAttribute('hidden', full);
    $('#lblPick').toggleAttribute('hidden', full);
  }
  async function addFiles(files) {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name || ''));
    if (!list.length) return;
    const room = MAX_PHOTOS - S.photos.length;
    if (room <= 0) { toast('写真は' + MAX_PHOTOS + '枚までです。消してから足してください'); return; }
    if (list.length > room) toast(MAX_PHOTOS + '枚までなので、はじめの' + room + '枚を入れます');
    for (const f of list.slice(0, room)) {
      try {
        if (S.place.lat == null) {
          const gps = await AI.exifGps(f);
          if (gps) { setPlace(gps.lat, gps.lon, 'exif'); toast('写真の位置情報から場所を入れました'); }
        }
        const b = await AI.resizeImage(f);
        S.photos.push({ id: rid(), blob: b, url: URL.createObjectURL(b) });
      } catch (e) {
        toast('写真を読めませんでした：' + ((e && e.message) || e));
      }
    }
    renderPhotos(); renderAi(); saveDraft();
  }
  function removePhoto(id) {
    const i = S.photos.findIndex((p) => p.id === id);
    if (i < 0) return;
    URL.revokeObjectURL(S.photos[i].url);
    S.photos.splice(i, 1);
    renderPhotos(); renderAi(); saveDraft();
  }

  // ---------- 2. 場所と地質図 ----------
  function setPlace(lat, lon, src) {
    S.place.lat = lat; S.place.lon = lon; S.place.src = src || '';
    $('#inLatLon').value = lat.toFixed(5) + ', ' + lon.toFixed(5);
    fetchGeo();
    saveDraft();
  }
  function clearPlace() {
    S.place.lat = null; S.place.lon = null; S.place.src = '';
    S.geo = null; S.geoErr = '';
    renderGeo(); saveDraft();
  }
  async function fetchGeo() {
    if (S.place.lat == null) return;
    S.geoBusy = true; S.geoErr = ''; renderGeo();
    try { S.geo = await AI.geology(S.place.lat, S.place.lon); }
    catch (e) { S.geo = null; S.geoErr = (e && e.message) || String(e); }
    S.geoBusy = false;
    renderGeo(); saveDraft();
  }
  function geoLink(lat, lon) { return 'https://maps.gsi.go.jp/#15/' + lat.toFixed(5) + '/' + lon.toFixed(5) + '/'; }
  function geoText(g) { return g && !g.none ? [g.group, g.age, g.lith].filter(Boolean).join(' / ') : ''; }
  function renderGeo() {
    const box = $('#geoBox');
    const p = S.place;
    if (p.lat == null) { box.innerHTML = ''; return; }
    const src = p.src === 'exif' ? '写真の位置情報から・' : p.src === 'gps' ? '現在地・' : '';
    const link = '<a href="' + geoLink(p.lat, p.lon) + '" target="_blank" rel="noopener">地理院地図で見る</a>';
    if (S.geoBusy) { box.innerHTML = '<div class="geo"><span class="spin"></span>この地点の地質図（シームレス地質図）を調べています…</div>'; return; }
    if (S.geoErr) { box.innerHTML = '<div class="geo">' + esc(S.geoErr) + ' <button class="btn ghost" type="button" id="btnGeoRetry">もう一度</button><small>' + src + link + '</small></div>'; return; }
    const g = S.geo;
    if (!g) { box.innerHTML = ''; return; }
    if (g.none) { box.innerHTML = '<div class="geo">この地点には地質図の凡例がありません（海の上など）。<small>' + src + link + '</small></div>'; return; }
    const sw = g.rgb && g.rgb[0] != null ? '<span class="sw" style="background:rgb(' + g.rgb.map(Number).join(',') + ')"></span>' : '';
    box.innerHTML = '<div class="geo" id="geoInfo">' + sw + '<b>' + esc(g.group) + '</b>　' + esc(g.age) + '<br>' + esc(g.lith) +
      '<small>地質図の凡例はこの地点の推定です（転石や位置のずれもありえます）。' + src + link + '<br>出典：産総研地質調査総合センター 20万分の1日本シームレス地質図 V2</small></div>';
  }

  // ---------- 3. 観察チェック ----------
  const GROUP_LABEL = { photo: '写真でもわかること', hand: '現物で確かめること', place: '産状' };
  const TILES = new Set(['fabric', 'clast', 'struct']);
  function buildObs() {
    let html = '', lastG = '';
    for (const f of J.F) {
      if (f.group !== lastG) { html += '<div class="qgroup">' + esc(GROUP_LABEL[f.group] || '') + '</div>'; lastG = f.group; }
      html += '<div class="q" id="q-' + f.id + '"><div class="qh"><b>' + esc(f.label) + '</b>' +
        (f.help ? '<button type="button" class="qhelp" data-help="' + f.id + '">見かた</button>' : '') + '</div>' +
        (f.help ? '<p class="qtext" id="help-' + f.id + '" hidden>' + esc(f.help) + '</p>' : '') +
        '<div class="chips' + (TILES.has(f.id) ? ' tiles' : '') + '">';
      for (const o of f.opts) {
        html += '<button type="button" class="chip" data-f="' + f.id + '" data-v="' + o.v + '" aria-pressed="false">' +
          (TILES.has(f.id) ? illus(f.id, o.v) : '') + '<span>' + esc(o.label) + '<em class="mk"></em>' + (o.help ? '<small>' + esc(o.help) + '</small>' : '') + '</span></button>';
      }
      html += '</div></div>';
    }
    $('#obsForm').innerHTML = html;
    updateChips();
  }
  function updateChips() {
    for (const c of $$('#obsForm .chip')) {
      const f = c.dataset.f, v = c.dataset.v, a = S.ans[f];
      const on = Array.isArray(a) ? a.includes(v) : a === v;
      c.setAttribute('aria-pressed', String(on));
      const byAi = on && (S.aiFilled[f] || []).includes(v);
      $('.mk', c).innerHTML = byAi ? '<span class="ai-mark">AI</span>' : '';
    }
  }
  function toggleChip(f, v) {
    const feat = J.FMAP[f];
    if (!feat) return;
    if (feat.multi) {
      const arr = (S.ans[f] || []).slice();
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      if (arr.length) S.ans[f] = arr; else delete S.ans[f];
    } else if (S.ans[f] === v) delete S.ans[f];
    else S.ans[f] = v;
    if (S.aiFilled[f]) { S.aiFilled[f] = S.aiFilled[f].filter((x) => x !== v); if (!S.aiFilled[f].length) delete S.aiFilled[f]; }
    updateChips(); renderRule(); renderAi(); saveDraft();
  }

  // ---------- 観察からの候補 ----------
  let lastRanked = [];
  function whyHtml(sc) {
    const hits = sc.hits.slice().sort((a, b) => (b.strong ? 1 : 0) - (a.strong ? 1 : 0)).slice(0, 6);
    return hits.map((h) => '<span class="y">✓ ' + esc(J.optLabel(h.f, h.v)) + '</span>').join('') +
      sc.misses.map((m) => '<span class="n" title="' + esc(m.expect && m.expect.length ? 'この岩石では：' + m.expect.map((x) => J.optLabel(m.f, x)).join('・') : '') + '">✗ ' + esc(J.optLabel(m.f, m.v)) + '</span>').join('');
  }
  function renderRule() {
    const box = $('#ruleBox');
    const n = J.answered(S.ans);
    if (!n) {
      lastRanked = [];
      box.innerHTML = '<p class="empty">観察チェックに答えると、合いそうな岩石がここに順に出ます。</p>';
      renderMini();
      return;
    }
    const ranked = J.rank(S.ans);
    lastRanked = ranked;
    let html = '<ol class="cands">';
    ranked.slice(0, 6).forEach((sc, i) => {
      const r = J.BYID[sc.id];
      html += '<li class="cand" data-g="' + esc(r.group) + '"><div class="cand-h"><span class="no">' + (i + 1) + '</span><button type="button" class="rname" data-rock="' + r.id + '">' + esc(r.name) + '</button>' + gb(r) +
        '<span class="pct">' + sc.pct + '%</span></div><div class="bar"><i style="width:' + sc.pct + '%"></i></div><div class="why">' + whyHtml(sc) + '</div></li>';
    });
    html += '</ol>';
    const nx = J.nextQuestion(S.ans, ranked);
    if (nx) {
      html += '<div class="next">次に <b>' + esc(nx.label) + '</b> を確かめると絞りこめます。<br><span class="small">' +
        nx.groups.map((g) => esc(g.key) + ' → ' + esc(g.names.join('・'))).join('<br>') +
        '</span><br><button type="button" class="btn ghost" data-goto="' + nx.f + '">その項目へ</button></div>';
    }
    if (n < 3) html += '<p class="small">答えが少ないうちは、順位が大きく入れ替わります。</p>';
    box.innerHTML = html;
    renderMini();
  }
  let ruleVisible = false;
  function renderMini() {
    const m = $('#mini');
    const show = curTab === 'judge' && lastRanked.length && !ruleVisible && $('#sheet').hidden;
    m.hidden = !show;
    if (!show) return;
    $('#miniTops').innerHTML = lastRanked.slice(0, 3).map((sc, i) => '<b>' + (i + 1) + '. ' + esc(rockName(sc.id)) + '</b><i>' + sc.pct + '%</i>').join('');
  }

  // ---------- 4. AI ----------
  function getKey() { return lsGet(LS.key, ''); }
  function getModel() {
    const m = lsGet(LS.model, AI.DEFAULT_MODEL);
    if (m === 'custom') return (lsGet(LS.modelCustom, '') || AI.DEFAULT_MODEL).trim();
    return m;
  }
  function unansweredObserved() {
    if (!S.ai || !S.ai.result) return 0;
    const ob = S.ai.result.observed || {};
    let n = 0;
    for (const k of Object.keys(ob)) {
      if (k === 'min') { if (J.isEmpty(S.ans.min) && ob.min.length) n++; }
      else if (J.isEmpty(S.ans[k])) n++;
    }
    return n;
  }
  function renderAi() {
    const box = $('#aiBox');
    const btn = $('#btnAi');
    btn.disabled = S.aiBusy;
    btn.textContent = S.ai ? '写真と観察でもう一度 AI に見てもらう' : '写真と観察を AI に見てもらう';
    if (S.aiBusy) { box.innerHTML = '<div class="msg info"><span class="spin"></span>' + esc(S.aiStatus) + '</div>'; return; }
    let html = '';
    if (S.aiErr) {
      html += '<div class="msg err">' + esc(S.aiErr.message) + '</div>';
      if (['key', 'nokey'].includes(S.aiErr.kind)) html += '<div class="row" style="margin-top:8px"><button type="button" class="btn" data-tab-go="settings">設定タブを開く</button></div>';
    }
    if (!S.ai) {
      if (!S.aiErr) {
        if (!getKey()) html += '<p class="hint">AI 判定には Gemini の API キーが要ります（無料枠あり）。<a href="#" data-tab-go="settings">設定タブで入れる</a></p>';
        else if (!S.photos.length) html += '<p class="hint">写真を入れてから押してください。観察チェックの答えも一緒に AI に渡します。</p>';
        else html += '<p class="hint">写真 ' + S.photos.length + ' 枚と、観察チェックの答え・場所を AI に渡します。</p>';
      }
      box.innerHTML = html;
      return;
    }
    const res = S.ai.result;
    if (!res.is_rock) html += '<div class="msg warn">写真の主役が岩石ではないようです。岩石の新しい割れ口が大きく写るように撮り直すと判定しやすくなります。</div>';
    if (res.photo_note) html += '<div class="msg info">撮り方について：' + esc(res.photo_note) + '</div>';
    const nAns = J.answered(S.ans);
    html += '<ol class="cands" style="margin-top:8px">';
    res.candidates.forEach((c, i) => {
      const rock = J.BYID[c.id];
      const rule = rock && nAns >= 2 ? J.scoreRock(rock, S.ans).pct : null;
      html += '<li class="cand" data-g="' + esc(rock ? rock.group : 'other') + '"><div class="cand-h"><span class="no">' + (i + 1) + '</span>' +
        (rock ? '<button type="button" class="rname" data-rock="' + rock.id + '">' + esc(rock.name) + '</button>' + gb(rock) : '<b>' + esc(c.name) + '</b><span class="gb" data-g="other">図鑑にない</span>') +
        '<span class="pct">' + c.confidence + '%</span></div><div class="bar"><i style="width:' + c.confidence + '%"></i></div>' +
        (rule != null ? '<div class="why"><span class="' + (rule >= 60 ? 'y' : 'n') + '">観察チェックとの一致 ' + rule + '%</span></div>' : '') +
        (c.reasons.length ? '<ul class="ul ok">' + c.reasons.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (c.against.length ? '<ul class="ul ng">' + c.against.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '</li>';
    });
    if (!res.candidates.length) html += '<li class="cand empty">候補が返ってきませんでした。</li>';
    html += '</ol>';
    if (res.next_checks.length) html += '<div class="next"><b>現物で確かめるとよいこと</b><ul class="ul" style="margin-left:0">' + res.next_checks.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
    if (res.comment) html += '<p class="small">' + esc(res.comment) + '</p>';
    const nObs = unansweredObserved();
    if (nObs) html += '<div class="row" style="margin-top:10px"><button type="button" class="btn" id="btnAiFill">AI が写真から読み取った特徴を観察チェックに入れる（' + nObs + '項目）</button></div>';
    html += '<p class="small">数字は AI がつけた確からしさの目安です。モデル：' + esc(S.ai.modelVersion || S.ai.model) + (S.ai.fellBack ? '（混雑のため切り替え）' : '') + '・' + esc(fmtDate(S.ai.at)) + '</p>';
    box.innerHTML = html;
  }
  async function runAi() {
    if (S.aiBusy) return;
    if (!S.photos.length) { toast('写真を1枚以上入れてください'); $('#secPhotos').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const key = getKey();
    if (!key) { S.aiErr = new AI.AIError('API キーが入っていません。設定タブで Gemini の API キーを入れてください。', 'nokey'); renderAi(); return; }
    if (navigator.onLine === false) { S.aiErr = new AI.AIError('電波がないようです。AI 判定はネットにつながっているときに使えます（観察チェックは電波がなくても使えます）。', 'net'); renderAi(); return; }
    S.aiBusy = true; S.aiErr = null; S.aiStatus = '準備しています…';
    renderAi();
    try {
      S.place.text = $('#inPlace').value.trim();
      S.ai = await AI.identify({ photos: S.photos.map((p) => p.blob), answers: S.ans, place: S.place, geo: S.geo },
        { key, model: getModel(), onStatus: (t) => { S.aiStatus = t; renderAi(); } });
    } catch (e) {
      S.aiErr = e instanceof AI.AIError ? e : new AI.AIError(String((e && e.message) || e));
    }
    S.aiBusy = false;
    renderAi(); updatePlaceholder(); saveDraft();
  }
  function fillFromAi() {
    if (!S.ai) return;
    const ob = S.ai.result.observed || {};
    let n = 0;
    for (const k of Object.keys(ob)) {
      if (k === 'min') {
        if (J.isEmpty(S.ans.min) && ob.min.length) { S.ans.min = ob.min.slice(); S.aiFilled.min = ob.min.slice(); n++; }
      } else if (J.isEmpty(S.ans[k])) { S.ans[k] = ob[k]; S.aiFilled[k] = [ob[k]]; n++; }
    }
    updateChips(); renderRule(); renderAi(); saveDraft();
    toast(n ? n + ' 項目を入れました（AI の印つき）。現物を見て直してください' : '入れられる項目はありませんでした（答えてある項目は変えません）', 4500);
  }

  // ---------- 5. 保存 ----------
  function updatePlaceholder() {
    let s = '';
    if (S.ai && S.ai.result.candidates[0]) s = S.ai.result.candidates[0].name;
    else if (lastRanked[0]) s = rockName(lastRanked[0].id);
    $('#inFinal').placeholder = s ? '例：' + s + '（候補から選ぶか入力）' : '岩石名（候補から選ぶか入力）';
    $('#btnSave').textContent = S.savedId ? '記録を上書き保存' : '記録に保存';
  }
  async function saveRecord() {
    if (!S.photos.length && !J.answered(S.ans) && !S.ai) { toast('写真か観察チェックを入れてから保存してください'); return; }
    const finalText = $('#inFinal').value.trim();
    const fr = J.findRock(finalText);
    S.place.text = $('#inPlace').value.trim();
    let prev = null;
    if (S.savedId) { try { prev = await IDB.get('records', S.savedId); } catch (e) { prev = null; } }
    const rec = {
      id: S.savedId || 'r' + rid(),
      at: prev ? prev.at : new Date().toISOString(),
      u: Date.now(),
      v: 1,
      photos: S.photos.map((p) => p.blob),
      ans: clone(S.ans),
      place: clone(S.place),
      geo: clone(S.geo),
      ai: clone(S.ai),
      rule: J.answered(S.ans) ? J.rank(S.ans).slice(0, 6).map((x) => ({ id: x.id, pct: x.pct })) : [],
      final: { id: fr ? fr.id : null, name: finalText },
      memo: $('#inMemo').value.trim(),
    };
    try {
      await IDB.put('records', rec);
    } catch (e) {
      toast('保存できませんでした：' + ((e && e.message) || e) + '（プライベートモードでは保存できないことがあります）', 6000);
      return;
    }
    S.savedId = rec.id;
    updatePlaceholder(); saveDraft(); refreshRecCount();
    toast(prev ? '記録を上書きしました' : '記録に保存しました（記録タブ）');
  }
  function hasUnsaved() { return !S.savedId && (S.photos.length || J.answered(S.ans) || S.ai); }
  function resetJudge(force) {
    if (!force && hasUnsaved() && !confirm('保存していない写真・答えは消えます。新しい石の判定を始めますか？')) return;
    for (const p of S.photos) URL.revokeObjectURL(p.url);
    S.photos = []; S.ans = {}; S.aiFilled = {};
    S.place = { lat: null, lon: null, text: '', src: '' };
    S.geo = null; S.geoErr = ''; S.ai = null; S.aiErr = null; S.savedId = null;
    $('#inLatLon').value = ''; $('#inPlace').value = ''; $('#inFinal').value = ''; $('#inMemo').value = '';
    renderPhotos(); renderGeo(); updateChips(); renderRule(); renderAi(); updatePlaceholder(); saveDraft();
    window.scrollTo(0, 0);
  }

  // ---------- 詳細シート（戻るボタンで閉じる） ----------
  const sheetStack = [];
  let sheetUrls = [];
  function showSheet(item) {
    for (const u of sheetUrls) URL.revokeObjectURL(u);
    sheetUrls = [];
    $('#sheetTitle').textContent = item.title;
    const body = $('#sheetBody');
    body.innerHTML = item.html();
    $('#sheet').hidden = false;
    $('#sheet').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (item.mount) item.mount(body);
    renderMini();
  }
  function openSheet(title, html, mount) {
    const item = { title, html: typeof html === 'function' ? html : () => html, mount };
    sheetStack.push(item);
    history.pushState({ sheet: sheetStack.length }, '');
    showSheet(item);
  }
  function hideSheet() {
    for (const u of sheetUrls) URL.revokeObjectURL(u);
    sheetUrls = [];
    $('#sheet').hidden = true;
    $('#sheetBody').innerHTML = '';
    document.body.style.overflow = '';
    renderMini();
  }
  window.addEventListener('popstate', () => {
    if (!sheetStack.length) return;
    sheetStack.pop();
    if (sheetStack.length) showSheet(sheetStack[sheetStack.length - 1]);
    else hideSheet();
  });
  function closeSheet() { if (sheetStack.length) history.back(); }

  function rockHtml(r) {
    const rows = [];
    for (const f of J.F) {
      const p = r.P[f.id];
      if (f.multi) {
        const main = p ? Object.keys(p).filter((k) => p[k] >= 2) : [], sub = p ? Object.keys(p).filter((k) => p[k] === 1) : [];
        const no = Array.from(r.P.minNo);
        let td = main.length ? main.map((m) => J.optLabel('min', m)).join('・') : '<i>肉眼で見える鉱物は少ない</i>';
        if (sub.length) td += ' <i>（' + sub.map((m) => J.optLabel('min', m)).join('・') + 'もある）</i>';
        if (no.length) td += '<br><i>ふつう見えない：' + no.map((m) => J.optLabel('min', m)).join('・') + '</i>';
        rows.push('<tr><th>見える鉱物</th><td>' + td + '</td></tr>');
        continue;
      }
      if (!p) continue;
      const main = Object.keys(p).filter((k) => p[k] >= 2), sub = Object.keys(p).filter((k) => p[k] === 1);
      rows.push('<tr><th>' + esc(f.label.replace(/（.*）/, '')) + '</th><td>' + esc(main.map((v) => J.optLabel(f.id, v)).join('・') || '—') +
        (sub.length ? ' <i>（' + esc(sub.map((v) => J.optLabel(f.id, v)).join('・')) + 'もある）</i>' : '') + '</td></tr>');
    }
    let cmp = '';
    if (J.answered(S.ans)) {
      const sc = J.scoreRock(r, S.ans);
      cmp = '<div class="msg info">いま判定中の観察チェックとの一致：<b>' + sc.pct + '%</b>' +
        (sc.misses.length ? '<br>合わない点：' + sc.misses.map((m) => esc(J.optLabel(m.f, m.v))).join('、') : '') + '</div>';
    }
    return '<div class="rk"><h1>' + esc(r.name) + '</h1><p class="sub">' + esc(r.kana) + '・' + esc(r.en) + '　' + gb(r) + '</p>' +
      '<p>' + esc(r.desc) + '</p>' + cmp +
      '<h3>見分けのポイント</h3><ul>' + r.keys.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' +
      (r.similar.length ? '<h3>似ている岩石との見分け方</h3>' + r.similar.map((s) => '<button type="button" class="sim" data-rock="' + s.id + '"><b>' + esc(rockName(s.id)) + '</b><span>' + esc(s.how) + '</span></button>').join('') : '') +
      '<h3>日本での産地・産状</h3><p>' + esc(r.japan) + '</p>' +
      '<h3>観察チェックでの特徴</h3><table>' + rows.join('') + '</table>' +
      (r.alias && r.alias.length ? '<p class="small">別名・関連する名前：' + esc(r.alias.join('、')) + '</p>' : '') + '</div>';
  }
  function openRock(id) {
    const r = J.BYID[id];
    if (!r) return;
    openSheet(r.name, () => rockHtml(r));
  }

  // ---------- 図鑑 ----------
  let zGroup = 'all';
  function renderZukan() {
    const q = norm($('#inZukan').value);
    const groups = window.ROCKS_DB.groups;
    const match = (r) => !q || norm([r.name, r.kana, r.en, (r.alias || []).join(' '), r.desc, r.keys.join(' '), r.japan, r.groupName].join(' ')).includes(q);
    const hits = J.ROCKS.filter(match);
    $('#zGroups').innerHTML = '<button type="button" class="chip" data-zg="all" aria-pressed="' + (zGroup === 'all') + '">すべて ' + hits.length + '</button>' +
      groups.map((g) => { const n = hits.filter((r) => r.group === g.id).length; return '<button type="button" class="chip" data-zg="' + g.id + '" aria-pressed="' + (zGroup === g.id) + '">' + esc(g.name) + ' ' + n + '</button>'; }).join('');
    let html = '';
    for (const g of groups) {
      if (zGroup !== 'all' && zGroup !== g.id) continue;
      const rs = hits.filter((r) => r.group === g.id);
      if (!rs.length) continue;
      html += '<div class="zgroup" data-g="' + esc(g.id) + '">' + esc(g.name) + '<span>' + rs.length + '</span></div>' + rs.map((r) => '<button type="button" class="zitem" data-g="' + esc(r.group) + '" data-rock="' + r.id + '"><b>' + esc(r.name) + '</b><span class="kana">' + esc(r.kana) + '・' + esc(r.en) + '</span><p>' + esc(r.keys[0]) + '</p></button>').join('');
    }
    $('#zList').innerHTML = html || '<p class="empty">見つかりませんでした。</p>';
  }

  // ---------- 記録 ----------
  let recUrls = [];
  function recTitle(rec) {
    if (rec.final && rec.final.name) return rec.final.name;
    const a = rec.ai && rec.ai.result && rec.ai.result.candidates && rec.ai.result.candidates[0];
    if (a) return 'AI：' + a.name;
    if (rec.rule && rec.rule[0]) return '観察：' + rockName(rec.rule[0].id);
    return '（未判定）';
  }
  async function refreshRecCount() {
    try { const n = await IDB.count('records'); $('#recCount').textContent = n ? String(n) : ''; } catch (e) { /* 数えられない */ }
  }
  async function renderRecords() {
    for (const u of recUrls) URL.revokeObjectURL(u);
    recUrls = [];
    let recs = [];
    try { recs = await IDB.all('records'); }
    catch (e) { $('#recList').innerHTML = '<div class="msg err">記録を読めませんでした：' + esc((e && e.message) || e) + '</div>'; return; }
    recs.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    $('#recInfo').textContent = recs.length + ' 件';
    $('#recCount').textContent = recs.length ? String(recs.length) : '';
    if (!recs.length) { $('#recList').innerHTML = '<p class="empty">まだ記録はありません。判定タブの「記録に保存」で残せます。</p>'; return; }
    $('#recList').innerHTML = recs.map((r) => {
      let img = '<span class="noimg"></span>';
      if (r.photos && r.photos[0]) { const u = URL.createObjectURL(r.photos[0]); recUrls.push(u); img = '<img src="' + u + '" alt="">'; }
      const where = (r.place && r.place.text) || (r.geo && !r.geo.none ? r.geo.lith : '') || '';
      return '<button type="button" class="rec" data-rec="' + esc(r.id) + '">' + img + '<div><b>' + esc(recTitle(r)) + '</b><span>' + esc(fmtDate(r.at)) + (where ? '・' + esc(where) : '') + '</span></div></button>';
    }).join('');
  }
  function recordHtml(rec) {
    const photos = (rec.photos || []).map((b) => { const u = URL.createObjectURL(b); sheetUrls.push(u); return '<img class="bigph" src="' + u + '" alt="">'; }).join('');
    const p = rec.place || {};
    const ansRows = J.F.filter((f) => !J.isEmpty(rec.ans && rec.ans[f.id])).map((f) => {
      const a = rec.ans[f.id];
      return '<dt>' + esc(f.label.replace(/（.*）/, '')) + '</dt><dd>' + esc(Array.isArray(a) ? a.map((m) => J.optLabel(f.id, m)).join('・') : J.optLabel(f.id, a)) + '</dd>';
    }).join('');
    const ai = rec.ai && rec.ai.result;
    return photos +
      '<label class="field" for="recFinal">自分の判定</label><input id="recFinal" list="rockNames" value="' + esc((rec.final && rec.final.name) || '') + '" autocomplete="off">' +
      '<label class="field" for="recMemo">メモ</label><textarea id="recMemo">' + esc(rec.memo || '') + '</textarea>' +
      '<div class="row" style="margin-top:8px"><button type="button" class="btn primary" id="recSave">直した内容を保存</button>' +
      (rec.final && rec.final.id ? '<button type="button" class="btn" data-rock="' + rec.final.id + '">図鑑で見る</button>' : '') + '</div>' +
      '<div class="rk"><h3>日時・場所</h3><dl class="kv"><dt>日時</dt><dd>' + esc(fmtDate(rec.at)) + '</dd>' +
      (p.text ? '<dt>産地メモ</dt><dd>' + esc(p.text) + '</dd>' : '') +
      (p.lat != null ? '<dt>緯度経度</dt><dd>' + p.lat.toFixed(5) + ', ' + p.lon.toFixed(5) + '　<a href="' + geoLink(p.lat, p.lon) + '" target="_blank" rel="noopener">地理院地図</a></dd>' : '') +
      (rec.geo && !rec.geo.none ? '<dt>地質図</dt><dd>' + esc(geoText(rec.geo)) + '</dd>' : '') + '</dl>' +
      (ai ? '<h3>AI の判定</h3><ol>' + ai.candidates.map((c) => '<li>' + esc(c.name) + '　' + c.confidence + '%</li>').join('') + '</ol>' + (ai.comment ? '<p class="small">' + esc(ai.comment) + '</p>' : '') : '') +
      (rec.rule && rec.rule.length ? '<h3>観察からの候補</h3><ol>' + rec.rule.slice(0, 3).map((x) => '<li>' + esc(rockName(x.id)) + '　' + x.pct + '%</li>').join('') + '</ol>' : '') +
      (ansRows ? '<h3>観察チェックの答え</h3><dl class="kv">' + ansRows + '</dl>' : '') + '</div>' +
      '<div class="row" style="margin-top:18px"><button type="button" class="btn" id="recLoad">判定画面に読み込む</button><button type="button" class="btn danger" id="recDel">この記録を消す</button></div>';
  }
  async function openRecord(id) {
    let rec;
    try { rec = await IDB.get('records', id); } catch (e) { rec = null; }
    if (!rec) { toast('記録が見つかりません'); return; }
    openSheet(recTitle(rec), () => recordHtml(rec), (body) => {
      $('#recSave', body).onclick = async () => {
        const t = $('#recFinal', body).value.trim(), fr = J.findRock(t);
        rec.final = { id: fr ? fr.id : null, name: t };
        rec.memo = $('#recMemo', body).value.trim();
        rec.u = Date.now();
        await IDB.put('records', rec);
        toast('保存しました');
        renderRecords();
      };
      $('#recDel', body).onclick = async () => {
        if (!confirm('この記録を消します。元に戻せません。よろしいですか？')) return;
        await IDB.del('records', rec.id);
        if (S.savedId === rec.id) { S.savedId = null; updatePlaceholder(); saveDraft(); }
        toast('消しました');
        closeSheet(); renderRecords(); refreshRecCount();
      };
      $('#recLoad', body).onclick = () => {
        if (hasUnsaved() && !confirm('判定画面の保存していない内容は消えます。読み込みますか？')) return;
        resetJudge(true);
        S.photos = (rec.photos || []).map((b) => ({ id: rid(), blob: b, url: URL.createObjectURL(b) }));
        S.ans = clone(rec.ans) || {};
        S.place = Object.assign({ lat: null, lon: null, text: '', src: '' }, clone(rec.place));
        S.geo = clone(rec.geo); S.ai = clone(rec.ai); S.savedId = rec.id;
        $('#inFinal').value = (rec.final && rec.final.name) || '';
        $('#inMemo').value = rec.memo || '';
        $('#inPlace').value = S.place.text || '';
        if (S.place.lat != null) $('#inLatLon').value = S.place.lat.toFixed(5) + ', ' + S.place.lon.toFixed(5);
        renderPhotos(); renderGeo(); updateChips(); renderRule(); renderAi(); updatePlaceholder(); saveDraft();
        closeSheet();
        switchTab('judge');
        toast('記録を読み込みました。保存すると上書きします');
      };
    });
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  }
  function blobToDataURL(b) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); }); }
  async function dataURLToBlob(s) { return (await fetch(s)).blob(); }
  async function exportJson() {
    const recs = await IDB.all('records');
    if (!recs.length) { toast('書き出す記録がありません'); return; }
    const out = { app: 'ganseki-handoku', format: 1, version: APP_VERSION, exported: new Date().toISOString(), records: [] };
    for (const r of recs) out.records.push(Object.assign({}, r, { photos: await Promise.all((r.photos || []).map(blobToDataURL)) }));
    download(new Blob([JSON.stringify(out)], { type: 'application/json' }), '岩石判読_記録_' + ymd() + '.json');
    toast(recs.length + ' 件を書き出しました');
  }
  function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  async function exportCsv() {
    const recs = await IDB.all('records');
    if (!recs.length) { toast('書き出す記録がありません'); return; }
    recs.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const head = ['日時', '自分の判定', 'AIの1位', 'AIの確からしさ(%)', '観察の1位', '観察の一致度(%)', '緯度', '経度', '産地メモ', '地質図の凡例', 'メモ', '写真の枚数', 'id'];
    const rows = recs.map((r) => {
      const a = r.ai && r.ai.result && r.ai.result.candidates && r.ai.result.candidates[0];
      const o = r.rule && r.rule[0];
      const p = r.place || {};
      return [fmtDate(r.at), (r.final && r.final.name) || '', a ? a.name : '', a ? a.confidence : '', o ? rockName(o.id) : '', o ? o.pct : '',
        p.lat != null ? p.lat.toFixed(6) : '', p.lon != null ? p.lon.toFixed(6) : '', p.text || '', geoText(r.geo), r.memo || '', (r.photos || []).length, r.id];
    });
    const csv = String.fromCharCode(0xFEFF) + [head].concat(rows).map((row) => row.map(csvCell).join(',')).join('\r\n');
    download(new Blob([csv], { type: 'text/csv' }), '岩石判読_一覧_' + ymd() + '.csv');
  }
  async function importJson(file) {
    let j;
    try { j = JSON.parse(await file.text()); } catch (e) { toast('読めないファイルです（岩石判読で書き出した .json を選んでください）'); return; }
    if (!j || j.app !== 'ganseki-handoku' || !Array.isArray(j.records)) { toast('岩石判読の記録ファイルではないようです'); return; }
    let add = 0, upd = 0, same = 0;
    for (const r of j.records) {
      if (!r || !r.id) continue;
      const cur = await IDB.get('records', r.id);
      if (cur && (cur.u || 0) >= (r.u || 0)) { same++; continue; }
      r.photos = await Promise.all((r.photos || []).map(dataURLToBlob));
      await IDB.put('records', r);
      if (cur) upd++; else add++;
    }
    toast('読み込みました：新しく ' + add + ' 件・更新 ' + upd + ' 件・変わらず ' + same + ' 件', 5000);
    renderRecords(); refreshRecCount();
  }

  // ---------- 設定 ----------
  function renderSettings() {
    const k = getKey();
    $('#inKey').value = k;
    const m = lsGet(LS.model, AI.DEFAULT_MODEL);
    const sel = $('#selModel');
    if (![...sel.options].some((o) => o.value === m)) { lsSet(LS.model, 'custom'); lsSet(LS.modelCustom, m); }
    sel.value = lsGet(LS.model, AI.DEFAULT_MODEL);
    $('#inModelCustom').hidden = sel.value !== 'custom';
    $('#inModelCustom').value = lsGet(LS.modelCustom, '');
    storageInfo();
  }
  async function storageInfo() {
    let t = '';
    try { const n = await IDB.count('records'); t += '記録 ' + n + ' 件'; } catch (e) { t += '記録を数えられませんでした'; }
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        t += '・このアプリが使っている容量 約 ' + (e.usage / 1048576).toFixed(1) + ' MB';
      }
    } catch (e) { /* 容量は出せない */ }
    $('#storageInfo').textContent = t;
  }
  function keyMsg(html, cls) { $('#keyMsg').innerHTML = html ? '<div class="msg ' + (cls || 'info') + '">' + html + '</div>' : ''; }

  // ---------- 自己点検（index.html#selftest） ----------
  function runSelftest() {
    const res = J.selftest();
    window.__selftest = res;
    const bad = res.rows.filter((x) => x.pos > 3);
    const main = $('main');
    main.innerHTML = '<div class="card"><h2>自己点検：' + (res.ok ? 'すべて OK' : 'NG ' + bad.length + ' 件') + '</h2><p class="small">各岩石の「よくある特徴」だけで答えたとき、その岩石が上位 3 位以内に来るか。</p><table style="width:100%;font-size:12px;border-collapse:collapse">' +
      res.rows.map((x) => '<tr style="border-top:1px solid var(--line)' + (x.pos > 3 ? ';color:var(--ng)' : '') + '"><td>' + esc(x.name) + '</td><td>' + x.pos + '位</td><td>' + x.pct + '%</td><td>' + esc(x.top.join(' ')) + '</td></tr>').join('') + '</table></div>';
    document.title = res.ok ? 'SELFTEST OK' : 'SELFTEST NG';
  }

  // ---------- つなぐ ----------
  function bind() {
    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) switchTab(b.dataset.tab); });
    document.addEventListener('click', (e) => {
      const t = e.target;
      const go = t.closest('[data-tab-go]');
      if (go) { e.preventDefault(); if (sheetStack.length) closeSheet(); switchTab(go.dataset.tabGo); return; }
      const rk = t.closest('[data-rock]');
      if (rk) { openRock(rk.dataset.rock); return; }
      const chip = t.closest('#obsForm .chip');
      if (chip) { toggleChip(chip.dataset.f, chip.dataset.v); return; }
      const hp = t.closest('[data-help]');
      if (hp) { const el = $('#help-' + hp.dataset.help); if (el) el.hidden = !el.hidden; return; }
      const gt = t.closest('[data-goto]');
      if (gt) { const q = $('#q-' + gt.dataset.goto); if (q) q.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const ph = t.closest('[data-ph]');
      if (ph) { openSheet('写真', '<img class="bigph" src="' + ph.getAttribute('src') + '" alt="">'); return; }
      const dp = t.closest('[data-delph]');
      if (dp) { removePhoto(dp.dataset.delph); return; }
      const rc = t.closest('[data-rec]');
      if (rc) { openRecord(rc.dataset.rec); return; }
      const zg = t.closest('[data-zg]');
      if (zg) { zGroup = zg.dataset.zg; renderZukan(); return; }
      if (t.closest('#btnAiFill')) { fillFromAi(); return; }
      if (t.closest('#btnGeoRetry')) { fetchGeo(); return; }
    });
    $('#inCam').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
    $('#inPick').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
    $('#btnGps').addEventListener('click', () => {
      if (!navigator.geolocation) { toast('この端末では現在地を取れません'); return; }
      toast('現在地をさがしています…', 8000);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setPlace(pos.coords.latitude, pos.coords.longitude, 'gps'); toast('現在地を入れました（誤差 約' + Math.round(pos.coords.accuracy) + 'm）'); },
        (err) => toast('現在地を取れませんでした（' + (err.code === 1 ? '位置情報の許可がありません' : err.message) + '）', 5000),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    });
    $('#inLatLon').addEventListener('change', (e) => {
      const v = e.target.value.trim();
      if (!v) { clearPlace(); return; }
      const m = v.replace(/[，、]/g, ',').match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
      if (!m) { toast('「35.472, 133.051」のように、緯度と経度を , で区切って入れてください'); return; }
      const lat = Number(m[1]), lon = Number(m[2]);
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) { toast('緯度・経度の範囲をこえています'); return; }
      setPlace(lat, lon, 'input');
    });
    $('#inPlace').addEventListener('input', (e) => { S.place.text = e.target.value; saveDraft(); });
    $('#inFinal').addEventListener('input', saveDraft);
    $('#inMemo').addEventListener('input', saveDraft);
    $('#btnObsReset').addEventListener('click', () => {
      if (J.answered(S.ans) && !confirm('観察チェックの答えをすべて消しますか？')) return;
      S.ans = {}; S.aiFilled = {};
      updateChips(); renderRule(); renderAi(); saveDraft();
    });
    $('#btnAi').addEventListener('click', runAi);
    $('#btnSave').addEventListener('click', saveRecord);
    $('#btnNew').addEventListener('click', () => resetJudge(false));
    $('#miniBtn').addEventListener('click', () => $('#secRule').scrollIntoView({ behavior: 'smooth', block: 'start' }));
    $('#sheetBack').addEventListener('click', closeSheet);
    $('#inZukan').addEventListener('input', renderZukan);
    $('#btnExport').addEventListener('click', () => exportJson().catch((e) => toast('書き出せませんでした：' + e.message)));
    $('#btnCsv').addEventListener('click', () => exportCsv().catch((e) => toast('書き出せませんでした：' + e.message)));
    $('#inImport').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importJson(f).catch((er) => toast('読み込めませんでした：' + er.message)); });
    // 設定
    $('#btnKeyShow').addEventListener('click', () => { const i = $('#inKey'); i.type = i.type === 'password' ? 'text' : 'password'; $('#btnKeyShow').textContent = i.type === 'password' ? '表示' : '隠す'; });
    $('#btnKeySave').addEventListener('click', () => {
      const v = $('#inKey').value.trim();
      if (!v) { keyMsg('キーが空です。', 'warn'); return; }
      if (!/^AIza[0-9A-Za-z_\-]{20,}$/.test(v)) keyMsg('保存しました。ただし Gemini のキーはふつう AIza で始まります。貼り間違いがないか確かめてください。', 'warn');
      else keyMsg('保存しました。「接続テスト」で使えるか確かめられます。', 'info');
      lsSet(LS.key, v);
      S.aiErr = null; renderAi();
    });
    $('#btnKeyTest').addEventListener('click', async () => {
      const v = $('#inKey').value.trim() || getKey();
      if (!v) { keyMsg('先にキーを入れてください。', 'warn'); return; }
      keyMsg('<span class="spin"></span>' + esc(getModel()) + ' に問い合わせています…');
      try { const t = await AI.ping(v, getModel()); keyMsg('つながりました（返事：' + esc(t.slice(0, 40)) + '）。', 'info'); }
      catch (e) { keyMsg(esc((e && e.message) || e), 'err'); }
    });
    $('#btnKeyDel').addEventListener('click', () => {
      if (!confirm('この端末に保存した API キーを消しますか？')) return;
      lsSet(LS.key, ''); $('#inKey').value = ''; keyMsg('消しました。');
      renderAi();
    });
    $('#selModel').addEventListener('change', (e) => { lsSet(LS.model, e.target.value); $('#inModelCustom').hidden = e.target.value !== 'custom'; });
    $('#inModelCustom').addEventListener('change', (e) => lsSet(LS.modelCustom, e.target.value.trim()));
    $('#btnWipe').addEventListener('click', async () => {
      if (!confirm('この端末の記録をすべて消します。元に戻せません。先に「まるごと書き出す」で控えを取りましたか？')) return;
      if (!confirm('本当にすべて消しますか？')) return;
      await IDB.clear('records');
      S.savedId = null; updatePlaceholder(); saveDraft();
      toast('すべての記録を消しました'); storageInfo(); refreshRecCount();
    });
    window.addEventListener('online', renderAi);
    window.addEventListener('offline', renderAi);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((ents) => { ruleVisible = ents.some((x) => x.isIntersecting); renderMini(); }, { threshold: 0.15 }).observe($('#secRule'));
    }
  }

  async function init() {
    $('#ver').textContent = 'v' + APP_VERSION;
    $('#verInfo').textContent = 'v' + APP_VERSION;
    $('#rockNames').innerHTML = J.ROCKS.map((r) => '<option value="' + esc(r.name) + '">').join('');
    if (location.hash === '#selftest') { runSelftest(); window.__gansekiReady = true; return; }
    bind();
    buildObs();
    await restoreDraft();
    renderPhotos(); renderGeo(); updateChips(); renderRule(); renderAi(); updatePlaceholder();
    refreshRecCount();
    const t = lsGet(LS.tab, 'judge');
    switchTab(['judge', 'zukan', 'records', 'settings'].includes(t) ? t : 'judge');
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* 圏外対応なしでも動かす */ });
    }
    window.__ganseki = { S, IDB, J, AI, version: APP_VERSION };
    window.__gansekiReady = true;
  }
  init();
})();
