import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BrandMark } from '@/components/BrandMark';
import { canViewReports, roleLabel } from '@/security/permissions';
import { colors, effects, radius, spacing, typography } from '@/theme';

export default function RestrictedScreen() {
  const { status, user, logout } = useAuth();

  if (status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.brand.ink} /></View>;
  }
  if (status !== 'signedIn' || !user) return <Redirect href="/(auth)/login" />;
  if (canViewReports(user)) return <Redirect href="/(tabs)/tickets" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <BrandMark size={72} />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACCESS RESTRICTED</Text>
          <Text style={styles.title}>Reporting access is not enabled</Text>
          <Text style={styles.body}>
            This account is signed in, but its role is not allowed to open AngelBird mobile reporting.
          </Text>
          <View style={styles.rolePill}><Text style={styles.roleText}>{roleLabel(user.role)}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.button}>
            <Text style={styles.buttonText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.page },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  card: { width: '100%', maxWidth: 520, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, ...effects.card },
  eyebrow: { color: colors.text.brand, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { marginTop: spacing.sm, color: colors.text.primary, ...typography.sectionTitle },
  body: { marginTop: spacing.sm, color: colors.text.secondary, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  rolePill: { alignSelf: 'flex-start', marginTop: spacing.md, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  roleText: { color: colors.text.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  button: { marginTop: spacing.lg, minHeight: 50, borderRadius: radius.md, backgroundColor: colors.brand.ink, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.text.inverse, fontSize: 13, fontWeight: '900' },
});
