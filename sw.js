// Minimal service worker — just enough to let the app be "installed" and
// open even with no signal (showing the last-loaded shell). It deliberately
// does NOT cache API calls to your Apps Script backend or the CDN
// libraries (Font Awesome, Chart.js, pdf.js) — those always go straight to
// the network, so test/material data is never served stale.

const CACHE_NAME = 'deka-sir-classes-shell-v1';
const SHELL_FILE = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([SHELL_FILE]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle navigation to the app shell itself — everything else
  // (Apps Script API calls, CDN scripts, Drive images/PDFs) passes
  // straight through untouched.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_FILE, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_FILE))
    );
  }
});
