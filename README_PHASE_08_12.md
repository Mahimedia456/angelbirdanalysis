# AngelBird Reporting Mobile — Phases 08–12 Final Pre-Build Batch

This is a cumulative additive checkpoint. Extract/merge into the existing AngelBird project root. Existing web reporting, CSV/upload flow, database, Supabase auth, and unrelated backend modules are preserved.

## Included

### Phase 08 — Background / automatic Sheet sync + status
- Expo BackgroundTask + TaskManager based deferrable background report refresh.
- Google-Sheet-backed Ticket/Satisfaction/RMA endpoints are fetched in the background when OS conditions allow.
- Foreground stale refresh remains enabled.
- Live/cache/automatic-sync state is visible in each report and Profile.
- Background interval is a minimum hint; Android/iOS decide actual execution time.

### Phase 09 — Role/permission hardening + security
- Mobile report access allowlist: owner, admin, analyst, viewer.
- Unknown/unapproved roles land on a restricted screen.
- Backend Sheet/RMA report routes also enforce the same four roles.
- Protected report responses send private/no-store cache headers.
- Auth tokens remain in SecureStore; report cache never stores tokens.
- Logout clears local report cache and unregisters the background task.

### Phase 10 — Offline cache + performance
- AsyncStorage stale-while-revalidate report cache.
- Cached Ticket, Satisfaction and RMA reports remain readable after network failures.
- Cache is refreshed after successful foreground/background sync.
- Existing FlatList virtualization/memoized analytics remain preserved.
- Duplicate in-flight refresh calls are coalesced.

### Phase 11 — Native Android/iOS metadata + brand
- Existing AngelBird favicon-derived app icon pack remains the source of truth.
- iOS and Android identifiers/build metadata are defined.
- Android monochrome adaptive icon configured.
- Splash image/config preserved.
- Background-processing metadata configured for iOS.
- Unneeded camera/mic/location/contact Android permissions are blocked.

### Phase 12 — End-to-end QA + bug fixes
- Fixed the TypeScript 6 `noUncheckedIndexedAccess` date-regex errors in Ticket, Satisfaction and RMA analytics.
- Added clean Phase 08–12 installer and verifier.
- Production API remains `https://angelbirdanalysis-api.vercel.app`.
- Phase 13–16 are intentionally not included.

## Install

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-08-12.ps1
```

Then:

```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```

## Important background-sync behavior
Background execution is OS-controlled and intentionally deferrable. It is not an exact cron timer. Android has a 15-minute minimum scheduling interval and iOS may run later depending on battery/network/usage conditions. Foreground refresh and manual Sync Now remain available.

## Stop point
This package stops at Phase 12. Do not start EAS preview/build, Play Store, TestFlight or EAS Update release work until explicitly requested.
