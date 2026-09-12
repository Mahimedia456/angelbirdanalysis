import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RmaSheetReportResponse, SheetReportResponse } from '@/reports/types';

const REPORT_CACHE_KEY = 'angelbird.reporting.cache.v1';
const SYNC_META_KEY = 'angelbird.reporting.sync-meta.v1';

export type CachedReports = {
  sheet: SheetReportResponse;
  rma: RmaSheetReportResponse;
  cachedAt: string;
};

export type SyncMetadata = {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastTrigger: 'foreground' | 'manual' | 'background' | 'cache' | null;
};

export const EMPTY_SYNC_METADATA: SyncMetadata = {
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastError: null,
  lastTrigger: null,
};

export async function readReportCache(): Promise<CachedReports | null> {
  try {
    const raw = await AsyncStorage.getItem(REPORT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedReports>;
    if (!parsed.sheet || !parsed.rma || !parsed.cachedAt) return null;
    return parsed as CachedReports;
  } catch {
    return null;
  }
}

export async function writeReportCache(sheet: SheetReportResponse, rma: RmaSheetReportResponse) {
  const value: CachedReports = {
    sheet,
    rma,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(value));
  return value;
}

export async function clearReportCache() {
  await AsyncStorage.multiRemove([REPORT_CACHE_KEY, SYNC_META_KEY]);
}

export async function readSyncMetadata(): Promise<SyncMetadata> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_META_KEY);
    if (!raw) return EMPTY_SYNC_METADATA;
    return { ...EMPTY_SYNC_METADATA, ...(JSON.parse(raw) as Partial<SyncMetadata>) };
  } catch {
    return EMPTY_SYNC_METADATA;
  }
}

export async function writeSyncMetadata(next: SyncMetadata) {
  await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  return next;
}
