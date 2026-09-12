import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BrandMark } from '@/components/BrandMark';
import { ApiError } from '@/services/apiClient';
import { colors, effects, radius, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(
          error.status === 0
            ? 'Cannot reach AngelBird server. Check API URL and internet connection.'
            : error.message,
        );
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.brandBlock}>
            <BrandMark size={82} />
            <Text style={styles.eyebrow}>ANGELBIRD</Text>
            <Text style={styles.title}>Reporting</Text>
            <Text style={styles.subtitle}>Secure access to Ticket, Satisfaction and RMA reporting.</Text>
            <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>LIVE REPORTING</Text></View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="name@company.com"
                placeholderTextColor={colors.text.muted}
                returnKeyType="next"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldGap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect={false}
                  onSubmitEditing={() => void handleSubmit()}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text.muted}
                  returnKeyType="done"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((value) => !value)}
                  style={({ pressed }) => [styles.showButton, pressed && styles.pressed]}
                >
                  <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.loginButton,
                !canSubmit && styles.loginButtonDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.loginButtonText}>Sign in</Text>
              )}
            </Pressable>

            <Text style={styles.helpText}>
              Access follows your existing owner, admin, analyst or viewer profile status.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    marginTop: spacing.md,
    color: colors.text.brand,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3.1,
  },
  title: {
    marginTop: 2,
    color: colors.text.primary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    maxWidth: 320,
    marginTop: spacing.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    ...typography.body,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    ...effects.card,
  },
  liveBadge: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.default },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.state.success },
  liveBadgeText: { color: colors.text.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  label: {
    marginBottom: 7,
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.surface.soft,
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  fieldGap: {
    marginTop: spacing.md,
  },
  passwordRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.surface.soft,
    overflow: 'hidden',
  },
  passwordInput: {
    minWidth: 0,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 15,
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  showButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showText: {
    color: colors.text.brand,
    fontSize: 12,
    fontWeight: '900',
  },
  errorBox: {
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: colors.state.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  loginButton: {
    minHeight: 54,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand.ink,
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '900',
  },
  helpText: {
    marginTop: spacing.md,
    color: colors.text.muted,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
