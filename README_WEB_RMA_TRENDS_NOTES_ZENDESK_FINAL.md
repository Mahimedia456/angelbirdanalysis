# AngelBird Web — RMA Trends + Satisfaction Notes + Zendesk Links

Web/backend update only. Mobile files are not included or modified.

## Included

### RMA reporting
- New **Monthly RMA Overview** stacked chart by normalized RMA Type.
- New **Trending Issues by Month** multi-line chart.
- Adds/normalizes `Faulty` alongside existing RMA types such as RMA, Data Recovery, Data Recovery RMA, Broken Plastic, and Repair & Replaced.
- Existing RMA filters/tables/charts remain in place.

### Satisfaction notes
- Adds **Internal Note** and **External Team Note** columns to the Satisfaction table.
- If a note is blank, authorized users see **Write Internal Note** / **Write External Team Note**.
- Existing notes are shown with an **Edit** action.
- Owner/Admin/Analyst can write; Viewer remains read-only.
- Notes are persisted back to the Satisfaction tab through the backend.
- If either note header is missing, the backend adds the missing `Internal Note` / `External Team Note` header automatically before writing.

### AI Summary
AI Satisfaction analysis now receives all available context:
- Customer satisfaction comment / feedback
- Customer reason (if present)
- Internal Note
- External Team Note
- Rating / solved status

If only one source is present, it analyzes that source. If multiple sources are present, AI synthesizes them while keeping customer/internal/external context distinct.

### Zendesk ticket links
Ticket IDs are clickable in:
- Ticket report table
- RMA report table
- Satisfaction report table
- Satisfaction AI modal

Both a numeric ID and an existing Zendesk ticket URL are parsed. The generated target is:
`https://angelbirds.zendesk.com/agent/tickets/{TICKET_ID}`

## Required backend configuration for note editing
Existing `GOOGLE_SHEETS_API_KEY` remains sufficient for reads, but API keys cannot write to a Sheet.

For web note editing, configure these backend/Vercel environment variables:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account-name@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then share the AngelBird reporting Google Sheet with `GOOGLE_SERVICE_ACCOUNT_EMAIL` as **Editor**.

The backend uses the service account only for note writes; existing read flow remains compatible.

## New API

```text
PATCH /api/sheets/satisfaction/notes
```

Authenticated roles allowed to write:
- owner
- admin
- analyst

Viewer remains read-only.

## Deployment
1. Merge this ZIP into the AngelBird project root.
2. Add the two Google service-account environment variables to the backend/Vercel deployment and share the Sheet with the service account as Editor.
3. Redeploy the backend because this update adds a new API route and expands AI input.
4. Build/deploy the web frontend.

Run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-WEB-RMA-NOTES-ZENDESK.ps1
```
