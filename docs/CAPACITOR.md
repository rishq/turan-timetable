# Packaging with Capacitor (planned — nothing native is installed in the MVP)

What stays web-only (works today): schedule, search, offline cache, theme, notes, install-to-home-screen.
What needs native packaging: reliable **local reminders** before lessons, store distribution, app-icon badges.

## Steps
```bash
npm i @capacitor/core && npm i -D @capacitor/cli
npx cap init "Расписание" kz.turan.timetable --web-dir=dist
npm i @capacitor/android @capacitor/ios
npm run build
npx cap add android && npx cap add ios
npx cap sync
npx cap open android   # or ios
```
`capacitor.config.ts`: `webDir: 'dist'`; no `server.url` (the app is bundled, no server needed).

## Already prepared in the code
- Relative `base`, hash routing: works from `capacitor://localhost` / `https://localhost`.
- `viewport-fit=cover` + `env(safe-area-inset-*)` on top bar, sides and bottom nav.
- Touch targets ≥ 44px; keyboard/focus handled with native elements.
- Time uses the device timezone; the clock store re-syncs on `visibilitychange` (app resume).
- Persistence is `localStorage` + IndexedDB (kept by Capacitor's WebView; for iOS data-eviction safety, mirror prefs to `@capacitor/preferences` if needed).

## Native-only work to add later
1. `@capacitor/local-notifications`: schedule reminders from `lessonsForDate`/`weekOrder` (pure functions already exist); then enable the switch in Settings (currently disabled with an explanation).
2. Service worker: Capacitor serves bundled assets, so the SW is redundant there; keep `registerSW` but the update banner won't appear — ship schedule updates via app-store releases or fetch a remote JSON (new requirement).
3. `@capacitor/status-bar` / `@capacitor/splash-screen` for polish; Android back button via `@capacitor/app`.
