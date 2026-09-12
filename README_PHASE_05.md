# AngelBird Mobile — Phase 05

## Satisfaction Report Complete

This is a cumulative checkpoint. It includes Phases 01–04 and adds the complete native Satisfaction Report while preserving the existing AngelBird Vite frontend, backend, Supabase database, Google Sheet services, CSV/upload flow, Ticket Report, auth, profile, and logout.

### Phase 05 additions

- Native Satisfaction Report screen connected to the live Google Sheet reporting response.
- Search by ticket, rating, comment, reason, and solved state.
- Year, month, rating, solved-status, reason, from-date, and to-date filters.
- Filter-aware KPIs:
  - Total Responses
  - Good Ratings + percentage
  - Bad Ratings + percentage
  - Solved Tickets + percentage
  - Not Solved + percentage
  - With Comments + percentage
- Breakdowns for ratings, solved status, comment coverage, satisfaction reasons, and responses by month.
- Virtualized matching-response cards with ticket, date, rating, solved state, customer comment, and reason.
- Pull-to-refresh, Sync now, last-sync indicator, loading/error/empty states.
- Tolerant alias normalization so existing and future Sheet columns continue to work.

### Production API

`https://angelbirdanalysis-api.vercel.app`

### Install / verify

From the extracted project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-05.ps1
```

Then:

```powershell
cd .\apps\mobile
npx expo start --clear
```

Do not run old Phase 03 or Phase 04 installers after applying this checkpoint.
