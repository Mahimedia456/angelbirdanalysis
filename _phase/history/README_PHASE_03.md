# AngelBird Phase 03

This checkpoint advances the Expo app to authenticated live Google-Sheet reporting while preserving the existing web app, backend modules, database, and upload workflow.

## Install / verify
From the project root in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-PHASE-03.ps1
```

Then edit `apps/mobile/.env` and set your backend URL.

Start clean:

```powershell
cd .\apps\mobile
npx expo start --clear
```

The app keeps exactly three main tabs:
- Ticket Report
- Satisfaction Report
- RMA Report

Profile and Logout remain outside the tab bar.
