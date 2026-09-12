# AngelBird Mobile Final UI/Chart/APK Checkpoint

Version: 0.13.0

## Android navigation safe-area
- Bottom reporting tabs use `useSafeAreaInsets()`.
- Tab bar height and bottom padding include the Android system navigation inset.
- Labels/icons stay above three-button or gesture navigation.
- Tab bar hides while the keyboard is shown.

## Native chart mapping
Ticket:
- Date-wise Ticket Trend -> line chart
- Ticket Support Category -> horizontal bar
- Ticket Product Category -> horizontal bar
- Ticket Procedure -> horizontal bar
- Tickets by Region -> horizontal bar
- Tickets by TSE -> horizontal bar
- Top Products -> horizontal bar

Satisfaction:
- Good vs Bad Rating -> donut/pie
- Comments Availability -> donut/pie
- Solved Status -> horizontal bar
- Satisfaction Reasons -> horizontal bar
- Responses by Month -> line chart

RMA:
- RMA by Region -> horizontal bar
- RMA Type -> horizontal bar
- Date-wise RMA -> line chart
- Month-wise RMA -> donut/pie
- RMA Team -> donut/pie
- Top Products by RMA -> horizontal bar

## Preserved UX/data rules
- RMA cards show Product 1 and Region by default.
- Product 2 renders only when its value exists.
- Source is not exposed in RMA cards and was removed from mobile RMA search.
- Pull-to-refresh, automatic refresh, AI Satisfaction Analysis, offline cache, role security, splash, icon and production API remain intact.

## EAS APK
- `client-apk` EAS profile creates an installable APK.
- Production API is embedded in the EAS build environment.
- `BUILD-ANDROID-APK.ps1` validates the app, handles EAS login/project linking, and starts the APK cloud build.
