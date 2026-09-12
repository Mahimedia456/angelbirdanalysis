# Phase 01 — Expo Foundation + AngelBird Theme

## Added

- `apps/mobile/` Expo SDK 57 / TypeScript application
- Expo Router root stack
- Exactly 3 bottom report tabs
- Header branding + profile route
- AngelBird color tokens matching existing web CSS:
  - Ink `#2F3D46`
  - Accent `#D7FF00`
- Existing AngelBird SVG mark rasterized for native use
- Android/iOS application identifiers
- EAS development / preview / production build profiles
- `.env.example` for later API wiring

## Intentionally not changed

- Existing root Vite/React app
- Existing `backend/`
- Existing Supabase/database schema
- Existing CSV upload/import functionality
- Existing Google Sheet backend code

## Next phase

Phase 02 — Mobile authentication + secure session + real profile/logout using the existing AngelBird backend/auth contract.
