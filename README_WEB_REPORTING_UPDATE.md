# AngelBird Web Reporting Refinement

This is a web-frontend-only cumulative patch. It does not modify the mobile app, backend, database, authentication, or Google Sheet sync services.

## Included changes

- All chart entry limits now default to `ALL` instead of `TOP 10`.
- Previous local chart-limit defaults are migrated by using a new preferences key.
- TSE is removed from the visible reporting UI: ticket/RMA charts, table columns, table tabs, table filters, RMA KPI cards, report search fields, and report exports.
- Region code `NA` is presented and filtered as `UAE`; Ticket by Region merges NA into UAE.
- Ticket by Region is now a horizontal bar chart and shows all regions by default.
- Satisfaction rating filter defaults to `Good`; filter order is `Good`, `Bad`, `All Ratings`.
- Satisfaction table columns are ordered: Ticket ID, Date, Comment, Rating, AI Summary.
- Ticket and RMA visible tables/exports do not expose Product 2.
- The legacy `/sheet-reports` route now reuses the canonical `/reports` implementation to prevent UI drift.

## Apply

Extract/merge this ZIP into the AngelBird project root, preserving paths.

Then run:

```powershell
cd D:\angelbird-analytics
npm run build
```

For local review:

```powershell
npm run dev
```
