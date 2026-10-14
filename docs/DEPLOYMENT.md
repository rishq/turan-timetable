# Deployment (web / PWA)

`npm run build` produces a static `dist/`. `base: './'` makes it work at any path (root, sub-folder, Capacitor).

## Hosting
Any static host over **HTTPS** (required for service workers): GitHub Pages, Netlify, Cloudflare Pages, S3+CDN, nginx.
Hash routing (`#/week`) means no SPA rewrite rules are needed.

Recommended headers:
- `sw.js`, `index.html`, `manifest.webmanifest`: `Cache-Control: no-cache` (so updates are noticed)
- `assets/*` (hash-named): `Cache-Control: public, max-age=31536000, immutable`

nginx sketch:
```
location = /sw.js            { add_header Cache-Control "no-cache"; }
location = /index.html       { add_header Cache-Control "no-cache"; }
location /assets/            { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

## How updates reach users
1. Re-import the PDF → new `timetable-<hash>.js` chunk → new service worker.
2. On next foreground/visit the browser fetches the new `sw.js`; the app shows **«Доступно обновление расписания»**.
3. Tapping **Обновить** activates it and reloads. Preferences (`localStorage`) and notes (IndexedDB) are untouched; old caches are cleaned (`cleanupOutdatedCaches`).

## Verifying after deploy
- Lighthouse (mobile) on the deployed URL — targets: Performance ≥ 90, Accessibility ≥ 95. **Not measured yet** — no browser was available in the build sandbox.
- DevTools → Application: manifest valid, service worker activated, offline reload works.
- iOS: Share → Add to Home Screen. Android/desktop Chromium: install prompt or Settings → «Установить приложение».
