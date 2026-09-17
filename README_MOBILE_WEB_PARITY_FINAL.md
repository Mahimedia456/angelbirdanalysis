# AngelBird Mobile — Final Web Reporting Parity

This cumulative mobile checkpoint aligns the Expo app with the latest accepted web reporting behavior while preserving authentication, sync/cache/security, branding, splash, Android safe-area handling, AI satisfaction analysis and the client APK build profile.

## Web parity applied
- Ticket: TSE hidden everywhere, Procedure hidden everywhere, Product 2 hidden, NA normalized into UAE, Data Recovery/RMA KPI counts linked against RMA Ticket # + RMA Type, all chart values shown by default.
- Ticket record order: Ticket #, Date, Region, Subject, Product, Support Category, Product Category.
- Satisfaction: KPI cards only Total Responses / Good Ratings / Bad Ratings; Comments chart retained; Solved/Not Solved UI removed; record selector is Good -> Bad -> All with Good selected by default; record order is Ticket ID, Date, Comment, Rating, AI Summary.
- RMA: TSE removed from filters/charts/records, Month-wise RMA removed, Product 2 removed, product analytics use Product 1 only, NA normalized into UAE.
- RMA record order: Ticket #, Date, Region, Product 1, Subject, RMA Type.
- No Google Sheet/source labels are shown in report UI.

## Interactive charts
- Line charts display visible markers for every point.
- Marker touch/click shows the exact label and value.
- Hover works where the runtime supplies pointer hover (for example Expo web / pointer-capable environments).
- Horizontal/vertical bars and donut legends are interactive and show a value tooltip.
- Chart types now mirror the accepted web report: region = horizontal bar; ordered dates/product category = line; categorical bars = vertical bar; satisfaction = donut/pie.

## Version
- Mobile app: 0.14.1
- Android versionCode: 5
- iOS buildNumber: 3
- API: https://angelbirdanalysis-api.vercel.app

## Verify
```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-FINAL-PREBUILD.ps1
```

If dependencies are already installed after merging this checkpoint, the lighter verification is:
```powershell
cd D:\angelbird-analytics\apps\mobile
npm run typecheck
npx expo-doctor
npx expo start --clear
```

## Android client APK
```powershell
cd D:\angelbird-analytics
.\BUILD-ANDROID-APK.ps1
```
