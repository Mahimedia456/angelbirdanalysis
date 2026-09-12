# AngelBird Reporting Mobile — Phase 04

## Checkpoint
Phase 04 is cumulative over Phases 01–03. Extract it into the existing AngelBird project root. Existing web frontend, CSV/upload flow, backend controllers/services, database schema and previous reporting code remain preserved.

## Phase 04 scope

### Mobile dependency/error repair
- Expo SDK 57 dependency set is pinned rather than left to floating peer resolution.
- React is pinned to 19.2.3 and React DOM is pinned to 19.2.3.
- React Native is pinned to 0.86.3.
- react-native-worklets is pinned to 0.10.4 and Reanimated to 4.5.1.
- expo-secure-store is explicitly installed at 57.0.4.
- Removed unsupported `backgroundColor` prop from `expo-status-bar` usage.
- `expo-doctor` is included as a dev dependency so verification does not need an interactive install prompt.
- Phase 04 installer removes stale `node_modules`, `package-lock.json`, and `.expo` before a clean install. This specifically fixes the Phase 03 ERESOLVE state caused by old dependency resolution.

### Production API
Mobile is locked by default to:

`https://angelbirdanalysis-api.vercel.app`

The runtime normalizes this to:

`https://angelbirdanalysis-api.vercel.app/api`

`INSTALL-PHASE-04.ps1` backs up an existing `.env` to `.env.phase03.backup` and writes the production API URL to the active `.env`.

### Ticket Report native phase
- Google Sheet live source from shared Phase 03 report provider.
- Search across ticket number, product, subject, TSE, region, categories and procedure.
- Year, month, region, support category, product category and procedure filters.
- Date-from and date-to filters.
- Reset filters.
- Filter-aware KPI cards.
- Total tickets, products, support categories, product categories, Data Recovery, RMA-related, Troubleshoot and Hardware KPIs.
- Native horizontal breakdowns for region, TSE, support category, procedure and products.
- Searchable/filterable native ticket record cards.
- Pull-to-refresh and Sync now preserved.
- FlatList virtualization for report rows.

## Install / repair
From the real AngelBird project root, for example:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-04.ps1
```

Then:

```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```

## Important
Do not run `INSTALL-PHASE-03.ps1` after applying Phase 04. It is preserved only under `_phase/history/` for checkpoint history.

## Preserved
- Existing Vite web app.
- Existing Node/Express backend.
- Existing Supabase/database functionality.
- Existing CSV/upload functionality.
- Existing Google Sheet integration.
- Existing auth contracts.
- Existing Satisfaction and RMA Phase 03 live-report screens until their dedicated phases.
