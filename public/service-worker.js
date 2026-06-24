/* eslint-disable no-restricted-globals */

/**
 * Deltablue Jet Air — Service Worker
 *
 * Provides offline caching for static assets and boarding passes.
 * Cache is versioned by build timestamp to ensure fresh content after deploys.
 */

// ── Cache Versioning ──────────────────────────────────────────
// BUILD_TIMESTAMP is replaced at build time by the Vite define plugin.
// Falls back to a runtime timestamp if not replaced (dev mode).
const BUILD_VERSION = '__BUILD_TIMESTAMP__';
const CACHE_NAME = `deltablue-${BUILD_VERSION}`;

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately — don't wait for old tabs to close
    self.skipWaiting();
});

// Activate: clean ALL old caches (any name that isn't the current version)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Claim all open clients so the new SW takes over immediately
    self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API calls and Firebase requests
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api') || url.hostname.includes('firestore') || url.hostname.includes('firebase')) {
        return;
    }

    // For navigation requests (HTML pages), ALWAYS go network-first
    // This ensures users get the latest index.html after a deploy
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh HTML
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline fallback: serve cached index.html
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // For static assets (JS, CSS, images): cache-first (they have hashed filenames)
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Everything else: network-first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Deltablue Jet Air';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/logo192.png',
        badge: '/favicon.ico',
        data: data.url || '/',
        actions: data.actions || [],
        tag: data.tag || 'deltablue-notification',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window or open new one
            for (const client of clients) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
