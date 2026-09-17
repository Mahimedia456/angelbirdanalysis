# QA — Web Notes + RMA Issues Final

- Satisfaction table min-width removed; wide Comment/Internal Note/External Team Note columns applied.
- RMA Issues field aliases added to backend normalization.
- RMA table includes Issues and CSV/search include Issues.
- RMA chart order updated: month trend -> category overview -> issue trend -> date -> region -> type -> product.
- Apps Script writer upgraded to spreadsheet-id based execution and deployment-health reporting.
- Backend Apps Script URL normalization handles deployment id and `/dev` -> `/exec`.
- HTTP 404 returns a specific deployment URL/redeploy message.
- Authenticated writer-health endpoint added.
- Modified backend files pass `node --check`.
