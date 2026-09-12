import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BrandMark } from '@/components/BrandMark';
import { useReportData } from '@/reports/ReportDataProvider';
import { colors, effects, radius, spacing, typography } from '@/theme';

function formatLastLogin(value: string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { status, user, logout, refreshUser } = useAuth();
  const { lastSyncedAt, refresh: refreshReports } = useReportData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (status !== 'signedIn' || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    await logout();
  }

  async function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await refreshReports('manual');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Text style={styles.modalTitle}>Profile</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.accentBar} />
          <View style={styles.heroRow}>
            <BrandMark size={58} />
            <View style={styles.identity}>
              <Text numberOfLines={1} style={styles.title}>
                {user.fullName || 'AngelBird user'}
              </Text>
              <Text numberOfLines={1} style={styles.email}>{user.email}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account status</Text>
            <Text style={[styles.detailValue, user.status === 'active' && styles.active]}>
              {user.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last login</Text>
            <Text style={styles.detailValue}>{formatLastLogin(user.lastLoginAt)}</Text>
          </View>


          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>REPORTING</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reports</Text>
            <Text style={styles.detailValue}>Ticket · Satisfaction · RMA</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto sync</Text>
            <Text style={[styles.detailValue, styles.active]}>Enabled</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last updated</Text>
            <Text style={styles.detailValue}>{formatLastLogin(lastSyncedAt)}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSyncing}
            onPress={() => void handleSync()}
            style={({ pressed }) => [styles.secondaryButton, isSyncing && styles.disabled, pressed && !isSyncing && styles.pressed]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.brand.ink} />
            ) : (
              <Text style={styles.secondaryButtonText}>Sync reports now</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isRefreshing}
            onPress={() => void handleRefresh()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.brand.ink} />
            ) : (
              <Text style={styles.secondaryButtonText}>Refresh account</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isLoggingOut}
            onPress={() => void handleLogout()}
            style={({ pressed }) => [
              styles.logoutButton,
              isLoggingOut && styles.disabled,
              pressed && !isLoggingOut && styles.pressed,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.logoutText}>Logout</Text>
            )}
          </Pressable>

          <Text style={styles.securityText}>Secure account · Automatic reporting updates · Pull down any report to refresh</Text>
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
  headerRow: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  close: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface.soft,
  },
  closeText: {
    color: colors.text.brand,
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
    ...effects.card,
  },
  accentBar: { height: 4, marginHorizontal: -spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.brand.accent },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    color: colors.text.primary,
    ...typography.sectionTitle,
  },
  email: {
    marginTop: 4,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  rolePill: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
  },
  roleText: {
    color: colors.brand.ink,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
    backgroundColor: colors.border.soft,
  },
  detailRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    maxWidth: '58%',
    color: colors.text.primary,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  active: {
    color: colors.state.success,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    color: colors.text.brand,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    minHeight: 50,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.soft,
  },
  secondaryButtonText: {
    color: colors.brand.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  logoutButton: {
    minHeight: 52,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand.ink,
  },
  logoutText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  securityText: {
    marginTop: spacing.md,
    color: colors.text.muted,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
});
