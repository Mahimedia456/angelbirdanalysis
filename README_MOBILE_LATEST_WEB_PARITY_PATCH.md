# AngelBird Mobile Latest Web Parity Patch

Mobile-only patch. Web frontend and backend are intentionally not included.

## Included parity updates

- RMA records are unique by Ticket # on-device as a safeguard for old/offline cache.
- Latest dated RMA row wins; blank values are backfilled from older duplicate rows.
- RMA Issues and Warranty Status normalization.
- RMA filters: Issues + Warranty Status.
- RMA analytics order:
  1. Date-wise RMA
  2. RMA Month-wise Trend
  3. Monthly RMA Overview — Category Wise
  4. Trending Issues by Month heatmap
  5. Overall Issues Distribution
  6. Warranty Status donut
  7. RMA by Region
  8. RMA Type
  9. Products by RMA
- Dedicated RMA table shows Issues + Warranty Status.
- Ticket RMA/Data Recovery KPI uses dedicated RMA rows plus Support Category fallback without double counting.
- Satisfaction records read Internal Note + External Team Note.
- Satisfaction table allows owner/admin/analyst to write/edit Internal Note and External Team Note via the existing PATCH endpoint.
- Viewer remains read-only for notes.
- AI Satisfaction request includes customer comment + Internal Note + External Team Note.
- Ticket IDs in dedicated mobile tables open the AngelBird Zendesk ticket URL.
- Existing date picker, pinch zoom, separate table screens, safe-area tabs, sync/cache and splash remain preserved.

## Version

- Mobile: 0.15.0
- Android versionCode: 8
- iOS buildNumber: 6

## Verify

From `D:\angelbird-analytics\apps\mobile`:

```powershell
npm run typecheck
npx expo-doctor
npx expo start --clear
```
