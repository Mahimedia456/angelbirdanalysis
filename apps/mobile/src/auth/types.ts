export type AngelBirdRole = 'owner' | 'admin' | 'analyst' | 'viewer' | string;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: AngelBirdRole;
  status: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  expiresIn: number | null;
  tokenType: string;
};

export type AuthPayload = {
  user: AuthUser;
  session: AuthSession;
};

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
