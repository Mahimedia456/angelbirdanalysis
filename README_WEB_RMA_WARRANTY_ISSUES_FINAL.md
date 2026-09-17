# AngelBird Web — RMA Warranty + Issues Analytics Final

This is a web/backend-only cumulative patch. Mobile files are not included or modified.

## New RMA Sheet fields

Add/use these columns in the `RMA` tab:

- `Issues`
- `Warranty Status`

Canonical Warranty Status values:

- `In Warranty`
- `Out of Warranty`

Common variants such as `in_warranty`, `under warranty`, `oow`, `expired warranty`, etc. are normalized by the backend/frontend.

An optional Apps Script helper is included at:

`tools/ANGELBIRD-RMA-WARRANTY-SETUP.gs`

Run `setupAngelBirdRmaColumns()` once if you want the Sheet columns created automatically.

## RMA filters

The main RMA filter bar now includes:

- Search
- Year
- Month
- Region
- RMA Type
- Issues
- Warranty Status
- Date From
- Date To

Issues and Warranty Status participate in the same filtered dataset used by all RMA KPIs, charts, and the report table.

## Analytics order

1. RMA Month-wise Trend
2. Monthly RMA Overview — Category Wise
3. Trending Issues by Month
4. Overall Issues Distribution
5. Warranty Status (donut)
6. Date-wise RMA
7. RMA by Region
8. RMA Type
9. Products by RMA

`Overall Issues Distribution` shows total counts for every populated Issue value across the currently filtered RMA dataset.

`Warranty Status` shows the filtered `In Warranty` vs `Out of Warranty` split as a donut chart.

## RMA table

The report table now contains:

- Ticket #
- Date
- Region
- Product 1
- Subject
- Issues
- Warranty Status
- RMA Type

The table has its own Issues and Warranty Status filters as well, and CSV export includes both fields.

## Backend

`backend/src/services/rmaAnalyticsService.js` now:

- maps `Issues` aliases
- maps `Warranty Status` aliases
- normalizes warranty values
- returns `warrantyStatus` / `warranty_status`
- generates `byIssue`
- generates `byWarrantyStatus`

The existing RMA Sheet service imports this normalizer, so no new API route is required.

## Deploy

Merge this ZIP at the project root, then restart the backend and frontend.

```powershell
cd D:\angelbird-analytics\backend
npm run dev
```

In a second terminal:

```powershell
cd D:\angelbird-analytics
npm run dev
```

For production, redeploy the backend so the RMA normalization/API includes the new Warranty Status field, then redeploy the frontend.
