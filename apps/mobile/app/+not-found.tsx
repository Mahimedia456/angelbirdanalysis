import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.body}>This route is not part of the AngelBird mobile reporting app.</Text>
      <Link href="/(tabs)/tickets" style={styles.link}>Return to Ticket Report</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.page,
  },
  title: {
    color: colors.text.primary,
    ...typography.sectionTitle,
  },
  body: {
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.text.secondary,
    ...typography.body,
  },
  link: {
    marginTop: spacing.lg,
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: colors.brand.accent,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
