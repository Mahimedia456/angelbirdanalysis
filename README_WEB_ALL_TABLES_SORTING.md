# AngelBird Web - All Report Tables Sorting Patch

Web-only patch. Mobile and backend are not changed.

## Added

Every visible column header in the web report tables is sortable.

### Ticket table
- Ticket #
- Date
- Region
- Subject
- Product
- Support Category
- Product Category

### Satisfaction table
- Ticket ID
- Date
- Comment
- Rating
- Internal Note
- External Team Note
- AI Summary availability

### RMA table
- Ticket #
- Date
- Region
- Product 1
- Subject
- Issues
- Warranty Status
- RMA Type

## Behavior

- First click: ascending
- Second click: descending
- Active column shows up/down arrow
- Inactive columns show neutral sort icon
- Ticket IDs sort numerically
- Date columns sort chronologically
- Text columns use case-insensitive natural sorting
- Blank values stay at the bottom in both directions
- Export uses the current sorted order where the table already supports export

## Install

Extract/merge this ZIP into:

D:\angelbird-analytics

Then run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-WEB-ALL-TABLES-SORTING.ps1
npm run build
```
