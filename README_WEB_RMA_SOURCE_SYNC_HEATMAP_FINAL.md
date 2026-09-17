# AngelBird Web — RMA Source Sync + Readable Issues Final

This is a cumulative **web/backend-only** patch. Mobile files are not included.

## Fixed: RMA Report source-of-truth

- RMA Report reads only the dedicated Google Sheet tab configured by `GOOGLE_SHEET_RMA_TAB` (default `RMA`).
- It no longer falls back to Ticket data.
- Every non-empty RMA Sheet row with an `RMA TYPE` is preserved.
- Repeated Ticket numbers are intentionally preserved because the RMA tab is row/history based.
- Old Ticket-number deduplication that could turn 9 synced rows into 5 visible rows is disabled.
- `RMA TYPE` values are dynamic. No front-end whitelist hides newly synced/custom types.

## Fixed: Ticket Report RMA / Data Recovery

Ticket KPIs now combine:

1. matching dedicated RMA-tab rows (`RMA TYPE`), and
2. Ticket-sheet `Support Category` values (`RMA`, `Data Recovery`) as a fallback.

Fallback rows are added only when the dedicated RMA tab does not already provide the same ticket/classification, avoiding double counting.

Ticket Support Category normalization also accepts additional normalized aliases.

## Improved: Trending Issues by Month

The previous multi-line chart was too crowded when many Issues existed.
It is replaced by a **month × issue heatmap**:

- rows = Issues
- columns = Months
- cell = issue count for that month
- darker lime = higher count
- total column = overall issue volume
- rows sorted by overall volume

The separate **Overall Issues Distribution** horizontal bar remains available for exact overall ranking.

## Existing features preserved

- Issues filter
- Warranty Status filter
- Warranty Status donut chart
- Monthly RMA Overview — Category Wise
- Overall Issues Distribution
- Date-wise RMA
- RMA by Region
- RMA Type
- Product Wise RMA
- Zendesk ticket links
- Satisfaction notes / AI integration

## Install

Merge this ZIP into the AngelBird project root, preserving the folder structure.

Then run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-WEB-RMA-SOURCE-SYNC-FINAL.ps1
```

Restart backend:

```powershell
cd D:\angelbird-analytics\backend
npm run dev
```

Run web:

```powershell
cd D:\angelbird-analytics
npm run dev
```

For production, redeploy the backend as this patch changes RMA Sheet normalization/source behavior.


> Superseded duplicate behavior: the latest checkpoint intentionally shows/counts one RMA record per unique Ticket #.
