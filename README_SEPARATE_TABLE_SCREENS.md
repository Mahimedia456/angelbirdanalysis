# AngelBird Mobile — Separate Report Table Screens

Mobile-only cumulative checkpoint. Web frontend and backend are not modified.

## Changes
- Ticket, Satisfaction and RMA report screens now stop after charts and a secondary dark `Show Table` CTA.
- Inline record/table sections were removed from the three report screens.
- `Show Table` opens `/report-table` as a dedicated screen.
- Dedicated table screen has a top Back control, report heading, filtered record count, column-order caption and report records.
- Current report filters are carried into the table screen.
- Satisfaction `Good / Bad / All` selection is carried into its table screen.
- Satisfaction AI Summary remains available from rows on the dedicated table screen.
- Pull-to-refresh works on both report dashboards and dedicated table screens.
- Existing chart marker/tap/hover tooltip behavior is preserved.
- Show Table uses AngelBird ink/secondary color, not the lime/yellow primary accent.

## Version
- Mobile: 0.14.3
- Android versionCode: 6
- iOS buildNumber: 4
