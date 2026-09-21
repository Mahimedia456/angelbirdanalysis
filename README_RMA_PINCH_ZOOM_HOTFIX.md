# AngelBird Mobile RMA Pinch Zoom Hotfix

Mobile-only patch. Web/backend are untouched.

Changes:
- Date-wise RMA now uses the same two-finger pinch zoom behavior as Ticket Date Wise.
- Products by RMA now supports two-finger pinch zoom.
- Reset zoom appears after zooming.
- Existing tap/hover tooltips and one-finger page scrolling are preserved.

Merge this ZIP into the AngelBird project root, then run:

```powershell
cd D:\angelbird-analytics\apps\mobile
npm run typecheck
npx expo-doctor
npx expo start --clear
```
