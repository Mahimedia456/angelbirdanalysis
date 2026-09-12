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

import { HorizontalBarChart, LineTrendChart } from '@/components/ReportCharts';
import { ReportSyncStatus } from '@/components/ReportSyncStatus';
import { useReportData } from '@/reports/ReportDataProvider';
import { colors, effects, radius, spacing, typography } from '@/theme';
import {
  buildTicketAnalytics,
  EMPTY_TICKET_FILTERS,
  filterTickets,
  normalizeTickets,
  ticketFilterOptions,
  type NormalizedTicket,
  type TicketFiltersState,
} from '@/tickets/ticketAnalytics';

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
            <Pressable key={`${label}-${value}`} onPress={() => onSelect(active ? '' : value)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{renderLabel ? renderLabel(value) : value}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TicketCard({ ticket }: { ticket: NormalizedTicket }) {
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketTop}>
        <View style={styles.ticketNumberPill}>
          <Text style={styles.ticketNumber}>{ticket._ticketNumber || 'No ticket #'}</Text>
        </View>
        <Text style={styles.ticketDate}>{ticket._dateDisplay || ticket._date || '-'}</Text>
      </View>
      <Text style={styles.ticketSubject}>{ticket._subject || 'No subject'}</Text>
      <View style={styles.ticketMetaRow}>
        <Text style={styles.ticketMetaStrong}>{ticket._tse || 'Unknown TSE'}</Text>
        <Text style={styles.ticketMetaDot}>•</Text>
        <Text style={styles.ticketMeta}>{ticket._region || 'Unknown region'}</Text>
      </View>
      <View style={styles.detailGrid}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>PRODUCT</Text>
          <Text numberOfLines={2} style={styles.detailValue}>{ticket._product1 || '-'}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>SUPPORT</Text>
          <Text numberOfLines={2} style={styles.detailValue}>{ticket._supportCategory || '-'}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>CATEGORY</Text>
          <Text numberOfLines={2} style={styles.detailValue}>{ticket._productCategory || '-'}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>PROCEDURE</Text>
          <Text numberOfLines={2} style={styles.detailValue}>{ticket._procedure || '-'}</Text>
        </View>
      </View>
      {ticket._product2 ? <Text style={styles.secondaryProduct}>Product 2: {ticket._product2}</Text> : null}
    </View>
  );
}

