# AngelBird Web — Notes Writer 404 + RMA Issues/Trends + Table Fit

This is a web/backend-only cumulative patch. Mobile files are not modified.

## Fix 1: Apps Script notes writer HTTP 404

The Google Sheets API key remains read-only. A public Sheet still cannot be anonymously written through the Google Sheets API. Note writes use the Apps Script Web app.

The backend now:
- accepts a full `/exec` URL or a raw Apps Script deployment id;
- converts `/dev` deployment URLs to `/exec`;
- rejects Sheet URLs / Apps Script editor URLs with a precise message;
- converts HTTP 404 into an actionable deployment error;
- exposes `GET /api/sheets/satisfaction/notes-writer/health` for owner/admin/analyst users.

The Apps Script file is upgraded to v2:
- stores the spreadsheet id during setup instead of relying on an active spreadsheet during Web app execution;
- ensures `Internal Note` and `External Team Note` columns exist in Satisfaction;
- ensures an `Issues` column exists in the RMA tab;
- uses a script lock for safe simultaneous writes;
- returns a health response from `doGet()`.

### Apps Script setup

Open the reporting Sheet -> Extensions -> Apps Script.
Replace the editor contents with:

`tools/ANGELBIRD-SATISFACTION-NOTES-APPS-SCRIPT.gs`

Change the token inside `setupAngelBirdConfig()`, then run that function once and authorize it.

Deploy -> Manage deployments -> New deployment -> Web app:
- Execute as: Me
- Who has access: Anyone

Copy the URL that ends in `/exec`.

Backend `.env`:

```env
GOOGLE_APPS_SCRIPT_NOTES_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_NOTES_TOKEN=THE_SAME_SECRET
```

Test it:

```powershell
cd D:\angelbird-analytics
.\TEST-APPS-SCRIPT-WRITER.ps1
```

## Fix 2: Satisfaction table no horizontal scroll

The table no longer uses a 1680px minimum width. Width is redistributed toward:
- Comment
- Internal Note
- External Team Note

Ticket ID, Date and Rating stay compact. AI Summary remains available.

## Fix 3: RMA Issues + chart order

The RMA source can now contain a column named `Issues` (aliases `Issue`, `RMA Issues`, `RMA Issue`, `issue_type`, etc. are also accepted).

RMA table columns are now:
1. Ticket #
2. Date
3. Region
4. Product 1
5. Subject
6. Issues
7. RMA Type

The RMA analytics order is:
1. RMA Month-wise Trend
2. Monthly RMA Overview — Category Wise
3. Trend Analysis / Trending Issues by Month (from `Issues`)
4. Date-wise RMA
5. RMA by Region
6. RMA Type
7. Products by RMA

If the RMA `Issues` column is empty, the trend chart shows a clear message rather than inventing issue values.
