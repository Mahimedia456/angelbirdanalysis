import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BrandMark } from '@/components/BrandMark';
import { colors, effects, radius, spacing } from '@/theme';

function getInitial(name: string, email: string) {
  const value = name.trim() || email.trim();
  return value ? value.slice(0, 1).toUpperCase() : 'A';
}

export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
      <View style={styles.brandRow}>
        <View style={styles.brandMarkWrap}><BrandMark size={38} /></View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.brandTitle}>ANGELBIRD</Text>
          <Text numberOfLines={1} style={styles.subtitle}>Reporting intelligence</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(user?.fullName || '', user?.email || '')}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.profileText}>{user?.fullName?.trim() || 'Profile'}</Text>
          <Text numberOfLines={1} style={styles.roleText}>{user?.role || 'viewer'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    ...effects.soft,
  },
  brandRow: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMarkWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surface.soft },
  copy: { minWidth: 0, flex: 1 },
  brandTitle: { color: colors.text.brand, fontSize: 12, fontWeight: '900', letterSpacing: 2.1 },
  subtitle: { marginTop: 2, color: colors.text.secondary, fontSize: 10, fontWeight: '700' },
  profileButton: {
    minHeight: 44, maxWidth: 152, paddingLeft: 5, paddingRight: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card,
  },
  avatar: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand.accent },
  avatarText: { color: colors.brand.ink, fontSize: 12, fontWeight: '900' },
  profileCopy: { minWidth: 0, flexShrink: 1 },
  profileText: { color: colors.text.primary, fontSize: 10, fontWeight: '900' },
  roleText: { marginTop: 1, color: colors.text.muted, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
});
