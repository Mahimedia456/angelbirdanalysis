# AngelBird Final Pre-Build Correction Manifest

Mobile version: 0.12.1
Production API: https://angelbirdanalysis-api.vercel.app

## User-facing corrections
- Removed all Google Sheet / Google Sheet Live / data-source labels from active mobile report UI.
- Profile no longer exposes phase/development/source/cache implementation details.
- Auto refresh displays as enabled; native background sync remains best-effort and foreground sync remains always active.
- Pull-down-to-refresh enabled on all three reports.
- RMA record field rule: Product 1 + Region default, Product 2 only when present, Source never rendered.
- Satisfaction AI Analysis uses the existing web backend contract.
- Branded native and in-app splash aligned to the favicon-derived AngelBird mark.

## Expo fixes
- Removed app config keys rejected by Expo Doctor: `newArchEnabled`, `android.edgeToEdgeEnabled`.
- Added direct Router peers: `expo-constants`, `expo-linking`.

## Backend changes
- Existing Sheet/RMA security routes preserved.
- AI Satisfaction route now requires authenticated reporting role and `no-store` response headers.

## Preserved
- Existing web frontend
- Existing CSV/upload flow
- Existing database
- Existing Sheet synchronization logic
- Ticket/Satisfaction/RMA analytics and filters
- Auth/session/cache/security logic
