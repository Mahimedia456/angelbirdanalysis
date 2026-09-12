# Phase 12 QA Checklist

## Automated checks included in VERIFY-PHASE-08-12.ps1
- TypeScript strict compile (`tsc --noEmit`)
- Expo dependency alignment (`expo install --check`)
- Expo public config generation
- Expo Doctor
- Backend Sheet/RMA route JavaScript syntax

## Manual mobile acceptance
1. Fresh launch -> Login.
2. Sign in as owner/admin/analyst/viewer -> Ticket Report opens.
3. Unknown role -> Restricted screen, no reports.
4. Ticket filters/search/KPIs and Sync now.
5. Satisfaction filters/search/KPIs and Sync now.
6. RMA filters/search/KPIs and Sync now.
7. Profile shows role, live/cache source and background-sync status.
8. Disable internet after a successful sync -> restart app -> cached reports remain readable.
9. Re-enable internet -> Sync now -> live source resumes.
10. Logout -> login again -> previous report cache must not flash before fresh/cache hydration for the new session.
11. Background task: use a development build for reliable native testing; OS controls execution timing.
12. Confirm Android/iOS icon and splash use favicon-derived AngelBird assets.

## Expected platform behavior
- Background sync is deferrable, not exact-time cron.
- iOS can delay background work and fully stops it when the user force-quits the app.
- Android scheduling behavior can vary by device vendor/battery policy.
