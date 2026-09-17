# AngelBird Mobile - Pinch Zoom Charts Hotfix

Mobile-only patch. Web frontend and backend are unchanged.

## Added
- Two-finger pinch zoom on **Date Wise Ticket** line chart.
- Two-finger pinch zoom on **Ticket Product Category** line chart.
- Pinch focal point is preserved while zooming so the user zooms into the area under their fingers.
- Minimum visible window is kept readable; zooming fully out restores all points.
- `Reset zoom` control appears only while a chart is zoomed.
- Existing point markers and tap/hover tooltips remain enabled.
- Single-finger report scrolling remains the normal page interaction.

## Native setup
`react-native-gesture-handler` was already part of the AngelBird Expo SDK 57 mobile project. The root layout is now wrapped in `GestureHandlerRootView` so pinch gestures work in standalone Android/iOS builds as well as development builds.

## Version
- Mobile: 0.14.4
- Android versionCode: 7
- iOS buildNumber: 5
