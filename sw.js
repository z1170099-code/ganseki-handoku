/* 岩石判読：Service Worker（電波のない所でも開けるようにする）
 * アプリ本体はネットを先に試し、だめなら保存しておいたものを使う（4 秒で見切る）。
 * Gemini と地質図への問い合わせは保存しない（いつもネットに取りにいく）。
 * 版を上げるときは SHELL の末尾を app.js の APP_VERSION とそろえる（tools/check_data.py が点検する）。
 */
const SHELL = 'ganseki-shell-1.1.0';
const OWN = ['./', './index.html', './app.js', './judge.js', './ai.js', './rocks.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(OWN);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('ganseki-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function own(req) {
  const c = await caches.open(SHELL);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    const m = (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match('./index.html') : null);
    return m || new Response('offline', { status: 504, statusText: 'offline' });
  }
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) e.respondWith(own(req));
});
