import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import type { NormalizedSatisfaction } from '@/satisfaction/satisfactionAnalytics';
import { colors, effects, radius, spacing, typography } from '@/theme';

type SatisfactionAiAnalysis = {
  team: string;
  summary: string;
  sentiment: string;
  confidence: number;
  explanation: string;
  recommendedAction: string;
  evidence?: string[];
  model?: string;
  analyzedAt?: string;
};

type Props = {
  row: NormalizedSatisfaction | null;
  onClose: () => void;
};

function percent(value: number | undefined) {
  const numeric = Number(value || 0);
  return `${Math.round(Math.max(0, Math.min(1, numeric)) * 100)}%`;
}

export function SatisfactionAiModal({ row, onClose }: Props) {
  const { request } = useAuth();
  const [analysis, setAnalysis] = useState<SatisfactionAiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!row) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await request<SatisfactionAiAnalysis>('/ai/satisfaction/analyze', {
        method: 'POST',
        timeoutMs: 60_000,
        body: {
          ticketId: row._ticketNumber,
          rating: row._rating,
          comment: row._comment,
          reason: row._reason === 'No reason given' ? '' : row._reason,
          solved: row._isSolved,
        },
      });
      setAnalysis(result);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Unable to analyze this satisfaction response.',
      );
    } finally {
      setLoading(false);
    }
  }, [request, row]);

  useEffect(() => {
    if (!row) {
      setAnalysis(null);
      setError(null);
      setLoading(false);
      return;
    }
    void runAnalysis();
  }, [row, runAnalysis]);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={Boolean(row)}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>AI SATISFACTION ANALYSIS</Text>
            <Text style={styles.title}>Ticket {row?._ticketNumber || '-'}</Text>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {row ? (
            <>
              <View style={styles.factGrid}>
                <View style={styles.factCard}>
                  <Text style={styles.factLabel}>RATING</Text>
                  <Text style={styles.factValue}>{row._rating}</Text>
                </View>
                <View style={styles.factCard}>
                  <Text style={styles.factLabel}>STATUS</Text>
                  <Text style={styles.factValue}>{row._solvedLabel}</Text>
                </View>
              </View>

              <View style={styles.inputCard}>
                <Text style={styles.factLabel}>CUSTOMER COMMENT</Text>
                <Text style={styles.bodyText}>{row._comment || 'No comment provided.'}</Text>
              </View>

              {row._reason && row._reason !== 'No reason given' ? (
                <View style={styles.inputCard}>
                  <Text style={styles.factLabel}>CUSTOMER REASON</Text>
                  <Text style={styles.bodyText}>{row._reason}</Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={colors.brand.ink} />
                  <Text style={styles.loadingTitle}>Analyzing response</Text>
                  <Text style={styles.loadingText}>Reviewing ownership, sentiment and recommended action.</Text>
                </View>
              ) : null}

              {!loading && error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>AI analysis failed</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={() => void runAnalysis()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}

              {!loading && analysis ? (
                <View style={styles.analysisCard}>
                  <View style={styles.badgeRow}>
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>{analysis.team}</Text>
                    </View>
                    <View style={styles.softBadge}>
                      <Text style={styles.softBadgeText}>{analysis.sentiment}</Text>
                    </View>
                    <View style={styles.softBadge}>
                      <Text style={styles.softBadgeText}>Confidence {percent(analysis.confidence)}</Text>
                    </View>
                  </View>

                  <View style={styles.analysisSection}>
                    <Text style={styles.sectionLabel}>AI SUMMARY</Text>
                    <Text style={styles.summaryText}>{analysis.summary}</Text>
                  </View>

                  <View style={styles.analysisSection}>
                    <Text style={styles.sectionLabel}>CLASSIFICATION EXPLANATION</Text>
                    <Text style={styles.bodyText}>{analysis.explanation}</Text>
                  </View>

                  <View style={styles.analysisSection}>
                    <Text style={styles.sectionLabel}>RECOMMENDED ACTION</Text>
                    <Text style={styles.bodyText}>{analysis.recommendedAction}</Text>
                  </View>

                  {analysis.evidence?.length ? (
                    <View style={styles.analysisSection}>
                      <Text style={styles.sectionLabel}>EVIDENCE USED</Text>
                      {analysis.evidence.map((item, index) => (
                        <View key={`${index}-${item}`} style={styles.evidenceRow}>
                          <View style={styles.evidenceDot} />
                          <Text style={styles.evidenceText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.15 },
  title: { marginTop: 4, color: colors.text.primary, ...typography.sectionTitle },
  closeButton: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  closeText: { color: colors.text.brand, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  factGrid: { flexDirection: 'row', gap: spacing.sm },
  factCard: { flex: 1, minHeight: 76, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  factLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.85 },
  factValue: { marginTop: 9, color: colors.text.primary, fontSize: 15, fontWeight: '900' },
  inputCard: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.soft },
  bodyText: { marginTop: 8, color: colors.text.secondary, fontSize: 12, lineHeight: 19, fontWeight: '600' },
  loadingCard: { minHeight: 170, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xl, backgroundColor: colors.surface.soft },
  loadingTitle: { marginTop: spacing.md, color: colors.text.primary, fontSize: 14, fontWeight: '900' },
  loadingText: { marginTop: 6, color: colors.text.secondary, textAlign: 'center', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  errorCard: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF7F7' },
  errorTitle: { color: '#991B1B', fontSize: 13, fontWeight: '900' },
  errorText: { marginTop: 7, color: '#7F1D1D', fontSize: 11, lineHeight: 18, fontWeight: '600' },
  retryButton: { alignSelf: 'flex-start', marginTop: spacing.md, paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: '#991B1B' },
  retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  analysisCard: { padding: spacing.md, gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.card },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  primaryBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  primaryBadgeText: { color: colors.brand.ink, fontSize: 10, fontWeight: '900' },
  softBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  softBadgeText: { color: colors.text.secondary, fontSize: 10, fontWeight: '900' },
  analysisSection: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface.soft },
  sectionLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.85 },
  summaryText: { marginTop: 8, color: colors.text.primary, fontSize: 14, lineHeight: 21, fontWeight: '800' },
  evidenceRow: { marginTop: 9, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  evidenceDot: { width: 7, height: 7, marginTop: 6, borderRadius: 99, backgroundColor: colors.brand.accent },
  evidenceText: { flex: 1, color: colors.text.secondary, fontSize: 11, lineHeight: 18, fontWeight: '600' },
});
