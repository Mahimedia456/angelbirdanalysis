# AngelBird Mobile — Charts + Android Safe Area + Client APK

Version: 0.13.0

## Changes

- Android bottom reporting tabs now calculate their height/padding from the real safe-area bottom inset. The tab bar stays above 3-button and gesture navigation instead of being covered by it.
- Tab bar hides when the keyboard is open.
- Native mixed chart system added with `react-native-svg`.
- Ticket charts follow the web reporting intent: date-wise line trend plus horizontal comparison charts for support category, product category, procedure, region, TSE, and products.
- Satisfaction charts use donut charts for rating/comment composition, horizontal bars for solved/reasons, and a line trend for monthly responses.
- RMA charts mirror the web variety: region/type/product horizontal bars, date-wise line trend, and month/team donut charts.
- All charts recompute from the currently filtered mobile data.
- RMA visible record fields remain Product 1 + Region; Product 2 appears only when present; Source is not shown or included in mobile RMA search.
- Pull-to-refresh, auto refresh, AI analysis, auth, offline cache, splash, profile, roles and production API remain preserved.
- EAS `client-apk` build profile added with production API embedded as an EAS build environment variable.
- Android app version bumped to `0.13.0`; local versionCode baseline bumped to 2. EAS remote auto-increment is enabled for client APK builds.

## Install / verify

From the project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\INSTALL-FINAL-PREBUILD.ps1
```

Run locally:

```powershell
cd .\apps\mobile
npx expo start --clear
```

## Build client-installable Android APK

From the project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\BUILD-ANDROID-APK.ps1
```

The script checks TypeScript/Expo Doctor, verifies EAS login/project linkage, and starts the `client-apk` EAS cloud build. The resulting `.apk` is standalone: the client does not need Expo Go or Metro.
