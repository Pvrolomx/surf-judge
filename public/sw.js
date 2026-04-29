const CACHE_NAME = 'surf-judge-v1'
const STATIC = ['/','/_next/static/','/.next/']

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = event.request.url
  // Network first for API and HTML
  if (url.includes('/api/') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          }
          return resp
        })
        .catch(() => caches.match(event.request))
    )
  } else {
    // Cache first for assets
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)))
  }
})
