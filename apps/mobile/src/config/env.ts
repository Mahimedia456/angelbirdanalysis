const DEFAULT_API_BASE_URL = 'https://angelbirdanalysis-api.vercel.app';

function normalizeApiBaseUrl(value: string | undefined) {
  const trimmed = String(value || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
} as const;

export function assertApiBaseUrl() {
  if (!/^https?:\/\//i.test(env.apiBaseUrl)) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must start with http:// or https://.');
  }

  return env.apiBaseUrl;
}
