import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useReportData } from '@/reports/ReportDataProvider';
import {
  EMPTY_TICKET_FILTERS,
  filterTickets,
  normalizeTickets,
  type NormalizedTicket,
  type TicketFiltersState,
} from '@/tickets/ticketAnalytics';
import {
  EMPTY_RMA_FILTERS,
  filterRmaRows,
  normalizeRmaRows,
  type NormalizedRma,
  type RmaFiltersState,
} from '@/rma/rmaAnalytics';
import {
  EMPTY_SATISFACTION_FILTERS,
  filterSatisfactionRows,
  normalizeSatisfactionRows,
  type NormalizedSatisfaction,
  type SatisfactionFiltersState,
} from '@/satisfaction/satisfactionAnalytics';
import { SatisfactionAiModal } from '@/satisfaction/SatisfactionAiModal';
import { colors, effects, radius, spacing, typography } from '@/theme';

type ReportType = 'ticket' | 'satisfaction' | 'rma';
type RatingView = 'Good' | 'Bad' | 'All';

function safeParse<T extends object>(raw: string | string[] | undefined, fallback: T): T {
  if (!raw || Array.isArray(raw)) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function openZendeskTicket(ticketNumber: string) {
  const id = String(ticketNumber || '').match(/\d+/)?.[0];
  if (!id) return;
  void Linking.openURL(`https://angelbirds.zendesk.com/agent/tickets/${id}`);
}

function TicketCard({ ticket }: { ticket: NormalizedTicket }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <Pressable onPress={() => openZendeskTicket(ticket._ticketNumber)} style={styles.ticketPill}><Text style={styles.ticketNumber}>{ticket._ticketNumber || 'No ticket #'}</Text></Pressable>
        <Text style={styles.recordDate}>{ticket._dateDisplay || ticket._date || '-'}</Text>
      </View>

      <View style={styles.regionRow}>
        <Text style={styles.detailLabel}>REGION</Text>
        <Text style={styles.regionValue}>{ticket._region || '-'}</Text>
      </View>

      <Text style={styles.subject}>{ticket._subject || 'No subject'}</Text>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>PRODUCT</Text>
        <Text style={styles.detailValue}>{ticket._product1 || '-'}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>SUPPORT CATEGORY</Text>
        <Text style={styles.detailValue}>{ticket._supportCategory || '-'}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>PRODUCT CATEGORY</Text>
        <Text style={styles.detailValue}>{ticket._productCategory || '-'}</Text>
      </View>
    </View>
  );
}

function RmaCard({ row }: { row: NormalizedRma }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <Pressable onPress={() => openZendeskTicket(row._ticketNumber)} style={styles.ticketPill}><Text style={styles.ticketNumber}>{row._ticketNumber || 'No ticket #'}</Text></Pressable>
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

      <Text style={styles.subject}>{row._subject || 'No ticket subject'}</Text>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>ISSUES</Text>
        <Text style={styles.detailValue}>{row._issue || '-'}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>WARRANTY STATUS</Text>
        <Text style={styles.detailValue}>{row._warrantyStatus || '-'}</Text>
      </View>

      <View style={styles.typeRow}>
        <Text style={styles.detailLabel}>RMA TYPE</Text>
        <View style={styles.typePill}><Text style={styles.typeText}>{row._rmaType || 'RMA'}</Text></View>
      </View>
    </View>
  );
}

