const CACHE_NAME = 'sw-cache-example';
const toCache = [
	'/',
	'/login',
	'/terms-and-conditions',
	'/privacy-policy',
	'/css/bootstrap.min.css',
	'/css/bootstrap.min.css.map',
	'/css/style.css',
	'/js/bootstrap.min.js',
	'/js/bootstrap.min.js.map',
	'/js/jquery.min.js',
	'/js/popper.min.js',
	'/js/pwa.webmanifest',
	'/js/pwa.js',
	'/js/main.js',
	'/img/apple-touch.png',
	'/img/splash-screen.png',
	'/img/hero-bg.jpg',
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function(cache) {
				return cache.addAll(toCache);
			})
			.then(self.skipWaiting()),
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		fetch(event.request)
			.catch(() => {
				return caches.open(CACHE_NAME)
					.then((cache) => {
						return cache.match(event.request);
					});
			}),
	);
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys()
			.then((keyList) => {
				return Promise.all(keyList.map((key) => {
					if (key !== CACHE_NAME) {
						console.log('[ServiceWorker] Removing old cache', key);
						return caches.delete(key);
					}
				}));
			})
			.then(() => self.clients.claim()),
	);
});
