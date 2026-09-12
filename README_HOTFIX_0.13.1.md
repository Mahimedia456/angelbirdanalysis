# AngelBird Mobile Hotfix 0.13.1

Fixes the Phase 0.13.0 TypeScript build blockers in `ReportCharts.tsx`:

- Safe access for the YYYY-MM month regex captures under strict/noUncheckedIndexedAccess TypeScript settings.
- Replaces unavailable `StyleSheet.absoluteFillObject` typing with supported `StyleSheet.absoluteFill`.
- Bumps app version to 0.13.1 and Android versionCode to 3 for the next client APK.

No report logic, backend API, authentication, sync, cache, branding, safe-area behavior, or chart mappings were changed.
