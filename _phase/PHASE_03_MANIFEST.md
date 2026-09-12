# AngelBird Mobile — Phase 03

## Scope
Live Google-Sheet reporting foundation + mobile error hardening.

## Added / changed
- `apps/mobile/src/reports/*`
  - authenticated Sheet + RMA API adapters
  - shared reporting state
  - foreground stale refresh (2-minute threshold)
  - pull-to-refresh/manual refresh
  - last-sync/error state
- `apps/mobile/src/components/LiveReportScreen.tsx`
  - all three tabs now consume real Sheet data
  - basic KPI counts and normalized row preview
  - loading/empty/retry states
- Mobile hardening
  - API timeout and clearer network errors
  - API base URL validation
  - secure-session persistence ordering fix
  - Node 22.13+ requirement declared
  - one-command PowerShell setup/verification script
- Backend targeted security
  - Sheet overview/report payloads require auth
  - all RMA report payloads require auth
  - health probes remain public

## Preserved
- Existing Vite web frontend
- Existing CSV/upload workflow
- Database/schema
- Google Sheets service and normalization logic
- Existing auth controller/service contract
- Existing report controllers/services
- Original Phase 01 + Phase 02 manifests retained under `_phase/history/`

## Merge behavior
Extract at AngelBird project root.
- `apps/mobile/` advances the mobile checkpoint to Phase 03.
- Only these backend files are intentionally replaced:
  - `backend/src/routes/sheetReportsRoutes.js`
  - `backend/src/routes/rmaReportsRoutes.js`

## Environment
`apps/mobile/.env`:

`EXPO_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-DOMAIN`

For a real phone testing a local backend, use the PC LAN IP, not `localhost`.
