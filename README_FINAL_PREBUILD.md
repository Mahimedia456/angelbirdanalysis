# AngelBird Reporting Mobile — Final Pre-Build Corrections

This is a cumulative checkpoint based on the completed pre-build mobile work. Existing web reporting, CSV/upload functionality, backend services and database remain preserved.

## Included corrections

- Removed user-facing Google Sheet / Google Sheet Live / source wording from the mobile UI.
- Profile is now production-facing: no development phase label and no technical data-source details.
- Auto-refresh remains enabled in the foreground; native background sync is used when the OS/runtime supports it. The UI no longer shows a misleading "restricted" state.
- Ticket, Satisfaction and RMA support pull-down-to-refresh.
- RMA record details show Product 1 and Region by default; Product 2 appears only when a real Product 2 value exists; Source is never shown.
- Mobile Satisfaction report now uses the same `/api/ai/satisfaction/analyze` backend contract as the web AI analysis.
- AI modal includes team ownership, sentiment, confidence, summary, explanation, recommended action and evidence.
- AI backend route is protected with authentication and the reporting-role allowlist.
- Native splash uses the existing AngelBird favicon-derived white mark on the AngelBird ink background.
- Expo config schema fixes: removed obsolete `newArchEnabled` and `android.edgeToEdgeEnabled` entries.
- Added required Expo Router peer dependencies `expo-constants` and `expo-linking`.
- Production API remains `https://angelbirdanalysis-api.vercel.app`.

## Install

Extract/merge into the existing AngelBird project root, then run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-FINAL-PREBUILD.ps1
```

Start the app:

```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```

Verify again later with:

```powershell
cd D:\angelbird-analytics
.\VERIFY-FINAL-PREBUILD.ps1
```

## Backend note

The deployed API already remains the configured mobile endpoint. The included `aiSatisfaction.routes.js` security hardening takes effect after the backend is redeployed. The mobile sends its bearer access token to the AI endpoint either way.

EAS/build/store release work is intentionally not included in this checkpoint.