function SatisfactionCard({
  row,
  onAnalyze,
  onEditNote,
  editableNotes,
}: {
  row: NormalizedSatisfaction;
  onAnalyze: (row: NormalizedSatisfaction) => void;
  onEditNote: (row: NormalizedSatisfaction, field: 'internalNote' | 'externalTeamNote') => void;
  editableNotes: boolean;
}) {
  const good = row._rating === 'Good';
  const bad = row._rating === 'Bad';
  const canAnalyze = Boolean(row._comment || row._internalNote || row._externalTeamNote || (row._reason && row._reason !== 'No reason given'));

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <Pressable onPress={() => openZendeskTicket(row._ticketNumber)} style={styles.ticketPill}><Text style={styles.ticketNumber}>{row._ticketNumber || 'No ticket #'}</Text></Pressable>
        <Text style={styles.recordDate}>{row._dateDisplay || row._date || '-'}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>COMMENT</Text>
        <Text style={styles.commentText}>{row._comment || 'No comment supplied.'}</Text>
      </View>

      <View style={styles.typeRow}>
        <Text style={styles.detailLabel}>RATING</Text>
        <View style={[styles.ratingBadge, good && styles.ratingGood, bad && styles.ratingBad]}>
          <Text style={[styles.ratingText, good && styles.ratingGoodText, bad && styles.ratingBadText]}>{row._rating}</Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.detailLabel}>INTERNAL NOTE</Text>
        <Text style={styles.noteText}>{row._internalNote || 'No internal note yet.'}</Text>
        {editableNotes ? (
          <Pressable onPress={() => onEditNote(row, 'internalNote')} style={({ pressed }) => [styles.noteButton, pressed && styles.pressed]}>
            <Text style={styles.noteButtonText}>{row._internalNote ? 'Edit Internal Note' : 'Write Internal Note'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.detailLabel}>EXTERNAL TEAM NOTE</Text>
        <Text style={styles.noteText}>{row._externalTeamNote || 'No external team note yet.'}</Text>
        {editableNotes ? (
          <Pressable onPress={() => onEditNote(row, 'externalTeamNote')} style={({ pressed }) => [styles.noteButton, pressed && styles.pressed]}>
            <Text style={styles.noteButtonText}>{row._externalTeamNote ? 'Edit External Team Note' : 'Write External Team Note'}</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canAnalyze}
        onPress={() => onAnalyze(row)}
        style={({ pressed }) => [styles.aiButton, !canAnalyze && styles.aiButtonDisabled, pressed && canAnalyze && styles.pressed]}
      >
        <View>
          <Text style={styles.aiButtonTitle}>View AI Summary</Text>
          <Text style={styles.aiButtonCaption}>Comment + internal + external context</Text>
        </View>
        <Text style={styles.aiButtonArrow}>›</Text>
      </Pressable>
    </View>
  );
}

type NoteEditorState = {
  row: NormalizedSatisfaction;
  field: 'internalNote' | 'externalTeamNote';
  value: string;
} | null;

export function ReportTableScreen() {
  const router = useRouter();
  const { request, user } = useAuth();
  const params = useLocalSearchParams<{ report?: string; filters?: string; ratingView?: string }>();
  const { status, sheet, rma, refresh } = useReportData();
  const [analysisRow, setAnalysisRow] = useState<NormalizedSatisfaction | null>(null);
  const [noteEditor, setNoteEditor] = useState<NoteEditorState>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const report: ReportType = params.report === 'satisfaction' || params.report === 'rma' ? params.report : 'ticket';
  const canEditNotes = ['owner', 'admin', 'analyst'].includes(String(user?.role || '').toLowerCase());
  const ratingView: RatingView = params.ratingView === 'Bad' || params.ratingView === 'All' ? params.ratingView : 'Good';

  const ticketFilters = useMemo(() => safeParse<TicketFiltersState>(params.filters, EMPTY_TICKET_FILTERS), [params.filters]);
  const satisfactionFilters = useMemo(() => safeParse<SatisfactionFiltersState>(params.filters, EMPTY_SATISFACTION_FILTERS), [params.filters]);
  const rmaFilters = useMemo(() => safeParse<RmaFiltersState>(params.filters, EMPTY_RMA_FILTERS), [params.filters]);

  const tickets = useMemo(() => filterTickets(normalizeTickets(sheet?.tickets || []), ticketFilters), [sheet?.tickets, ticketFilters]);
  const satisfaction = useMemo(() => {
    const rows = filterSatisfactionRows(normalizeSatisfactionRows(sheet?.satisfaction || []), satisfactionFilters);
    return ratingView === 'All' ? rows : rows.filter((row) => row._rating === ratingView);
  }, [sheet?.satisfaction, satisfactionFilters, ratingView]);
  const rmaRows = useMemo(() => filterRmaRows(normalizeRmaRows(rma?.rows || []), rmaFilters), [rma?.rows, rmaFilters]);

  async function saveNote() {
    if (!noteEditor) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      await request('/sheets/satisfaction/notes', {
        method: 'PATCH',
        body: {
          ticketId: noteEditor.row._ticketNumber,
          sheetRowNumber: noteEditor.row.sheet_row_number,
          [noteEditor.field]: noteEditor.value,
        },
      });
      setNoteEditor(null);
      await refresh('manual');
    } catch (error) {
      setNoteError(error instanceof Error ? error.message : 'Unable to save note.');
    } finally {
      setNoteSaving(false);
    }
  }

  const config = report === 'ticket'
    ? { eyebrow: 'TICKET DATA', title: 'Ticket Report Data', caption: 'Ticket # → Date → Region → Subject → Product → Support Category → Product Category.', count: tickets.length }
    : report === 'satisfaction'
      ? { eyebrow: 'SATISFACTION DATA', title: 'Customer Satisfaction Report Data', caption: `Ticket ID → Date → Comment → Rating → Internal Note → External Team Note → AI Summary · ${ratingView}`, count: satisfaction.length }
      : { eyebrow: 'RMA DATA', title: 'RMA Report Data', caption: 'Ticket # → Date → Region → Product 1 → Subject → Issues → Warranty Status → RMA Type.', count: rmaRows.length };

  const data = report === 'ticket' ? tickets : report === 'satisfaction' ? satisfaction : rmaRows;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topHeader}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerLabel}>REPORT DATA</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item: any, index) => `${report}-${String(item._ticketNumber || item.id || item.sheet_row_number || index)}-${index}`}
        renderItem={({ item }: { item: any }) => report === 'ticket'
          ? <TicketCard ticket={item as NormalizedTicket} />
          : report === 'satisfaction'
            ? <SatisfactionCard row={item as NormalizedSatisfaction} onAnalyze={setAnalysisRow} onEditNote={(row, field) => { setNoteError(null); setNoteEditor({ row, field, value: field === 'internalNote' ? row._internalNote : row._externalTeamNote }); }} editableNotes={canEditNotes} />
            : <RmaCard row={item as NormalizedRma} />}
        ListHeaderComponent={(
          <View style={styles.headingCard}>
            <Text style={styles.eyebrow}>{config.eyebrow}</Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.count}>{config.count.toLocaleString()} records</Text>
            <Text style={styles.caption}>{config.caption}</Text>
          </View>
        )}
        ListEmptyComponent={status === 'loading'
          ? <View style={styles.emptyCard}><ActivityIndicator color={colors.brand.ink} /><Text style={styles.emptyText}>Loading report data…</Text></View>
          : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No matching records</Text><Text style={styles.emptyText}>Go back and adjust report filters.</Text></View>}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={() => void refresh('manual')} tintColor={colors.brand.ink} colors={[colors.brand.ink]} />}
        initialNumToRender={14}
        maxToRenderPerBatch={14}
        windowSize={8}
        removeClippedSubviews
      />

      <Modal visible={Boolean(noteEditor)} transparent animationType="fade" onRequestClose={() => setNoteEditor(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.noteModal}>
            <Text style={styles.eyebrow}>{noteEditor?.field === 'internalNote' ? 'INTERNAL NOTE' : 'EXTERNAL TEAM NOTE'}</Text>
            <Text style={styles.noteModalTitle}>Ticket {noteEditor?.row._ticketNumber || '-'}</Text>
            <TextInput
              multiline
              value={noteEditor?.value || ''}
              onChangeText={(value) => setNoteEditor((current) => current ? { ...current, value } : current)}
              placeholder="Write note..."
              placeholderTextColor={colors.text.muted}
              style={styles.noteInput}
              textAlignVertical="top"
            />
            {noteError ? <Text style={styles.noteError}>{noteError}</Text> : null}
            <View style={styles.noteModalActions}>
              <Pressable disabled={noteSaving} onPress={() => setNoteEditor(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable disabled={noteSaving} onPress={() => void saveNote()} style={styles.saveButton}><Text style={styles.saveText}>{noteSaving ? 'Saving…' : 'Save Note'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SatisfactionAiModal row={analysisRow} onClose={() => setAnalysisRow(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface.page },
  topHeader: { minHeight: 58, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border.default, backgroundColor: colors.surface.card },
  backButton: { minWidth: 82, minHeight: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  backArrow: { marginTop: -2, color: colors.brand.ink, fontSize: 28, lineHeight: 28, fontWeight: '500' },
  backText: { color: colors.brand.ink, fontSize: 12, fontWeight: '900' },
  headerLabel: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  headerSpacer: { width: 82 },
  content: { padding: spacing.md, paddingBottom: 56 },
  headingCard: { marginBottom: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderTopWidth: 3, borderColor: colors.border.default, borderTopColor: colors.brand.accent, backgroundColor: colors.surface.card, ...effects.card },
  eyebrow: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 7, color: colors.text.primary, ...typography.sectionTitle },
  count: { marginTop: 10, color: colors.brand.ink, fontSize: 12, fontWeight: '900' },
  caption: { marginTop: 5, color: colors.text.muted, fontSize: 10, lineHeight: 16, fontWeight: '600' },
  recordCard: { marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ticketPill: { maxWidth: '62%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  ticketNumber: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  recordDate: { flexShrink: 1, color: colors.text.muted, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  regionRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  regionValue: { color: colors.text.brand, fontSize: 11, fontWeight: '900' },
  subject: { marginTop: 10, color: colors.text.primary, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  detailBlock: { marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface.soft },
  detailLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  detailValue: { marginTop: 5, color: colors.text.primary, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  commentText: { marginTop: 6, color: colors.text.primary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  typeRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  typePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  typeText: { color: colors.brand.ink, fontSize: 9, fontWeight: '900' },
  ratingBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  ratingGood: { backgroundColor: '#ECFCCB' },
  ratingBad: { backgroundColor: '#FEE2E2' },
  ratingText: { color: colors.text.secondary, fontSize: 10, fontWeight: '900' },
  ratingGoodText: { color: '#3F6212' },
  ratingBadText: { color: '#B91C1C' },
  aiButton: { marginTop: 11, minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: radius.md, backgroundColor: colors.brand.ink },
  aiButtonDisabled: { opacity: 0.45 },
  aiButtonTitle: { color: colors.text.inverse, fontSize: 11, fontWeight: '900' },
  aiButtonCaption: { marginTop: 2, color: '#D5DEE3', fontSize: 9, fontWeight: '600' },
  aiButtonArrow: { color: colors.text.inverse, fontSize: 22, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  emptyCard: { marginTop: spacing.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  emptyTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { color: colors.text.muted, fontSize: 11, fontWeight: '600' },
  noteCard: { marginTop: 10, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft },
  noteText: { marginTop: 6, color: colors.text.secondary, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  noteButton: { alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.brand.ink },
  noteButtonText: { color: colors.text.inverse, fontSize: 9, fontWeight: '900' },
  modalBackdrop: { flex: 1, padding: spacing.md, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.45)' },
  noteModal: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface.card, ...effects.card },
  noteModalTitle: { marginTop: 6, color: colors.text.primary, fontSize: 18, fontWeight: '900' },
  noteInput: { minHeight: 150, marginTop: spacing.md, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.surface.soft, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  noteError: { marginTop: 8, color: '#991B1B', fontSize: 10, lineHeight: 15, fontWeight: '700' },
  noteModalActions: { marginTop: spacing.md, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  cancelText: { color: colors.text.brand, fontSize: 10, fontWeight: '900' },
  saveButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  saveText: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
});
