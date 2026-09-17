import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ReportPlaceholderScreen({ eyebrow, title, description }: Props) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.accentOrb} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.status}>REPORTING READY</Text>
          </View>

          <Text style={styles.cardTitle}>Native report module reserved</Text>
          <Text style={styles.cardBody}>
            AngelBird reporting is available through the secure production reporting service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  accentOrb: {
    position: 'absolute',
    top: -65,
    right: -55,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: colors.brand.accent,
    opacity: 0.92,
  },
  eyebrow: {
    color: colors.text.secondary,
    ...typography.eyebrow,
  },
  title: {
    marginTop: spacing.sm,
    maxWidth: '78%',
    color: colors.text.primary,
    ...typography.title,
  },
  description: {
    marginTop: spacing.sm,
    maxWidth: '86%',
    color: colors.text.secondary,
    ...typography.body,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.brand.accent,
    borderWidth: 1,
    borderColor: '#B5D900',
  },
  status: {
    color: colors.text.secondary,
    ...typography.eyebrow,
    fontSize: 9,
  },
  cardTitle: {
    marginTop: spacing.md,
    color: colors.text.primary,
    ...typography.sectionTitle,
  },
  cardBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    ...typography.body,
  },
});
