import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/auth/types';

const SESSION_KEY = 'angelbird.reporting.auth.session.v1';
let webFallback: string | null = null;

export async function readStoredSession(): Promise<AuthSession | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? webFallback
        : await SecureStore.getItemAsync(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (!parsed.accessToken || !parsed.refreshToken) {
      await clearStoredSession();
      return null;
    }

    return {
      accessToken: String(parsed.accessToken),
      refreshToken: String(parsed.refreshToken),
      expiresAt: Number.isFinite(Number(parsed.expiresAt)) ? Number(parsed.expiresAt) : null,
      expiresIn: Number.isFinite(Number(parsed.expiresIn)) ? Number(parsed.expiresIn) : null,
      tokenType: String(parsed.tokenType || 'bearer'),
    };
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function writeStoredSession(session: AuthSession) {
  const serialized = JSON.stringify(session);

  if (Platform.OS === 'web') {
    webFallback = serialized;
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, serialized, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function clearStoredSession() {
  if (Platform.OS === 'web') {
    webFallback = null;
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
