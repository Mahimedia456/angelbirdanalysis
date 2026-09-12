# QA - Web Reporting Corrections 02

Static patch checks prepared for:

- Ticket Procedure chart removed.
- Procedure Wise ticket-table tab removed.
- Procedure column removed from ticket table and ticket export.
- Ticket # is the first ticket-table column and Date follows immediately.
- Satisfaction rating control removed from the global filter form.
- Satisfaction data table has local `Good -> Bad -> All` selector, defaulting to Good.
- Satisfaction table column order remains Ticket ID -> Date -> Comment -> Rating -> AI Summary.
- Month-wise RMA chart removed.
- Prior web refinements preserved.

Run `VERIFY-WEB-REPORTING-CORRECTIONS-02.ps1` in the project root for static checks plus the actual Vite production build in the user's environment.
