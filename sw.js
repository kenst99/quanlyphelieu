const CACHE_NAME = 'phe-lieu-th-v1';

// Các file cache khi cài app
const PRECACHE_URLS = [
  './index.html',
  './icon-192.png',
  './icon-512.png'
];

// ── Cài đặt: cache file tĩnh ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Kích hoạt: xóa cache cũ ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network first, fallback cache ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Các request đến Google (Sheets API, Fonts) → luôn dùng network, không cache
  if (
    url.includes('googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('quilljs.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // File app (index.html, icon...) → Network first, fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Lưu bản mới vào cache
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
