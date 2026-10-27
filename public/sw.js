// NEOTA Service Worker for Hall / Marquee Offline Resilience
const CACHE_NAME = 'neota-cache-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Pre-cache partial error:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)

  // Skip caching for Supabase API, external REST queries, non-GET requests
  if (req.method !== 'GET' || url.hostname.includes('supabase.co') || url.pathname.startsWith('/rest/')) {
    return
  }

  // Network first with fallback to cache for HTML navigation, stale-while-revalidate for static assets
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html') || caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone))
        }
        return networkResponse
      }).catch(() => cached)

      return cached || fetchPromise
    })
  )
})
