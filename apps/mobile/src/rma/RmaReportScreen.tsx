import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HorizontalBarChart, LineTrendChart, VerticalBarChart } from '@/components/ReportCharts';
import { DateFilterField } from '@/components/DateFilterField';
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
        <Pressable onPress={() => onSelect('')} style={[styles.chip, !selected && styles.chipActive]}><Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text></Pressable>
        {values.map((value) => {
          const active = selected === value;
          return <Pressable key={`${label}-${value}`} onPress={() => onSelect(active ? '' : value)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{renderLabel ? renderLabel(value) : value}</Text></Pressable>;
        })}
      </ScrollView>
    </View>
  );
}

function RmaCard({ row }: { row: NormalizedRma }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={styles.ticketNumberPill}><Text style={styles.ticketNumber}>{row._ticketNumber || 'No ticket #'}</Text></View>
        <Text style={styles.recordDate}>{row._dateDisplay || row._date || '-'}</Text>
      </View>

      <View style={styles.regionRow}>
        <Text style={styles.detailLabel}>REGION</Text>
        <Text style={styles.regionValue}>{row._region || '-'}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>PRODUCT 1</Text>
        <Text style={styles.detailValue}>{row._product1 || '-'}</Text>
      </View>

      <Text style={styles.recordSubject}>{row._subject || 'No ticket subject'}</Text>

      <View style={styles.typeRow}>
        <Text style={styles.detailLabel}>RMA TYPE</Text>
        <View style={styles.typePill}><Text style={styles.typeText}>{row._rmaType || 'RMA'}</Text></View>
      </View>
    </View>
  );
}

