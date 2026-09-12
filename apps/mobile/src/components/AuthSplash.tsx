import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export function AuthSplash() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Image
          source={require('../../assets/brand/angelbird-mark-white.png')}
          resizeMode="contain"
          style={styles.mark}
          accessibilityLabel="AngelBird"
        />
        <Text style={styles.title}>ANGELBIRD</Text>
        <Text style={styles.subtitle}>REPORTING</Text>
        <ActivityIndicator size="small" color={colors.brand.accent} style={styles.spinner} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ink,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.brand.ink,
  },
  mark: {
    width: 112,
    height: 136,
  },
  title: {
    marginTop: spacing.lg,
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3.2,
  },
  subtitle: {
    marginTop: 5,
    color: colors.brand.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4.2,
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
