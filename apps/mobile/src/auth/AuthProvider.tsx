import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError, apiRequest, type ApiRequestInit } from '@/services/apiClient';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/services/authStorage';

import type { AuthPayload, AuthSession, AuthStatus, AuthUser } from './types';

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  request: <T>(path: string, init?: ApiRequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function expiresSoon(session: AuthSession) {
  if (!session.expiresAt) {
    return false;
  }

  return session.expiresAt * 1000 <= Date.now() + 45_000;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthPayload> | null>(null);

  const commitSession = useCallback(async (payload: AuthPayload) => {
    // Persist first so the UI never claims a durable login if secure storage fails.
    await writeStoredSession(payload.session);
    sessionRef.current = payload.session;
    setSession(payload.session);
    setUser(payload.user);
    setStatus('signedIn');
  }, []);

  const clearSession = useCallback(async () => {
    sessionRef.current = null;
    refreshPromiseRef.current = null;
    setSession(null);
    setUser(null);
    setStatus('signedOut');
    await clearStoredSession();
  }, []);

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const active = sessionRef.current;

    if (!active?.refreshToken) {
      throw new ApiError('No refresh token is available.', 401, 'SESSION_MISSING');
    }

    const operation = apiRequest<AuthPayload>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: active.refreshToken },
    })
      .then(async (payload) => {
        await commitSession(payload);
        return payload;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    refreshPromiseRef.current = operation;
    return operation;
  }, [commitSession]);

  const request = useCallback(
    async <T,>(path: string, init: ApiRequestInit = {}) => {
      let active = sessionRef.current;

      if (!active) {
        throw new ApiError('Authentication is required.', 401, 'SESSION_MISSING');
      }

      if (expiresSoon(active)) {
        try {
          active = (await refresh()).session;
        } catch (error) {
          await clearSession();
          throw error;
        }
      }

      try {
        return await apiRequest<T>(path, init, active.accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        try {
          active = (await refresh()).session;
          return await apiRequest<T>(path, init, active.accessToken);
        } catch (refreshError) {
          await clearSession();
          throw refreshError;
        }
      }
    },
    [clearSession, refresh],
  );

  const restore = useCallback(async () => {
    setStatus('loading');

    const stored = await readStoredSession();

    if (!stored) {
      setStatus('signedOut');
      return;
    }

    sessionRef.current = stored;
    setSession(stored);

    try {
      if (expiresSoon(stored)) {
        await refresh();
        return;
      }

      const current = await apiRequest<{ user: AuthUser }>('/auth/me', {
        method: 'GET',
      }, stored.accessToken);

      setUser(current.user);
      setStatus('signedIn');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          await refresh();
          return;
        } catch {
          await clearSession();
          return;
        }
      }

      await clearSession();
    }
  }, [clearSession, refresh]);

  useEffect(() => {
    void restore();
  }, [restore]);

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      const payload = await apiRequest<AuthPayload>('/auth/login', {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
          password,
        },
      });

      await commitSession(payload);
    },
    [commitSession],
  );

  const logout = useCallback(async () => {
    const active = sessionRef.current;

    try {
      if (active?.accessToken) {
        await apiRequest('/auth/logout', { method: 'POST' }, active.accessToken);
      }
    } catch {
      // Local logout must always succeed, even if the network/backend is unavailable.
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const current = await request<{ user: AuthUser }>('/auth/me', { method: 'GET' });
    setUser(current.user);
  }, [request]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, session, login, logout, refreshUser, request }),
    [status, user, session, login, logout, refreshUser, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
