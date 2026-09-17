# AngelBird Web RMA Unique Ticket + Layout Final

Web/backend-only cumulative patch. Mobile is untouched.

## Duplicate handling
- RMA Report now shows/counts one record per Ticket #.
- If the RMA Sheet contains duplicate Ticket # rows, the latest dated row is the primary/current record.
- Blank fields in the latest row are backfilled from the older duplicate row.
- Analytics, filters and the RMA table all operate on the same unique-ticket dataset.
- Backend summary reports how many duplicate history rows were collapsed.

## Professional RMA analytics layout
1. Date-wise RMA (full width)
2. Monthly Insights group
   - RMA Month-wise Trend
   - Monthly RMA Overview — Category Wise
   - Trending Issues by Month heatmap (full width)
3. Issue & Warranty Analysis
   - Overall Issues Distribution
   - Warranty Status donut
4. RMA Classification
   - RMA by Region
   - RMA Type
5. Products by RMA (full width)

The dedicated RMA Sheet remains the only source for the RMA Report.
