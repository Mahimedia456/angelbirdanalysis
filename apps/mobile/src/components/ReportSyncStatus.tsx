import { StyleSheet, Text, View } from 'react-native';

import { useReportData } from '@/reports/ReportDataProvider';
import { colors, radius, spacing } from '@/theme';

function formatShort(value: string | null | undefined) {
  if (!value) return 'Waiting for first update';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportSyncStatus() {
  const { isStale, syncMeta, backgroundSync } = useReportData();
  const updateLabel = backgroundSync.registered ? 'Auto sync on' : 'Auto refresh on';

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.pillText}>{updateLabel}</Text>
      </View>
      {isStale ? (
        <View style={[styles.pill, styles.refreshPill]}>
          <Text style={styles.pillText}>Refresh recommended</Text>
        </View>
      ) : null}
      <Text style={styles.meta}>Updated: {formatShort(syncMeta.lastSuccessAt)} · Pull down to refresh anytime</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface.soft,
  },
  refreshPill: {
    borderColor: colors.brand.accent,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.state.success,
  },
  pillText: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  meta: {
    width: '100%',
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '600',
  },
});
