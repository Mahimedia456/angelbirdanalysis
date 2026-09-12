import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ReportSyncStatus } from '@/components/ReportSyncStatus';
import { SatisfactionAiModal } from '@/satisfaction/SatisfactionAiModal';
import { useReportData } from '@/reports/ReportDataProvider';
import {
  buildSatisfactionAnalytics,
  EMPTY_SATISFACTION_FILTERS,
  filterSatisfactionRows,
  normalizeSatisfactionRows,
  satisfactionFilterOptions,
  type NormalizedSatisfaction,
  type SatisfactionFiltersState,
  type SatisfactionMetric,
} from '@/satisfaction/satisfactionAnalytics';
import { colors, effects, radius, spacing, typography } from '@/theme';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function formatDateTime(value: string | null) {
  if (!value) return 'Not synced yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function KpiCard({
  label,
  value,
  percent,
  accent = false,
}: {
  label: string;
  value: number;
  percent?: number;
  accent?: boolean;
}) {
  return (
    <View style={[styles.kpiCard, accent && styles.kpiAccent]}>
      <Text style={[styles.kpiLabel, accent && styles.kpiAccentLabel]}>{label}</Text>
      <View style={styles.kpiBottomRow}>
        <Text style={[styles.kpiValue, accent && styles.kpiAccentValue]}>{value.toLocaleString()}</Text>
        {percent !== undefined ? (
          <View style={[styles.percentPill, accent && styles.percentPillAccent]}>
            <Text style={[styles.percentText, accent && styles.percentTextAccent]}>{percent}%</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function MetricBars({
  title,
  items,
  maxItems = 6,
}: {
  title: string;
  items: SatisfactionMetric[];
  maxItems?: number;
}) {
  const visible = items.slice(0, maxItems);
  const max = Math.max(1, ...visible.map((item) => item.value));

  return (
    <View style={styles.panel}>
      <Text style={styles.panelEyebrow}>BREAKDOWN</Text>
      <Text style={styles.panelTitle}>{title}</Text>
      {visible.length === 0 ? (
        <Text style={styles.emptyText}>No values available.</Text>
      ) : (
        <View style={styles.barList}>
          {visible.map((item) => (
            <View key={`${title}-${item.name}`} style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text numberOfLines={1} style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barValue}>{item.value.toLocaleString()}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(5, (item.value / max) * 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ChipGroup({
  label,
  values,
  selected,
  onSelect,
  renderLabel,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
  renderLabel?: (value: string) => string;
}) {
  if (values.length === 0) return null;

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable onPress={() => onSelect('')} style={[styles.chip, !selected && styles.chipActive]}>
          <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text>
        </Pressable>
        {values.map((value) => {
          const active = selected === value;
          return (
            <Pressable
              key={`${label}-${value}`}
              onPress={() => onSelect(active ? '' : value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {renderLabel ? renderLabel(value) : value}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SatisfactionCard({ row, onAnalyze }: { row: NormalizedSatisfaction; onAnalyze: (row: NormalizedSatisfaction) => void }) {
  const good = row._rating === 'Good';
  const bad = row._rating === 'Bad';
  const canAnalyze = Boolean(row._comment || (row._reason && row._reason !== 'No reason given'));

  return (
    <View style={styles.responseCard}>
      <View style={styles.responseTop}>
        <View style={styles.ticketPill}>
          <Text style={styles.ticketNumber}>{row._ticketNumber || 'No ticket #'}</Text>
        </View>
        <Text style={styles.responseDate}>{row._dateDisplay || row._date || '-'}</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.ratingBadge, good && styles.ratingGood, bad && styles.ratingBad]}>
          <Text style={[styles.ratingText, good && styles.ratingGoodText, bad && styles.ratingBadText]}>
            {row._rating}
          </Text>
        </View>
        <View style={[styles.solvedBadge, row._isSolved && styles.solvedBadgeActive]}>
          <Text style={[styles.solvedText, row._isSolved && styles.solvedTextActive]}>{row._solvedLabel}</Text>
        </View>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>CUSTOMER COMMENT</Text>
        <Text style={styles.commentText}>{row._comment || 'No comment supplied.'}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>REASON</Text>
        <Text style={styles.reasonText}>{row._reason}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canAnalyze}
        onPress={() => onAnalyze(row)}
        style={({ pressed }) => [styles.aiButton, !canAnalyze && styles.aiButtonDisabled, pressed && canAnalyze && styles.pressed]}
      >
        <Text style={styles.aiButtonBadge}>AI</Text>
        <View style={styles.aiButtonCopy}>
          <Text style={styles.aiButtonTitle}>Analyze response</Text>
          <Text style={styles.aiButtonCaption}>Team ownership, sentiment and recommended action</Text>
        </View>
        <Text style={styles.aiButtonArrow}>›</Text>
      </Pressable>
    </View>
  );
}

export function SatisfactionReportScreen() {
  const { status, sheet, error, lastSyncedAt, refresh } = useReportData();
  const [filters, setFilters] = useState<SatisfactionFiltersState>(EMPTY_SATISFACTION_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [analysisRow, setAnalysisRow] = useState<NormalizedSatisfaction | null>(null);

  const responses = useMemo(
    () => normalizeSatisfactionRows(sheet?.satisfaction || []),
    [sheet?.satisfaction],
  );
  const options = useMemo(() => satisfactionFilterOptions(responses), [responses]);
  const filtered = useMemo(
    () => filterSatisfactionRows(responses, filters),
    [responses, filters],
  );
  const analytics = useMemo(() => buildSatisfactionAnalytics(filtered), [filtered]);
  const isBusy = status === 'loading' || status === 'refreshing';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function patch<K extends keyof SatisfactionFiltersState>(
    field: K,
    value: SatisfactionFiltersState[K],
  ) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE REPORTING</Text>
          </View>
          {isBusy ? <ActivityIndicator size="small" color={colors.brand.ink} /> : null}
        </View>
        <Text style={styles.title}>Satisfaction Report</Text>
        <Text style={styles.description}>
          Customer satisfaction ratings, comments, response analytics and AI-assisted review.
        </Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncText}>Last synced: {formatDateTime(lastSyncedAt)}</Text>
          <Pressable
            disabled={isBusy}
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
          >
            <Text style={styles.syncButtonText}>{isBusy ? 'Syncing…' : 'Sync now'}</Text>
          </Pressable>
        </View>
        <ReportSyncStatus />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Reporting refresh issue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.searchPanel}>
        <Text style={styles.panelEyebrow}>FILTERS</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={filters.search}
            onChangeText={(value) => patch('search', value)}
            placeholder="Search ticket, comment, reason…"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <Pressable
            onPress={() => setFiltersOpen((value) => !value)}
            style={[styles.filterToggle, filtersOpen && styles.filterToggleActive]}
          >
            <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <ChipGroup
              label="Year"
              values={options.years}
              selected={filters.year}
              onSelect={(value) => patch('year', value)}
            />
            <ChipGroup
              label="Month"
              values={options.months}
              selected={filters.month}
              onSelect={(value) => patch('month', value)}
              renderLabel={(value) => MONTH_LABELS[value] || value}
            />
            <ChipGroup
              label="Rating"
              values={options.ratings}
              selected={filters.rating}
              onSelect={(value) => patch('rating', value)}
            />
            <ChipGroup
              label="Solved status"
              values={['solved', 'not_solved']}
              selected={filters.solvedStatus}
              onSelect={(value) => patch('solvedStatus', value)}
              renderLabel={(value) => value === 'solved' ? 'Solved' : 'Not Solved'}
            />
            <ChipGroup
              label="Reason"
              values={options.reasons}
              selected={filters.reason}
              onSelect={(value) => patch('reason', value)}
            />
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>From (YYYY-MM-DD)</Text>
                <TextInput
                  value={filters.dateFrom}
                  onChangeText={(value) => patch('dateFrom', value)}
                  placeholder="2026-01-01"
                  placeholderTextColor={colors.text.muted}
                  style={styles.dateInput}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>To (YYYY-MM-DD)</Text>
                <TextInput
                  value={filters.dateTo}
                  onChangeText={(value) => patch('dateTo', value)}
                  placeholder="2026-12-31"
                  placeholderTextColor={colors.text.muted}
                  style={styles.dateInput}
                />
              </View>
            </View>
            <Pressable onPress={() => setFilters(EMPTY_SATISFACTION_FILTERS)} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset all filters</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.resultSummary}>
        <Text style={styles.resultTitle}>{filtered.length.toLocaleString()} matching responses</Text>
        <Text style={styles.resultCaption}>from {responses.length.toLocaleString()} satisfaction records</Text>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Total responses" value={analytics.kpis.totalResponses} accent />
        <KpiCard label="Good ratings" value={analytics.kpis.goodCount} percent={analytics.kpis.goodPercent} />
        <KpiCard label="Bad ratings" value={analytics.kpis.badCount} percent={analytics.kpis.badPercent} />
        <KpiCard label="Solved tickets" value={analytics.kpis.solvedCount} percent={analytics.kpis.solvedPercent} />
        <KpiCard label="Not solved" value={analytics.kpis.notSolvedCount} percent={analytics.kpis.notSolvedPercent} />
        <KpiCard label="With comments" value={analytics.kpis.commentCount} percent={analytics.kpis.commentPercent} />
      </View>

      <MetricBars title="Ratings" items={analytics.ratingSummary} />
      <MetricBars title="Solved status" items={analytics.solvedSummary} />
      <MetricBars title="Comment coverage" items={analytics.commentSummary} />
      <MetricBars title="Satisfaction reasons" items={analytics.reasonSummary} maxItems={8} />
      <MetricBars title="Responses by month" items={analytics.monthlySummary} maxItems={12} />

      <View style={styles.rowsHeading}>
        <Text style={styles.panelEyebrow}>SATISFACTION DATA</Text>
        <Text style={styles.rowsTitle}>Matching responses</Text>
        <Text style={styles.rowsCaption}>All filters update KPIs, breakdowns and response cards together.</Text>
      </View>
    </View>
  );

  return (
    <>
    <FlatList
      data={filtered}
      keyExtractor={(item, index) => `${item._ticketNumber || 'satisfaction'}-${String(item.sheet_row_number ?? index)}`}
      renderItem={({ item }) => <SatisfactionCard row={item} onAnalyze={setAnalysisRow} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        status === 'loading' ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.brand.ink} />
            <Text style={styles.loadingText}>Loading satisfaction report…</Text>
          </View>
        ) : (
          <View style={styles.loadingCard}>
            <Text style={styles.emptyTitle}>No matching responses</Text>
            <Text style={styles.emptyText}>Try clearing one or more satisfaction filters.</Text>
          </View>
        )
      }
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={status === 'refreshing'}
          onRefresh={() => void refresh('manual')}
          tintColor={colors.brand.ink}
          colors={[colors.brand.ink]}
          progressViewOffset={8}
        />
      }
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
    />
    <SatisfactionAiModal row={analysisRow} onClose={() => setAnalysisRow(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 112 },
  headerContent: { gap: spacing.md, marginBottom: spacing.sm },
  hero: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderTopWidth: 3, borderColor: colors.border.default, borderTopColor: colors.brand.accent, backgroundColor: colors.surface.card, ...effects.card },
  heroTopRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.state.success },
  liveText: { color: colors.text.brand, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  title: { marginTop: spacing.md, color: colors.text.primary, ...typography.title },
  description: { marginTop: 6, color: colors.text.secondary, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  syncRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  syncText: { flex: 1, color: colors.text.muted, fontSize: 10, fontWeight: '700' },
  syncButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.brand.ink },
  syncButtonText: { color: colors.text.inverse, fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  errorCard: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF7F7' },
  errorTitle: { color: '#991B1B', fontSize: 13, fontWeight: '900' },
  errorMessage: { marginTop: 5, color: '#7F1D1D', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  errorButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: '#991B1B' },
  errorButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  searchPanel: { padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  panelEyebrow: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.25 },
  searchRow: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm },
  searchInput: { flex: 1, minHeight: 46, paddingHorizontal: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft, color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  filterToggle: { minHeight: 46, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.brand.ink },
  filterToggleActive: { backgroundColor: colors.brand.accent },
  filterToggleText: { color: colors.text.inverse, fontSize: 11, fontWeight: '900' },
  filterToggleTextActive: { color: colors.brand.ink },
  filtersBody: { marginTop: spacing.md, gap: spacing.md },
  filterGroup: { gap: 7 },
  filterLabel: { color: colors.text.secondary, fontSize: 10, fontWeight: '900' },
  chipRow: { gap: 7, paddingRight: spacing.sm },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft },
  chipActive: { borderColor: colors.brand.accent, backgroundColor: colors.brand.accent },
  chipText: { color: colors.text.secondary, fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: colors.brand.ink },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1, gap: 6 },
  dateInput: { minHeight: 42, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft, color: colors.text.primary, fontSize: 11, fontWeight: '700' },
  resetButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border.default },
  resetText: { color: colors.text.brand, fontSize: 10, fontWeight: '900' },
  resultSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingHorizontal: 2, flexWrap: 'wrap' },
  resultTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '900' },
  resultCaption: { color: colors.text.muted, fontSize: 10, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: { width: '48%', minHeight: 96, padding: spacing.md, justifyContent: 'space-between', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  kpiAccent: { borderColor: colors.brand.accent, backgroundColor: colors.brand.accent },
  kpiLabel: { color: colors.text.secondary, fontSize: 10, fontWeight: '800' },
  kpiAccentLabel: { color: colors.brand.ink },
  kpiBottomRow: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 },
  kpiValue: { color: colors.text.primary, fontSize: 26, fontWeight: '900' },
  kpiAccentValue: { color: colors.brand.ink },
  percentPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  percentPillAccent: { backgroundColor: 'rgba(47,61,70,0.12)' },
  percentText: { color: colors.text.secondary, fontSize: 9, fontWeight: '900' },
  percentTextAccent: { color: colors.brand.ink },
  panel: { padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  panelTitle: { marginTop: 5, color: colors.text.primary, ...typography.sectionTitle },
  barList: { marginTop: spacing.md, gap: 12 },
  barItem: { gap: 6 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  barLabel: { flex: 1, color: colors.text.secondary, fontSize: 11, fontWeight: '800' },
  barValue: { color: colors.text.primary, fontSize: 11, fontWeight: '900' },
  barTrack: { height: 8, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  rowsHeading: { paddingTop: spacing.sm },
  rowsTitle: { marginTop: 5, color: colors.text.primary, ...typography.sectionTitle },
  rowsCaption: { marginTop: 4, color: colors.text.muted, fontSize: 10, fontWeight: '600' },
  responseCard: { marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  responseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ticketPill: { maxWidth: '58%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  ticketNumber: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  responseDate: { flexShrink: 1, color: colors.text.muted, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  badgeRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  ratingBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft },
  ratingGood: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  ratingBad: { borderColor: '#FECACA', backgroundColor: '#FFF7F7' },
  ratingText: { color: colors.text.secondary, fontSize: 10, fontWeight: '900' },
  ratingGoodText: { color: '#166534' },
  ratingBadText: { color: '#991B1B' },
  solvedBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  solvedBadgeActive: { backgroundColor: colors.brand.ink },
  solvedText: { color: colors.text.secondary, fontSize: 10, fontWeight: '900' },
  solvedTextActive: { color: colors.text.inverse },
  detailBlock: { marginTop: spacing.md, padding: 11, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  detailLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  commentText: { marginTop: 6, color: colors.text.primary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  reasonText: { marginTop: 6, color: colors.text.secondary, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  aiButton: { marginTop: spacing.md, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brand.accent, backgroundColor: colors.surface.soft },
  aiButtonDisabled: { opacity: 0.45, borderColor: colors.border.default },
  aiButtonBadge: { minWidth: 34, paddingHorizontal: 8, paddingVertical: 7, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.brand.accent, color: colors.brand.ink, textAlign: 'center', fontSize: 10, fontWeight: '900' },
  aiButtonCopy: { flex: 1, minWidth: 0 },
  aiButtonTitle: { color: colors.text.primary, fontSize: 11, fontWeight: '900' },
  aiButtonCaption: { marginTop: 3, color: colors.text.muted, fontSize: 9, lineHeight: 13, fontWeight: '600' },
  aiButtonArrow: { color: colors.text.brand, fontSize: 24, fontWeight: '700' },
  loadingCard: { marginTop: spacing.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  loadingText: { color: colors.text.secondary, fontSize: 12, fontWeight: '700' },
  emptyTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { marginTop: 3, color: colors.text.muted, fontSize: 11, fontWeight: '600' },
});
