import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useReportData } from '@/reports/ReportDataProvider';
import type { ReportRow, RmaReportRow } from '@/reports/types';
import { colors, radius, spacing, typography } from '@/theme';

type ReportKind = 'tickets' | 'satisfaction' | 'rma';

type Props = {
  kind: ReportKind;
  title: string;
  description: string;
};

type PreviewRow = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string;
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function pick(row: ReportRow, keys: string[]) {
  for (const key of keys) {
    const value = clean(row[key]);
    if (value) return value;
  }
  return '';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ticketPreview(rows: ReportRow[]): PreviewRow[] {
  return rows.slice(0, 12).map((row, index) => {
    const ticket = pick(row, ['ticketNumber', 'ticket_number', 'ticket_id', 'ticketId']);
    const subject = pick(row, ['ticketSubject', 'ticket_subject', 'subject']);
    const region = pick(row, ['region']);
    const date = pick(row, ['date', 'ticket_date', 'date_display']);

    return {
      id: `${ticket || 'ticket'}-${clean(row.sheet_row_number) || index}`,
      eyebrow: ticket || `Ticket row ${index + 1}`,
      title: subject || 'No subject',
      subtitle: region || 'No region',
      meta: date || 'No date',
    };
  });
}

function satisfactionPreview(rows: ReportRow[]): PreviewRow[] {
  return rows.slice(0, 12).map((row, index) => {
    const ticket = pick(row, ['ticketNumber', 'ticket_number', 'ticket_id', 'ticketId']);
    const rating = pick(row, ['rating', 'satisfactionRating', 'satisfaction_rating']);
    const comment = pick(row, ['comment', 'comments', 'feedback', 'satisfaction_comment']);
    const date = pick(row, ['date', 'updatedDate', 'updated_date', 'response_date']);

    return {
      id: `${ticket || 'satisfaction'}-${clean(row.sheet_row_number) || index}`,
      eyebrow: ticket || `Satisfaction row ${index + 1}`,
      title: rating ? `Rating: ${rating}` : 'Rating not supplied',
      subtitle: comment || 'No comment',
      meta: date || 'No date',
    };
  });
}

function rmaPreview(rows: RmaReportRow[]): PreviewRow[] {
  return rows.slice(0, 12).map((row, index) => ({
    id: `${row.ticketNumber || row.id || index}`,
    eyebrow: row.ticketNumber || `RMA row ${index + 1}`,
    title: row.ticketSubject || row.rmaType || 'RMA',
    subtitle: [row.region, row.rmaType].filter(Boolean).join(' · '),
    meta: row.date || 'No date',
  }));
}

export function LiveReportScreen({ kind, title, description }: Props) {
  const { status, sheet, rma, error, lastSyncedAt, refresh } = useReportData();

  const rows = useMemo(() => {
    if (kind === 'tickets') return ticketPreview(sheet?.tickets || []);
    if (kind === 'satisfaction') return satisfactionPreview(sheet?.satisfaction || []);
    return rmaPreview(rma?.rows || []);
  }, [kind, rma?.rows, sheet?.satisfaction, sheet?.tickets]);

  const total =
    kind === 'tickets'
      ? sheet?.summary.ticketCount || 0
      : kind === 'satisfaction'
        ? sheet?.summary.satisfactionCount || 0
        : rma?.summary.totalRows || 0;

  const secondaryValue =
    kind === 'rma'
      ? rma?.analytics.uniqueTickets || 0
      : sheet?.summary.totalRows || 0;

  const secondaryLabel = kind === 'rma' ? 'Unique tickets' : 'Report rows';
  const isBusy = status === 'loading' || status === 'refreshing';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={status === 'refreshing'}
          onRefresh={() => void refresh()}
          tintColor={colors.brand.ink}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE REPORTING</Text>
          </View>
          {isBusy ? <ActivityIndicator size="small" color={colors.brand.ink} /> : null}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.syncText}>Last synced: {formatDateTime(lastSyncedAt)}</Text>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Refresh issue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{kind === 'rma' ? 'RMA rows' : 'Records'}</Text>
          <Text style={styles.kpiValue}>{total.toLocaleString()}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{secondaryLabel}</Text>
          <Text style={styles.kpiValue}>{secondaryValue.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>Latest report data</Text>
          <Text style={styles.sectionCaption}>Previewing up to 12 normalized rows</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => void refresh()}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <Text style={styles.refreshText}>{isBusy ? 'Syncing…' : 'Sync now'}</Text>
        </Pressable>
      </View>

      {status === 'loading' && rows.length === 0 ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.brand.ink} />
          <Text style={styles.loadingText}>Loading live reporting data…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No rows available</Text>
          <Text style={styles.emptyText}>
            No normalized rows are available for this report.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.id} style={styles.rowCard}>
              <View style={styles.rowTop}>
                <Text numberOfLines={1} style={styles.eyebrow}>{row.eyebrow}</Text>
                <Text style={styles.meta}>{row.meta}</Text>
              </View>
              <Text numberOfLines={2} style={styles.rowTitle}>{row.title}</Text>
              <Text numberOfLines={2} style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  hero: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  heroTopRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.soft,
  },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.state.success },
  liveText: {
    color: colors.text.brand,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: { marginTop: spacing.md, color: colors.text.primary, ...typography.title },
  description: {
    marginTop: 6,
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  syncText: {
    marginTop: spacing.md,
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  errorCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
  },
  errorTitle: { color: '#991B1B', fontSize: 13, fontWeight: '900' },
  errorMessage: {
    marginTop: 5,
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.ink,
  },
  retryText: { color: colors.text.inverse, fontSize: 11, fontWeight: '900' },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: {
    minHeight: 96,
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  kpiLabel: { color: colors.text.secondary, fontSize: 11, fontWeight: '800' },
  kpiValue: { color: colors.text.primary, fontSize: 28, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: colors.text.primary, ...typography.sectionTitle },
  sectionCaption: {
    marginTop: 2,
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  refreshButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
  },
  refreshText: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  list: { gap: spacing.sm },
  rowCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: {
    flex: 1,
    color: colors.text.brand,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  meta: { color: colors.text.muted, fontSize: 9, fontWeight: '700' },
  rowTitle: {
    marginTop: 7,
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  rowSubtitle: {
    marginTop: 4,
    color: colors.text.secondary,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
  },
  loadingCard: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  loadingText: { color: colors.text.secondary, fontSize: 11, fontWeight: '700' },
  emptyCard: {
    minHeight: 120,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  emptyTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '900' },
  emptyText: {
    marginTop: 5,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
  },
  phaseNote: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.brand.ink },
  phaseNoteTitle: {
    color: colors.brand.accent,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  phaseNoteText: {
    marginTop: 6,
    color: colors.text.inverse,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
  },
  pressed: { opacity: 0.72 },
});
