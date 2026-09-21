# AngelBird Web RMA Distinct Category Colors Hotfix

Only the RMA monthly category chart component is changed.

Updated fixed colors:
- RMA: lime
- Data Recovery: slate
- Data Recovery RMA: deep navy
- Date Recovery: blue
- Broken Plastic: orange
- Repair & Replaced: purple
- Warranty Update: cyan
- Warranty Claim: rose

New/unknown RMA types use a distinct fallback palette.

The Login/Auth page is not included and is not changed.

Merge into:
D:\angelbird-analytics

Verify:
```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-RMA-CATEGORY-COLORS.ps1
```

Then run:
```powershell
npm run dev
```
