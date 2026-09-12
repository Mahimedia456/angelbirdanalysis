import { assertApiBaseUrl } from '@/config/env';

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
};

export type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
};

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}, accessToken?: string) {
  const apiBaseUrl = assertApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers = new Headers(init.headers || {});
  const timeoutMs = Math.max(1_000, init.timeoutMs ?? 30_000);
  const timeoutController = new AbortController();
  const timeoutHandle = setTimeout(() => timeoutController.abort(), timeoutMs);
  const externalSignal = init.signal;
  const abortFromExternal = () => timeoutController.abort();

  externalSignal?.addEventListener('abort', abortFromExternal, { once: true });
  headers.set('Accept', 'application/json');

  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const { timeoutMs: _timeoutMs, ...fetchInit } = init;

  try {
    const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
      ...fetchInit,
      headers,
      signal: timeoutController.signal,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    const payload = (await parseResponse(response)) as ApiEnvelope<T> | null;

    if (!response.ok) {
      throw new ApiError(
        payload?.message || `Request failed with status ${response.status}.`,
        response.status,
        payload?.code,
        payload,
      );
    }

    if (payload && 'data' in payload) return payload.data as T;
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const timedOut = timeoutController.signal.aborted && !externalSignal?.aborted;
    throw new ApiError(
      timedOut
        ? 'The AngelBird API request timed out.'
        : error instanceof Error
          ? error.message
          : 'Could not reach the AngelBird API.',
      0,
      timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeoutHandle);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
