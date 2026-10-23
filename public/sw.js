/* Varda caches only the public app shell. Accounts, API responses, and payments never enter the cache. */
const SHELL = 'varda-shell-TQQTgCF_nPAll8rmCGiEK';
const ASSETS = 'varda-assets-TQQTgCF_nPAll8rmCGiEK';
const STATE = 'varda-state-v3';
const OFFLINE_KEY = '/__varda_offline_preference';
let offlineMode = caches.open(STATE).then(cache => cache.match(OFFLINE_KEY)).then(response => response ? response.json() : false).catch(() => false);
const baseAssets = ['/', '/offline.html', '/icon.svg', '/manifest.webmanifest', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png', '/apple-touch-icon.png', '/images/community-room.webp', '/images/supper.webp', '/images/garden.webp'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // The shell itself is mandatory: never activate an empty offline cache.
    await cache.add(new Request('/', {cache: 'reload'}));
    await Promise.allSettled(baseAssets.slice(1).map(path => cache.add(new Request(path, {cache: 'reload'}))));
    try {
      const response = await fetch('/sw-assets.json', {cache: 'no-store'});
      if (response.ok) {
        const paths = await response.json();
        const assets = await caches.open(ASSETS);
        const valid = paths.filter(path => typeof path === 'string' && path.startsWith('/_next/static/'));
        // A bounded worker pool avoids flooding the network during installation.
        const pending = [...valid];
        await Promise.all(Array.from({length: 4}, async () => { while (pending.length) { const path = pending.shift(); if (path) await assets.add(path).catch(() => {}); } }));
      }
    } catch { /* Runtime caching covers development builds. */ }
    // Updates wait until all existing tabs close; mixing builds would invalidate dynamic chunks.
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('varda-') && ![SHELL, ASSETS, STATE].includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SET_OFFLINE' && typeof event.data.offline === 'boolean') {
    offlineMode = Promise.resolve(event.data.offline);
    event.waitUntil(caches.open(STATE).then(cache => cache.put(OFFLINE_KEY, new Response(JSON.stringify(event.data.offline)))));
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith((async () => await offlineMode ? Response.json({message: 'Offline mode is on. Reconnect to use this feature.'}, {status: 503, headers: {'Cache-Control': 'no-store'}}) : fetch(request))());
    return;
  }
  if (request.method !== 'GET') return;
  // Next's RSC responses must never be mistaken for HTML.
  if (request.headers.has('RSC') || url.searchParams.has('_rsc') || url.pathname.startsWith('/_next/webpack')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const shell = await caches.open(SHELL);
      if (!(await offlineMode)) {
        try {
          const response = await fetch(request);
          // Only the public root document can be persisted, with a canonical cache key.
          if (url.pathname === '/' && response.ok && response.headers.get('content-type')?.includes('text/html')) await shell.put('/', response.clone());
          return response;
        } catch { /* Open the cached public home below. */ }
      }
      return await shell.match('/') || await shell.match('/offline.html') || new Response('Varda needs a first online visit.', {status: 503, headers: {'Content-Type': 'text/plain'}});
    })());
    return;
  }
  const isStatic = url.pathname.startsWith('/_next/static/') || baseAssets.includes(url.pathname);
  if (!isStatic) return;
  event.respondWith((async () => {
    const cache = await caches.open(url.pathname.startsWith('/_next/static/') ? ASSETS : SHELL);
    const cached = await cache.match(request, {ignoreSearch: !url.pathname.startsWith('/_next/static/')});
    if (cached) return cached;
    // Offline mode still allows downloading missing public assets so the interface can recover.
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
