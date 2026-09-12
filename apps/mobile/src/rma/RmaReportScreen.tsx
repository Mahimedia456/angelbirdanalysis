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

import { DonutChart, HorizontalBarChart, LineTrendChart } from '@/components/ReportCharts';
import { ReportSyncStatus } from '@/components/ReportSyncStatus';
import { useReportData } from '@/reports/ReportDataProvider';
import {
  buildRmaAnalytics,
  EMPTY_RMA_FILTERS,
  filterRmaRows,
  normalizeRmaRows,
  rmaFilterOptions,
  type NormalizedRma,
  type RmaFiltersState,
} from '@/rma/rmaAnalytics';
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

function KpiCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={[styles.kpiCard, accent && styles.kpiAccent]}>
      <Text style={[styles.kpiLabel, accent && styles.kpiAccentLabel]}>{label}</Text>
      <Text style={[styles.kpiValue, accent && styles.kpiAccentValue]}>{value.toLocaleString()}</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

function RmaCard({ row }: { row: NormalizedRma }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={styles.ticketNumberPill}>
          <Text style={styles.ticketNumber}>{row._ticketNumber || 'No ticket #'}</Text>
        </View>
        <Text style={styles.recordDate}>{row._dateDisplay || row._date || '-'}</Text>
      </View>

      <View style={styles.typeRow}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{row._rmaType || 'RMA'}</Text>
        </View>
      </View>

      <Text style={styles.recordSubject}>{row._subject || 'No ticket subject'}</Text>

      <View style={styles.recordMetaRow}>
        <Text style={styles.recordMetaStrong}>{row._tse || 'Unknown TSE'}</Text>
        <Text style={styles.recordMetaDot}>•</Text>
        <Text style={styles.recordMeta}>{row._region || 'Unknown region'}</Text>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>PRODUCT 1</Text>
          <Text numberOfLines={2} style={styles.detailValue}>{row._product1 || '-'}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>REGION</Text>
          <Text style={styles.detailValue}>{row._region || '-'}</Text>
        </View>
        {row._product2 ? (
          <View style={styles.detailCell}>
            <Text style={styles.detailLabel}>PRODUCT 2</Text>
            <Text numberOfLines={2} style={styles.detailValue}>{row._product2}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function RmaReportScreen() {
  const { status, rma, error, lastSyncedAt, refresh } = useReportData();
  const [filters, setFilters] = useState<RmaFiltersState>(EMPTY_RMA_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const rows = useMemo(() => normalizeRmaRows(rma?.rows || []), [rma?.rows]);
  const options = useMemo(() => rmaFilterOptions(rows), [rows]);
  const filtered = useMemo(() => filterRmaRows(rows, filters), [rows, filters]);
  const analytics = useMemo(() => buildRmaAnalytics(filtered), [filtered]);
  const isBusy = status === 'loading' || status === 'refreshing';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const duplicatesRemoved = rma?.summary?.duplicateRows || 0;

  function patch<K extends keyof RmaFiltersState>(field: K, value: RmaFiltersState[K]) {
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
        <Text style={styles.title}>RMA Report</Text>
        <Text style={styles.description}>Deduplicated native RMA analytics with synchronized reporting and filter-aware insights.</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncText}>Last synced: {formatDateTime(lastSyncedAt)}</Text>
          <Pressable disabled={isBusy} onPress={() => void refresh()} style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}>
            <Text style={styles.syncButtonText}>{isBusy ? 'Syncing…' : 'Sync now'}</Text>
          </Pressable>
        </View>
        <ReportSyncStatus />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>RMA refresh issue</Text>
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
            placeholder="Search ticket, product, subject, TSE…"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <Pressable onPress={() => setFiltersOpen((value) => !value)} style={[styles.filterToggle, filtersOpen && styles.filterToggleActive]}>
            <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <ChipGroup label="Year" values={options.years} selected={filters.year} onSelect={(value) => patch('year', value)} />
            <ChipGroup label="Month" values={options.months} selected={filters.month} onSelect={(value) => patch('month', value)} renderLabel={(value) => MONTH_LABELS[value] || value} />
            <ChipGroup label="Region" values={options.regions} selected={filters.region} onSelect={(value) => patch('region', value)} />
            <ChipGroup label="RMA type" values={options.rmaTypes} selected={filters.rmaType} onSelect={(value) => patch('rmaType', value)} />
            <ChipGroup label="TSE" values={options.tses} selected={filters.tse} onSelect={(value) => patch('tse', value)} />
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>From (YYYY-MM-DD)</Text>
                <TextInput value={filters.dateFrom} onChangeText={(value) => patch('dateFrom', value)} placeholder="2026-01-01" placeholderTextColor={colors.text.muted} style={styles.dateInput} />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>To (YYYY-MM-DD)</Text>
                <TextInput value={filters.dateTo} onChangeText={(value) => patch('dateTo', value)} placeholder="2026-12-31" placeholderTextColor={colors.text.muted} style={styles.dateInput} />
              </View>
            </View>
            <Pressable onPress={() => setFilters(EMPTY_RMA_FILTERS)} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset all filters</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.resultSummary}>
        <Text style={styles.resultTitle}>{filtered.length.toLocaleString()} matching RMA records</Text>
        <Text style={styles.resultCaption}>from {rows.length.toLocaleString()} deduplicated rows</Text>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Total RMA" value={analytics.kpis.totalRma} accent />
        <KpiCard label="Unique tickets" value={analytics.kpis.uniqueTickets} />
        <KpiCard label="Products" value={analytics.kpis.uniqueProducts} />
        <KpiCard label="Duplicates removed" value={duplicatesRemoved} />
        <KpiCard label="Data recovery" value={analytics.kpis.dataRecovery} />
        <KpiCard label="RMA" value={analytics.kpis.standardRma} />
        <KpiCard label="Broken plastic" value={analytics.kpis.brokenPlastic} />
        <KpiCard label="Repair & replaced" value={analytics.kpis.repairReplaced} />
      </View>

      <HorizontalBarChart title="RMA by Region" items={analytics.regionSummary} />
      <HorizontalBarChart title="RMA Type" items={analytics.typeSummary} />
      <LineTrendChart title="Date-wise RMA" items={analytics.dailySummary} />
      <DonutChart title="Month-wise RMA" items={analytics.monthSummary} centerLabel="RMA" />
      <DonutChart title="RMA Team" items={analytics.tseSummary} centerLabel="RMA" />
      <HorizontalBarChart title="Top Products by RMA" items={analytics.productSummary} maxItems={10} />

      <View style={styles.rowsHeading}>
        <Text style={styles.panelEyebrow}>RMA DATA</Text>
        <Text style={styles.rowsTitle}>Matching records</Text>
        <Text style={styles.rowsCaption}>Search and filters apply to the KPIs, breakdowns and records below.</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item, index) => `${item._ticketNumber || 'rma'}-${String(item.id ?? index)}`}
      renderItem={({ item }) => <RmaCard row={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        status === 'loading' ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.brand.ink} />
            <Text style={styles.loadingText}>Loading RMA report…</Text>
          </View>
        ) : (
          <View style={styles.loadingCard}>
            <Text style={styles.emptyTitle}>No matching RMA records</Text>
            <Text style={styles.emptyText}>Try clearing one or more filters.</Text>
          </View>
        )
      }
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={() => void refresh('manual')} tintColor={colors.brand.ink} colors={[colors.brand.ink]} progressViewOffset={8} />}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
    />
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
  resultSummary: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 5, paddingHorizontal: 2 },
  resultTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '900' },
  resultCaption: { color: colors.text.muted, fontSize: 10, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: { width: '48%', minHeight: 92, padding: spacing.md, justifyContent: 'space-between', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  kpiAccent: { borderColor: colors.brand.accent, backgroundColor: colors.brand.accent },
  kpiLabel: { color: colors.text.secondary, fontSize: 10, fontWeight: '800' },
  kpiAccentLabel: { color: colors.brand.ink },
  kpiValue: { marginTop: 12, color: colors.text.primary, fontSize: 26, fontWeight: '900' },
  kpiAccentValue: { color: colors.brand.ink },
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
  recordCard: { marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ticketNumberPill: { maxWidth: '60%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  ticketNumber: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  recordDate: { flexShrink: 1, color: colors.text.muted, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  typeRow: { marginTop: 10, flexDirection: 'row' },
  typePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  typeText: { color: colors.text.brand, fontSize: 9, fontWeight: '900' },
  recordSubject: { marginTop: 10, color: colors.text.primary, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  recordMetaRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  recordMetaStrong: { color: colors.text.brand, fontSize: 11, fontWeight: '900' },
  recordMetaDot: { paddingHorizontal: 6, color: colors.text.muted, fontSize: 11 },
  recordMeta: { color: colors.text.secondary, fontSize: 11, fontWeight: '700' },
  detailGrid: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailCell: { width: '48%', minHeight: 62, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  detailLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  detailValue: { marginTop: 5, color: colors.text.primary, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  loadingCard: { marginTop: spacing.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  loadingText: { color: colors.text.secondary, fontSize: 12, fontWeight: '700' },
  emptyTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { marginTop: 3, color: colors.text.muted, fontSize: 11, fontWeight: '600' },
});
