# AngelBird Mobile — Native Calendar Date Filters

Mobile-only hotfix. Web frontend and backend are not changed.

## Changes
- Ticket Report From/To date fields are now native calendar pickers.
- Satisfaction Report From/To date fields are now native calendar pickers.
- RMA Report From/To date fields are now native calendar pickers.
- Manual YYYY-MM-DD typing is removed from the mobile filter UI.
- Selected dates still persist internally as YYYY-MM-DD so existing analytics/filter logic is unchanged.
- From date cannot be selected after an already-selected To date.
- To date cannot be selected before an already-selected From date.
- Each selected date has a clear button.
- Android uses the native Material calendar dialog.
- iOS uses a native inline calendar inside a modal with Apply/Clear controls.
- Existing pull-to-refresh, report charts, separate table screens, safe-area tabs, auth, sync/cache, AI and EAS setup remain unchanged.

## Install
Extract/merge into the AngelBird project root, then run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-MOBILE-DATE-PICKER-HOTFIX.ps1
```

Then:

```powershell
cd D:\angelbird-analytics\apps\mobile
npx expo start --clear
```