export function RmaReportScreen() {
  const router = useRouter();
  const { status, rma, error, lastSyncedAt, refresh } = useReportData();
  const [filters, setFilters] = useState<RmaFiltersState>(EMPTY_RMA_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const rows = useMemo(() => normalizeRmaRows(rma?.rows || []), [rma?.rows]);
  const options = useMemo(() => rmaFilterOptions(rows), [rows]);
  const filtered = useMemo(() => filterRmaRows(rows, filters), [rows, filters]);
  const analytics = useMemo(() => buildRmaAnalytics(filtered), [filtered]);
  const isBusy = status === 'loading' || status === 'refreshing';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function patch<K extends keyof RmaFiltersState>(field: K, value: RmaFiltersState[K]) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE REPORTING</Text></View>
          {isBusy ? <ActivityIndicator size="small" color={colors.brand.ink} /> : null}
        </View>
        <Text style={styles.title}>RMA Report</Text>
        <Text style={styles.description}>RMA KPIs, region/type/date/product analytics and synchronized records.</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncText}>Last synced: {formatDateTime(lastSyncedAt)}</Text>
          <Pressable disabled={isBusy} onPress={() => void refresh()} style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}><Text style={styles.syncButtonText}>{isBusy ? 'Syncing…' : 'Sync now'}</Text></Pressable>
        </View>
        <ReportSyncStatus />
      </View>

      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>RMA refresh issue</Text><Text style={styles.errorMessage}>{error}</Text><Pressable onPress={() => void refresh()} style={styles.errorButton}><Text style={styles.errorButtonText}>Retry</Text></Pressable></View> : null}

      <View style={styles.searchPanel}>
        <Text style={styles.panelEyebrow}>FILTERS</Text>
        <View style={styles.searchRow}>
          <TextInput value={filters.search} onChangeText={(value) => patch('search', value)} placeholder="Search ticket, product, subject…" placeholderTextColor={colors.text.muted} autoCapitalize="none" autoCorrect={false} style={styles.searchInput} />
          <Pressable onPress={() => setFiltersOpen((value) => !value)} style={[styles.filterToggle, filtersOpen && styles.filterToggleActive]}><Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text></Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <ChipGroup label="Year" values={options.years} selected={filters.year} onSelect={(value) => patch('year', value)} />
            <ChipGroup label="Month" values={options.months} selected={filters.month} onSelect={(value) => patch('month', value)} renderLabel={(value) => MONTH_LABELS[value] || value} />
            <ChipGroup label="Region" values={options.regions} selected={filters.region} onSelect={(value) => patch('region', value)} />
            <ChipGroup label="RMA type" values={options.rmaTypes} selected={filters.rmaType} onSelect={(value) => patch('rmaType', value)} />
            <View style={styles.dateRow}>
              <DateFilterField label="From date" value={filters.dateFrom} maximumValue={filters.dateTo} onChange={(value) => patch('dateFrom', value)} />
              <DateFilterField label="To date" value={filters.dateTo} minimumValue={filters.dateFrom} onChange={(value) => patch('dateTo', value)} />
            </View>
            <Pressable onPress={() => setFilters(EMPTY_RMA_FILTERS)} style={styles.resetButton}><Text style={styles.resetText}>Reset all filters</Text></Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.resultSummary}><Text style={styles.resultTitle}>{filtered.length.toLocaleString()} matching RMA records</Text><Text style={styles.resultCaption}>from {rows.length.toLocaleString()} RMA records</Text></View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Total RMA" value={analytics.kpis.totalRma} accent />
        <KpiCard label="Unique tickets" value={analytics.kpis.uniqueTickets} />
        <KpiCard label="Products" value={analytics.kpis.uniqueProducts} />
        <KpiCard label="Data recovery" value={analytics.kpis.dataRecovery} />
        <KpiCard label="RMA" value={analytics.kpis.standardRma} />
        <KpiCard label="Broken plastic" value={analytics.kpis.brokenPlastic} />
        <KpiCard label="Repair & replaced" value={analytics.kpis.repairReplaced} />
      </View>

      <HorizontalBarChart title="RMA by Region" items={analytics.regionSummary} />
      <VerticalBarChart title="RMA Type" items={analytics.typeSummary} />
      <LineTrendChart title="Date-wise RMA" items={analytics.dailySummary} />
      <VerticalBarChart title="Products by RMA" items={analytics.productSummary} />

      <View style={styles.tableLaunchCard}>
        <View style={styles.tableLaunchCopy}>
          <Text style={styles.panelEyebrow}>RMA REPORT DATA</Text>
          <Text style={styles.tableLaunchTitle}>Open RMA table</Text>
          <Text style={styles.tableLaunchCaption}>{filtered.length.toLocaleString()} filtered records available in a dedicated table screen.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/report-table', params: { report: 'rma', filters: JSON.stringify(filters) } })}
          style={({ pressed }) => [styles.showTableButton, pressed && styles.pressed]}
        >
          <Text style={styles.showTableButtonText}>Show Table</Text>
          <Text style={styles.showTableButtonArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={() => void refresh('manual')} tintColor={colors.brand.ink} colors={[colors.brand.ink]} progressViewOffset={8} />}
      showsVerticalScrollIndicator={false}
    >
      {header}
    </ScrollView>
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
  rowsHeading: { paddingTop: spacing.sm },
  rowsTitle: { marginTop: 5, color: colors.text.primary, ...typography.sectionTitle },
  rowsCaption: { marginTop: 4, color: colors.text.muted, fontSize: 10, fontWeight: '600' },
  tableLaunchCard: { marginTop: spacing.sm, padding: spacing.md, gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  tableLaunchCopy: { gap: 4 },
  tableLaunchTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '900' },
  tableLaunchCaption: { color: colors.text.muted, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  showTableButton: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, backgroundColor: colors.brand.ink },
  showTableButtonText: { color: colors.text.inverse, fontSize: 12, fontWeight: '900' },
  showTableButtonArrow: { color: colors.text.inverse, fontSize: 22, lineHeight: 22, fontWeight: '700' },
  recordCard: { marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ticketNumberPill: { maxWidth: '60%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  ticketNumber: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  recordDate: { flexShrink: 1, color: colors.text.muted, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  regionRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  regionValue: { color: colors.text.brand, fontSize: 11, fontWeight: '900' },
  detailBlock: { marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  detailLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  detailValue: { marginTop: 5, color: colors.text.primary, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  recordSubject: { marginTop: 10, color: colors.text.primary, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  typeRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  typePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  typeText: { color: colors.brand.ink, fontSize: 9, fontWeight: '900' },
  loadingCard: { marginTop: spacing.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  loadingText: { color: colors.text.secondary, fontSize: 12, fontWeight: '700' },
  emptyTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { marginTop: 3, color: colors.text.muted, fontSize: 11, fontWeight: '600' },
});
