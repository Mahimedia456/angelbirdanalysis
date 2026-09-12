# AngelBird Reporting Mobile — Phase 12 Checkpoint

React Native + Expo SDK 57 mobile reporting app for AngelBird.

## Current mobile scope
- Ticket Report
- Satisfaction Report
- RMA Report
- Profile + logout
- Production API: `https://angelbirdanalysis-api.vercel.app`
- Automatic deferrable background report sync
- Foreground refresh + manual Sync now
- Offline cached reports with stale-while-revalidate behavior
- Role allowlist: owner, admin, analyst, viewer
- AngelBird favicon-derived native icons/splash assets

## Install from project root

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-08-12.ps1
```

## Start

```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```

## Verify

```powershell
cd D:\angelbird-analytics
.\VERIFY-PHASE-08-12.ps1
```

## Background sync
The app uses Expo BackgroundTask/TaskManager. Background execution is controlled by Android/iOS and is not an exact timer. Cached data remains available when the network is unavailable.

## Security
Authentication tokens are stored in Expo SecureStore. Offline report data is stored separately in app-local AsyncStorage and cleared when the user logs out. Report routes are restricted to approved reporting roles.

## Roadmap stop
This checkpoint intentionally stops after Phase 12. EAS builds, Play Store, TestFlight and production release phases are not included until explicitly requested.
