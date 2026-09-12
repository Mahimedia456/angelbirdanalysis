# AngelBird Web Reporting Corrections 03

Web-only cumulative correction package. Mobile and backend are not modified.

## Included fixes

- Ticket KPI `Data Recovery` now recognizes `procedure/ticket_procedure`, `rmaType/rma_type`, support category and ticket subject aliases.
- Ticket KPI `RMA` now recognizes `procedure/ticket_procedure`, `rmaType/rma_type`, support category and ticket subject aliases.
- Data Recovery/RMA KPI counting no longer depends on a hard-coded valid-region subset.
- Ticket-number deduplication is preserved for Data Recovery/RMA KPI counts.
- Satisfaction KPI cards now show only Total Responses, Good Ratings and Bad Ratings.
- Solved / Not Solved KPIs removed.
- With Comments KPI removed.
- Solved Status filter removed from Satisfaction filters.
- Solved/Not Solved filtering removed from the report data pipeline.
- Comments Availability chart/table removed.
- Solved Status chart/table removed.
- Solved Status removed from the AI summary modal display.
- Solved Status removed from Satisfaction Excel export.
- All Corrections 01/02 reporting refinements remain included in this cumulative package.

## Apply

Extract/merge into the AngelBird project root, then run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-WEB-REPORTING-CORRECTIONS-03.ps1
```
