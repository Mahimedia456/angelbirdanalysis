# QA checklist

Static implementation checks completed before packaging:

- Canonical `/reports` has no visible TSE chart/table/tab/filter references.
- RMA visible table has no TSE or Product 2 columns.
- Ticket visible table has no TSE or Product 2 columns.
- Ticket by Region uses `horizontalBar`.
- Region normalization maps `NA` to `UAE` for filters, display, chart aggregation, and export.
- Chart limit default is `ALL` using a new localStorage key.
- Satisfaction filter initializes/resets to Good.
- Satisfaction table order is Ticket ID → Date → Comment → Rating → AI Summary.

A full Vite build could not be completed in the packaging environment because dependency installation timed out. `VERIFY-WEB-REPORTING-UPDATE.ps1` runs the real production build on the project machine after merge.
