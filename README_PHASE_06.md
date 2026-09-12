# AngelBird Mobile — Phase 06

## RMA Report Complete

This is a cumulative checkpoint. It includes Phases 01–05 and upgrades the third reporting tab into a complete native RMA report. Existing AngelBird Vite frontend, backend, Supabase database, Google Sheet services, CSV/upload flow, Ticket Report, Satisfaction Report, authentication, Profile, and Logout remain preserved.

### Phase 06 additions

- Native RMA Report connected to `/api/rma/sheet/reports` through the authenticated production API.
- Search across ticket number, subject, TSE, region, RMA type, products, and source.
- Year, month, region, RMA type, TSE, from-date, and to-date filters.
- Filter-aware KPIs for total RMA, unique tickets, unique products, duplicate rows removed, Data Recovery, RMA, Broken Plastic, and Repair & Replaced.
- Breakdowns for region, TSE, RMA type, products, and monthly RMA trend.
- Detailed virtualized RMA cards with ticket/date/type/subject/TSE/region/products/source.
- Pull-to-refresh, Sync now, last-sync state, loading/error/empty states.
- RMA date/type/region normalization remains compatible with the current backend Sheet normalization.
- Phase 05 Expo SDK 57 dependency pins and clean-install fix remain unchanged.

### Production API

`https://angelbirdanalysis-api.vercel.app`

### Install / verify

From the extracted project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-06.ps1
```

Then:

```powershell
cd .\apps\mobile
npx expo start --clear
```

Use only `INSTALL-PHASE-06.ps1` for this checkpoint. Older installers are retained under `_phase/history` only for reference.
