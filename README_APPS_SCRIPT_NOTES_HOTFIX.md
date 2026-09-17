# AngelBird Backend Apps Script Notes Writer Hotfix

This hotfix changes Satisfaction Internal Note / External Team Note writes to prefer a Google Apps Script Web App.

## Environment variables

Backend `.env` locally and backend Vercel project:

```env
GOOGLE_APPS_SCRIPT_NOTES_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_NOTES_TOKEN=YOUR_LONG_RANDOM_SECRET
```

Service-account variables are no longer required when both Apps Script variables are set. Existing service-account support remains as a fallback.

## Apps Script setup

1. Open the reporting Google Sheet.
2. Extensions -> Apps Script.
3. Paste `tools/ANGELBIRD-SATISFACTION-NOTES-APPS-SCRIPT.gs`.
4. Change the token inside `setupAngelBirdToken()`.
5. Run `setupAngelBirdToken()` once and authorize it.
6. Deploy -> New deployment -> Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Copy the `/exec` URL into `GOOGLE_APPS_SCRIPT_NOTES_URL`.
10. Put the same secret into `GOOGLE_APPS_SCRIPT_NOTES_TOKEN`.

After env changes restart the local backend, or redeploy the backend on Vercel.