export function TicketReportScreen() {
  const { status, sheet, error, lastSyncedAt, refresh } = useReportData();
  const [filters, setFilters] = useState<TicketFiltersState>(EMPTY_TICKET_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tickets = useMemo(() => normalizeTickets(sheet?.tickets || []), [sheet?.tickets]);
  const options = useMemo(() => ticketFilterOptions(tickets), [tickets]);
  const filtered = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);
  const analytics = useMemo(() => buildTicketAnalytics(filtered), [filtered]);
  const isBusy = status === 'loading' || status === 'refreshing';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function patch<K extends keyof TicketFiltersState>(field: K, value: TicketFiltersState[K]) {
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
        <Text style={styles.title}>Ticket Report</Text>
        <Text style={styles.description}>Native AngelBird ticket analytics with live reporting, filters and synchronized updates.</Text>
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
          <Text style={styles.errorTitle}>Reporting refresh issue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.errorButton}><Text style={styles.errorButtonText}>Retry</Text></Pressable>
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
            <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <ChipGroup label="Year" values={options.years} selected={filters.year} onSelect={(value) => patch('year', value)} />
            <ChipGroup label="Month" values={options.months} selected={filters.month} onSelect={(value) => patch('month', value)} renderLabel={(value) => MONTH_LABELS[value] || value} />
            <ChipGroup label="Region" values={options.regions} selected={filters.region} onSelect={(value) => patch('region', value)} />
            <ChipGroup label="Support category" values={options.supportCategories} selected={filters.supportCategory} onSelect={(value) => patch('supportCategory', value)} />
            <ChipGroup label="Product category" values={options.productCategories} selected={filters.productCategory} onSelect={(value) => patch('productCategory', value)} />
            <ChipGroup label="Procedure" values={options.procedures} selected={filters.procedure} onSelect={(value) => patch('procedure', value)} />
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
            <Pressable onPress={() => setFilters(EMPTY_TICKET_FILTERS)} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset all filters</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.resultSummary}>
        <Text style={styles.resultTitle}>{filtered.length.toLocaleString()} matching tickets</Text>
        <Text style={styles.resultCaption}>from {tickets.length.toLocaleString()} ticket records</Text>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Total tickets" value={analytics.kpis.totalTickets} accent />
        <KpiCard label="Products" value={analytics.kpis.totalProducts} />
        <KpiCard label="Support categories" value={analytics.kpis.totalSupportCategories} />
        <KpiCard label="Product categories" value={analytics.kpis.totalProductCategories} />
        <KpiCard label="Data recovery" value={analytics.kpis.dataRecoveryCount} />
        <KpiCard label="RMA related" value={analytics.kpis.rmaCount} />
        <KpiCard label="Troubleshoot" value={analytics.kpis.troubleshootCount} />
        <KpiCard label="Hardware" value={analytics.kpis.hardwareCount} />
      </View>

      <LineTrendChart title="Date-wise Ticket Trend" items={analytics.dailySummary} />
      <HorizontalBarChart title="Ticket Support Category" items={analytics.supportCategorySummary} />
      <HorizontalBarChart title="Ticket Product Category" items={analytics.productCategorySummary} />
      <HorizontalBarChart title="Ticket Procedure" items={analytics.procedureSummary} />
      <HorizontalBarChart title="Tickets by Region" items={analytics.regionSummary} />
      <HorizontalBarChart title="Tickets by TSE" items={analytics.tseSummary} />
      <HorizontalBarChart title="Top Products by Ticket Count" items={analytics.productSummary} maxItems={10} />

      <View style={styles.rowsHeading}>
        <Text style={styles.panelEyebrow}>TICKET DATA</Text>
        <Text style={styles.rowsTitle}>Matching records</Text>
        <Text style={styles.rowsCaption}>Search and filters apply to both KPIs and records below.</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item, index) => `${item._ticketNumber || 'ticket'}-${String(item.sheet_row_number ?? index)}`}
      renderItem={({ item }) => <TicketCard ticket={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        status === 'loading' ? (
          <View style={styles.loadingCard}><ActivityIndicator color={colors.brand.ink} /><Text style={styles.loadingText}>Loading ticket report…</Text></View>
        ) : (
          <View style={styles.loadingCard}><Text style={styles.emptyTitle}>No matching tickets</Text><Text style={styles.emptyText}>Try clearing one or more filters.</Text></View>
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
  resultSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingHorizontal: 2 },
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
  ticketCard: { marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ticketNumberPill: { maxWidth: '58%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  ticketNumber: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  ticketDate: { flexShrink: 1, color: colors.text.muted, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  ticketSubject: { marginTop: 11, color: colors.text.primary, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  ticketMetaRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  ticketMetaStrong: { color: colors.text.brand, fontSize: 11, fontWeight: '900' },
  ticketMetaDot: { paddingHorizontal: 6, color: colors.text.muted, fontSize: 11 },
  ticketMeta: { color: colors.text.secondary, fontSize: 11, fontWeight: '700' },
  detailGrid: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailCell: { width: '48%', minHeight: 62, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  detailLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  detailValue: { marginTop: 5, color: colors.text.primary, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  secondaryProduct: { marginTop: 10, color: colors.text.secondary, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  loadingCard: { marginTop: spacing.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  loadingText: { color: colors.text.secondary, fontSize: 12, fontWeight: '700' },
  emptyTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { marginTop: 3, color: colors.text.muted, fontSize: 11, fontWeight: '600' },
});
