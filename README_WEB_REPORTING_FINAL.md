# AngelBird Web Reporting — Final Refinement

Merge this ZIP into the existing AngelBird project root. It is a web-frontend-only cumulative checkpoint; mobile, backend and database files are not changed.

## Final behavior

- Ticket Procedure chart remains removed.
- Ticket Procedure is removed from the main Ticket filters.
- TSE remains hidden from visible report UI.
- Region normalization keeps `NA` displayed/aggregated as `UAE`.
- Ticket by Region remains an all-values horizontal bar chart.
- Ticket table title is `Ticket Report Data` (no data-source wording).
- Ticket table column order: Ticket #, Date, Region, Subject, Product, Support Category, Product Category.
- Ticket Product 2 remains hidden.
- Ticket Data Recovery and RMA KPI values are derived from matching normalized RMA rows by Ticket # and `RMA Type`:
  - Data Recovery = `Data Recovery` + `Data Recovery RMA`
  - RMA = exact `RMA`
- Satisfaction KPI cards remain only Total Responses, Good Ratings, Bad Ratings.
- Satisfaction table selector remains Good, Bad, All with Good selected initially.
- Satisfaction chart includes Good vs Bad plus With Comments vs Without Comments.
- Satisfaction table title no longer says Google Sheet.
- RMA table title no longer says Google Sheet.
- RMA table column order: Ticket #, Date, Region, Product 1, Subject, RMA Type.
- RMA Product 2 remains hidden.
- Month-wise RMA chart remains removed.

## Verify

From the project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-WEB-REPORTING-FINAL.ps1
```

The verifier checks the required source changes and then runs `npm run build` using the dependencies installed in your project.
