// v5 – غيّر الرقم ده مع كل تحديث عشان الموبايل ياخد النسخة الجديدة
const APP = 'map-app-v5';
const TILES = 'map-tiles';
const MAX_TILES = 1500;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => Promise.all(SHELL.map(u =>
    fetch(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'}).then(r => c.put(u, r)).catch(() => {})
  ))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== TILES).map(k => caches.delete(k)))));
  self.clients.claim();
});
async function trimTiles(){
  const c = await caches.open(TILES); const ks = await c.keys();
  for (let i = 0; i < ks.length - MAX_TILES; i++) await c.delete(ks[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = req.url;
  const isTile = /google\.com\/vt|arcgisonline|arcgis\.com|tile\.openstreetmap/.test(url);
  if (isTile) {
    // الخريطة: من النت الأول، ولو مفيش نت من اللي اتحفظ قبل كده
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(TILES).then(c => c.put(req, copy)).then(trimTiles); return r;
    }).catch(() => caches.match(req)));
    return;
  }
  // ملفات التطبيق: من النت الأول عشان التحديثات توصل، ولو مفيش نت من الكاش
  e.respondWith(fetch(req).then(r => {
    if (url.startsWith(self.location.origin) || url.includes('unpkg.com')) { const copy = r.clone(); caches.open(APP).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(m => m || caches.match('./index.html'))));
});
