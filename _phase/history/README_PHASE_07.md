# AngelBird Reporting — Phase 07 Mobile Polish

Cumulative checkpoint built on Phase 06. Existing web frontend, backend, database, CSV/upload flow and Google Sheet services remain preserved.

## Phase 07
- Polished app header and profile affordance.
- Refined bottom navigation while keeping exactly 3 main tabs.
- Improved Ticket, Satisfaction and RMA report card hierarchy, spacing, elevation and bottom-tab clearance.
- Login/profile visual polish.
- Production API remains `https://angelbirdanalysis-api.vercel.app`.
- TypeScript 6 migration: removed deprecated `baseUrl` from `tsconfig.json`; `@/*` paths remain relative to the tsconfig file.
- Expo SDK 57 dependencies aligned to the versions reported by Expo on 2026-09-12:
  - expo-dev-client 57.0.19
  - expo-splash-screen 57.0.9
  - react-native-web 0.21.2
  - react-native-worklets 0.10.1
  - @types/react 19.2.4
  - TypeScript 6.0.3
- Phase 07 installer uses a clean install and does not run `expo install --fix`, avoiding dependency mutation after installation.

## Install
```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-07.ps1
```

Then:
```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```
