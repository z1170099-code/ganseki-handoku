/* 岩石判読：観察チェックの点数づけ（AI を使わない判定）
 *
 * 岩石ごとの「よくある特徴（2）」「ありうる特徴（1）」と利用者の答えをくらべて、一致度（%）を出す。
 *   よくある特徴に合う   → その項目の重み w をそのまま足す
 *   ありうる特徴に合う   → w の半分を足す
 *   どちらにも書いてない → w を引く（合わない特徴として表示）
 *   鉱物は 1 つずつ数え、その岩石に「ないはず」（minNo）の鉱物なら w を引き、
 *   どちらでもない鉱物なら少しだけ引く。
 * 一致度 = 足し引きの合計 ÷ 答えた項目の重みの合計（0〜100%）
 * データは rocks.js（window.ROCKS_DB）。
 */
(function () {
  'use strict';
  const DB = window.ROCKS_DB;
  const F = DB.features;
  const FMAP = Object.fromEntries(F.map((f) => [f.id, f]));
  const GROUPS = Object.fromEntries(DB.groups.map((g) => [g.id, g.name]));
  const MISS = -1;        // 合わない特徴
  const MIN_ODD = -0.25;  // 書かれていない鉱物を選んだとき

  function parse(s) {
    const o = {};
    String(s || '').trim().split(/\s+/).filter(Boolean).forEach((t) => {
      const [k, v] = t.split(':');
      o[k] = v === undefined ? 2 : Number(v);
    });
    return o;
  }

  const ROCKS = DB.rocks.map((r) => {
    const P = {};
    for (const f of F) if (r.p[f.id] !== undefined) P[f.id] = parse(r.p[f.id]);
    P.minNo = new Set(String(r.p.minNo || '').split(/\s+/).filter(Boolean));
    return Object.assign({}, r, { P, groupName: GROUPS[r.group] || r.group });
  });
  const BYID = Object.fromEntries(ROCKS.map((r) => [r.id, r]));

  function optOf(fid, v) {
    const f = FMAP[fid];
    return f ? f.opts.find((o) => o.v === v) : null;
  }
  function optLabel(fid, v) {
    const o = optOf(fid, v);
    return o ? (o.s || o.label) : v;
  }
  function isEmpty(a) {
    return a == null || a === '' || (Array.isArray(a) && !a.length);
  }
  function answered(ans) {
    let n = 0;
    for (const f of F) {
      const a = ans[f.id];
      if (isEmpty(a)) continue;
      if (f.multi) { if (a.some((m) => m !== 'none')) n++; continue; }
      const o = optOf(f.id, a);
      if (o && !o.skip) n++;
    }
    return n;
  }
  function typical(r, fid) {
    const p = r.P[fid];
    return p ? Object.keys(p).filter((k) => p[k] >= 2) : [];
  }

  function scoreRock(r, ans) {
    let s = 0, max = 0;
    const hits = [], misses = [];
    for (const f of F) {
      const a = ans[f.id];
      if (isEmpty(a)) continue;
      if (f.multi) {
        const prof = r.P[f.id] || {};
        for (const m of a) {
          if (m === 'none' || !optOf(f.id, m)) continue;
          max += f.w;
          const v = prof[m] || 0;
          if (v >= 2) { s += f.w; hits.push({ f: f.id, v: m, strong: true }); }
          else if (v >= 1) { s += f.w * 0.5; hits.push({ f: f.id, v: m }); }
          else if (r.P.minNo.has(m)) { s += f.w * MISS; misses.push({ f: f.id, v: m }); }
          else s += f.w * MIN_ODD;
        }
        continue;
      }
      const opt = optOf(f.id, a);
      if (!opt || opt.skip) continue;
      max += f.w;
      const prof = r.P[f.id];
      if (!prof) continue;            // その岩石では決まらない項目（どちらにも数えない）
      const v = prof[a] || 0;
      if (v >= 2) { s += f.w; hits.push({ f: f.id, v: a, strong: true }); }
      else if (v >= 1) { s += f.w * 0.5; hits.push({ f: f.id, v: a }); }
      else { s += f.w * MISS; misses.push({ f: f.id, v: a, expect: typical(r, f.id) }); }
    }
    const pct = max > 0 ? Math.max(0, Math.round((s / max) * 100)) : 0;
    return { id: r.id, s, max, pct, hits, misses };
  }

  function rank(ans) {
    return ROCKS.map((r) => scoreRock(r, ans)).sort((a, b) => b.pct - a.pct || b.s - a.s);
  }

  // 上位の候補を分けるのに役立つ、まだ答えていない項目をさがす。
  // 「よくある特徴」が重ならない候補の組を数え、一致度の高い組ほど重く見る。
  function nextQuestion(ans, ranked, n) {
    const topSc = ranked.slice(0, n || 5);
    const top = topSc.map((x) => BYID[x.id]);
    let best = null;
    for (const f of F) {
      if (f.multi || f.group === 'place' || !isEmpty(ans[f.id])) continue;
      let sc = 0;
      for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
          const a = typical(top[i], f.id), b = typical(top[j], f.id);
          if (a.length && b.length && !a.some((x) => b.includes(x))) sc += f.w * (topSc[i].pct + 1) * (topSc[j].pct + 1) / 10000;
        }
      }
      if (sc > 0 && (!best || sc > best.sc)) best = { f: f.id, sc };
    }
    if (!best) return null;
    const groups = [];                 // 答えごとに候補をまとめる（例：面構造なし＝安山岩・玄武岩／流理＝溶結凝灰岩）
    for (const r of top) {
      const t = typical(r, best.f);
      if (!t.length) continue;
      const key = t.map((v) => optLabel(best.f, v)).join('・');
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push(g = { key, names: [] });
      g.names.push(r.name);
    }
    return { f: best.f, label: FMAP[best.f].label, groups };
  }

  // 名前（日本語・英語・別名）から岩石をさがす。AI の答えを図鑑に結びつけるのに使う
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\s　・･()（）「」]/g, '').replace(/[ァ-ン]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  }
  function findRock(nameOrId) {
    if (!nameOrId) return null;
    if (BYID[nameOrId]) return BYID[nameOrId];
    const q = norm(nameOrId);
    if (!q) return null;
    for (const r of ROCKS) {
      const names = [r.name, r.kana, r.en, ...(r.alias || [])].map(norm);
      if (names.includes(q)) return r;
    }
    for (const r of ROCKS) {               // 「花こう岩」と「花崗岩（御影石）」のような部分一致
      const main = norm(r.name.replace(/（.*）/, ''));
      if (main.length >= 2 && (q.startsWith(main) || main === q)) return r;
    }
    return null;
  }

  // 自己点検：その岩石のよくある特徴だけで答えたら、その岩石が上位 3 位以内に来るか
  function typicalAnswers(r) {
    const ans = {};
    for (const f of F) {
      const t = typical(r, f.id);
      if (!t.length) continue;
      if (f.multi) ans[f.id] = t.slice(0, 3);
      else ans[f.id] = t[0];
    }
    return ans;
  }
  function selftest() {
    const out = [];
    for (const r of ROCKS) {
      const ranked = rank(typicalAnswers(r));
      const me = ranked.find((x) => x.id === r.id);
      const pos = ranked.filter((x) => x.pct > me.pct).length + 1;
      out.push({ id: r.id, name: r.name, pos, pct: me.pct, top: ranked.slice(0, 3).map((x) => x.id + ':' + x.pct) });
    }
    return { ok: out.every((x) => x.pos <= 3), rows: out };
  }

  window.Judge = { F, FMAP, GROUPS, ROCKS, BYID, rank, scoreRock, nextQuestion, typical, optOf, optLabel, answered, isEmpty, findRock, typicalAnswers, selftest };
})();
