import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import type { AuthPayload, AuthSession } from '@/auth/types';
import { apiRequest } from '@/services/apiClient';
import { readStoredSession, writeStoredSession } from '@/services/authStorage';
import type { RmaSheetReportResponse, SheetReportResponse } from '@/reports/types';
import {
  EMPTY_SYNC_METADATA,
  readSyncMetadata,
  writeReportCache,
  writeSyncMetadata,
} from '@/reports/reportCache';

export const REPORT_BACKGROUND_TASK = 'angelbird-reporting-background-sync-v1';
export const BACKGROUND_SYNC_MINIMUM_MINUTES = 15;

function expiresSoon(session: AuthSession) {
  return Boolean(session.expiresAt && session.expiresAt * 1000 <= Date.now() + 60_000);
}

async function refreshStoredSession(session: AuthSession) {
  const payload = await apiRequest<AuthPayload>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: session.refreshToken },
    timeoutMs: 20_000,
  });
  await writeStoredSession(payload.session);
  return payload.session;
}

async function getUsableSession() {
  const stored = await readStoredSession();
  if (!stored) return null;
  return expiresSoon(stored) ? refreshStoredSession(stored) : stored;
}

export async function runBackgroundReportSync() {
  const now = new Date().toISOString();
  const currentMeta = await readSyncMetadata();
  await writeSyncMetadata({
    ...currentMeta,
    lastAttemptAt: now,
    lastTrigger: 'background',
  });

  try {
    let session = await getUsableSession();
    if (!session) return BackgroundTask.BackgroundTaskResult.Success;

    let sheet: SheetReportResponse;
    let rma: RmaSheetReportResponse;

    try {
      [sheet, rma] = await Promise.all([
        apiRequest<SheetReportResponse>('/sheets/reports', { method: 'GET', timeoutMs: 25_000 }, session.accessToken),
        apiRequest<RmaSheetReportResponse>('/rma/sheet/reports', { method: 'GET', timeoutMs: 25_000 }, session.accessToken),
      ]);
    } catch (error) {
      const maybeUnauthorized = error instanceof Error && 'status' in error && (error as { status?: number }).status === 401;
      if (!maybeUnauthorized) throw error;
      session = await refreshStoredSession(session);
      [sheet, rma] = await Promise.all([
        apiRequest<SheetReportResponse>('/sheets/reports', { method: 'GET', timeoutMs: 25_000 }, session.accessToken),
        apiRequest<RmaSheetReportResponse>('/rma/sheet/reports', { method: 'GET', timeoutMs: 25_000 }, session.accessToken),
      ]);
    }

    await writeReportCache(sheet, rma);
    await writeSyncMetadata({
      ...EMPTY_SYNC_METADATA,
      lastAttemptAt: now,
      lastSuccessAt: new Date().toISOString(),
      lastTrigger: 'background',
    });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    await writeSyncMetadata({
      ...currentMeta,
      lastAttemptAt: now,
      lastFailureAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : 'Background sync failed.',
      lastTrigger: 'background',
    });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}

TaskManager.defineTask(REPORT_BACKGROUND_TASK, runBackgroundReportSync);

export async function ensureBackgroundReportSyncRegistered() {
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    return { available: false, registered: false };
  }

  const registered = await TaskManager.isTaskRegisteredAsync(REPORT_BACKGROUND_TASK);
  if (!registered) {
    await BackgroundTask.registerTaskAsync(REPORT_BACKGROUND_TASK, {
      minimumInterval: BACKGROUND_SYNC_MINIMUM_MINUTES,
    });
  }

  return { available: true, registered: true };
}

export async function unregisterBackgroundReportSync() {
  const registered = await TaskManager.isTaskRegisteredAsync(REPORT_BACKGROUND_TASK);
  if (registered) await BackgroundTask.unregisterTaskAsync(REPORT_BACKGROUND_TASK);
}
