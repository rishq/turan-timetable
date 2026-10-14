# Расписание — Университет Туран

Fast, offline-first timetable PWA (React + TypeScript + Vite + Tailwind). No backend, no accounts.
Data source: the university's aSc timetable PDF, imported to versioned JSON.

```bash
npm install
npm run dev          # local dev
npm run build        # typecheck + production build + service worker
npm run preview      # serve the build
npm run lint && npm run typecheck && npm test
npm run e2e          # Playwright (needs `npx playwright install chromium`)
npm run import:pdf   # re-import the PDF (Python 3 + pdfplumber)
```

## Structure
```
data/source/            original PDF
data/schedules/         timetable.json (+ import-report.json) — the only place schedule data lives
scripts/import_pdf.py   offline importer (geometry-based; flags anything uncertain)
src/lib/                pure logic, no React: time, schedule (status/next/gaps), validate, search, prefs, i18n
src/data/repositories/  loads + validates + indexes the JSON (own lazy chunk)
src/features/           today · timetable · groups · search · settings
src/components/         ui + layout (bottom nav on mobile, sidebar on desktop)
src/tests/              unit + jsdom UI tests (e2e/ has Playwright specs)
docs/                   IMPORT_REPORT.md · DEPLOYMENT.md · CAPACITOR.md
```

## Updating the schedule
Replace the PDF in `data/source/`, run `npm run import:pdf`, read `docs/IMPORT_REPORT.md`/`import-report.json`,
run `npm test` (dataset tests), then deploy. No UI code changes. Users see an «Обновить» banner; nothing is swapped silently.

## Design decisions
- **Recurring weekly schedule ≠ calendar.** `effectiveFrom/To` are `null` (the PDF prints no dates) and `completeness: "unknown"`, so an empty day reads «занятий в расписании нет», never «свободный день». Date-specific `exceptions` are modelled and tested but currently empty.
- **Lessons are never dropped or edited by validation**; issues are reported (`validateSchedule`).
- **State:** React state + one context; no state library. One shared timer per precision, only while a screen needs it and the tab is visible; the 1-second countdown is a leaf component.
- **Fonts:** system stack (covers Cyrillic and Kazakh letters, zero bytes, offline-safe).
- **Storage:** preferences in `localStorage`; personal lesson notes in IndexedDB. Both survive app updates.
- **Notifications:** not offered on web (no reliable local scheduling) — Settings says so. See `docs/CAPACITOR.md`.
