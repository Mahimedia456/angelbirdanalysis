import { AppState, type AppStateStatus } from 'react-native';
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

import { useAuth } from '@/auth/AuthProvider';
import {
  clearReportCache,
  EMPTY_SYNC_METADATA,
  readReportCache,
  readSyncMetadata,
  writeReportCache,
  writeSyncMetadata,
  type SyncMetadata,
} from '@/reports/reportCache';
import { fetchLiveRmaReport, fetchLiveSheetReports } from '@/reports/reportApi';
import type { ReportDataStatus, RmaSheetReportResponse, SheetReportResponse } from '@/reports/types';
import { ApiError } from '@/services/apiClient';
import {
  ensureBackgroundReportSyncRegistered,
  unregisterBackgroundReportSync,
} from '@/sync/backgroundSync';

const AUTO_REFRESH_AFTER_MS = 2 * 60 * 1000;
const CACHE_STALE_AFTER_MS = 15 * 60 * 1000;

type SyncTrigger = 'foreground' | 'manual';
type DataSource = 'none' | 'cache' | 'live';

type BackgroundSyncState = {
  available: boolean;
  registered: boolean;
};

type ReportDataContextValue = {
  status: ReportDataStatus;
  sheet: SheetReportResponse | null;
  rma: RmaSheetReportResponse | null;
  error: string | null;
  lastSyncedAt: string | null;
  cacheUpdatedAt: string | null;
  dataSource: DataSource;
  isStale: boolean;
  syncMeta: SyncMetadata;
  backgroundSync: BackgroundSyncState;
  refresh: (trigger?: SyncTrigger) => Promise<void>;
};

const ReportDataContext = createContext<ReportDataContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return 'Live sync is unavailable. Showing the most recent cached report data when available.';
    }
    if (error.code === 'REQUEST_TIMEOUT') {
      return 'The live reporting request timed out. Cached data remains available; tap Sync now to retry.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Could not load reporting data.';
}

function parseTime(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function ReportDataProvider({ children }: PropsWithChildren) {
  const { status: authStatus, request } = useAuth();
  const [status, setStatus] = useState<ReportDataStatus>('idle');
  const [sheet, setSheet] = useState<SheetReportResponse | null>(null);
  const [rma, setRma] = useState<RmaSheetReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('none');
  const [syncMeta, setSyncMeta] = useState<SyncMetadata>(EMPTY_SYNC_METADATA);
  const [backgroundSync, setBackgroundSync] = useState<BackgroundSyncState>({
    available: false,
    registered: false,
  });
  const lastSuccessfulRefreshRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const hasDataRef = useRef(false);

  const hydrateCache = useCallback(async () => {
    const [cached, meta] = await Promise.all([readReportCache(), readSyncMetadata()]);
    setSyncMeta(meta);

    if (!cached) return false;
    setSheet(cached.sheet);
    setRma(cached.rma);
    setCacheUpdatedAt(cached.cachedAt);
    setLastSyncedAt(meta.lastSuccessAt || cached.cachedAt);
    setDataSource('cache');
    setStatus('ready');
    hasDataRef.current = true;
    lastSuccessfulRefreshRef.current = parseTime(meta.lastSuccessAt || cached.cachedAt);
    return true;
  }, []);

  const load = useCallback(async (trigger: SyncTrigger = 'manual') => {
    if (authStatus !== 'signedIn') return;
    if (inFlightRef.current) return inFlightRef.current;

    const operation = (async () => {
      const attemptAt = new Date().toISOString();
      const before = await readSyncMetadata();
      const attemptMeta: SyncMetadata = {
        ...before,
        lastAttemptAt: attemptAt,
        lastTrigger: trigger,
      };
      setSyncMeta(attemptMeta);
      await writeSyncMetadata(attemptMeta);

      setStatus((current) => (current === 'ready' || hasDataRef.current ? 'refreshing' : 'loading'));
      setError(null);

      try {
        const [sheetResult, rmaResult] = await Promise.all([
          fetchLiveSheetReports(request),
          fetchLiveRmaReport(request),
        ]);

        setSheet(sheetResult);
        setRma(rmaResult);
        hasDataRef.current = true;
        setDataSource('live');

        const serverSyncedAt =
          sheetResult.summary?.updatedAt ||
          rmaResult.summary?.generatedAt ||
          new Date().toISOString();
        const cache = await writeReportCache(sheetResult, rmaResult);
        const nextMeta: SyncMetadata = {
          ...EMPTY_SYNC_METADATA,
          lastAttemptAt: attemptAt,
          lastSuccessAt: new Date().toISOString(),
          lastTrigger: trigger,
        };

        await writeSyncMetadata(nextMeta);
        setSyncMeta(nextMeta);
        setCacheUpdatedAt(cache.cachedAt);
        setLastSyncedAt(serverSyncedAt);
        lastSuccessfulRefreshRef.current = Date.now();
        setStatus('ready');
      } catch (loadError) {
        const message = getErrorMessage(loadError);
        const failureMeta: SyncMetadata = {
          ...before,
          lastAttemptAt: attemptAt,
          lastFailureAt: new Date().toISOString(),
          lastError: message,
          lastTrigger: trigger,
        };
        await writeSyncMetadata(failureMeta);
        setSyncMeta(failureMeta);
        setError(message);
        setStatus(hasDataRef.current ? 'ready' : 'error');
      }
    })().finally(() => {
      inFlightRef.current = null;
    });

    inFlightRef.current = operation;
    return operation;
  }, [authStatus, request]);

  useEffect(() => {
    if (authStatus !== 'signedIn') return undefined;

    let active = true;
    void (async () => {
      await hydrateCache();
      if (!active) return;
      try {
        const registration = await ensureBackgroundReportSyncRegistered();
        if (active) setBackgroundSync(registration);
      } catch {
        if (active) setBackgroundSync({ available: false, registered: false });
      }
      if (active) void load('foreground');
    })();

    return () => {
      active = false;
    };
  }, [authStatus, hydrateCache, load]);

  useEffect(() => {
    if (authStatus !== 'signedOut') return;

    setStatus('idle');
    setSheet(null);
    setRma(null);
    setError(null);
    setLastSyncedAt(null);
    setCacheUpdatedAt(null);
    setDataSource('none');
    setSyncMeta(EMPTY_SYNC_METADATA);
    setBackgroundSync({ available: false, registered: false });
    lastSuccessfulRefreshRef.current = 0;
    hasDataRef.current = false;
    void clearReportCache();
    void unregisterBackgroundReportSync();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== 'signedIn') return undefined;

    function onAppStateChange(nextState: AppStateStatus) {
      if (nextState !== 'active') return;
      const age = Date.now() - lastSuccessfulRefreshRef.current;
      if (lastSuccessfulRefreshRef.current === 0 || age >= AUTO_REFRESH_AFTER_MS) {
        void readSyncMetadata().then((meta) => {
          setSyncMeta(meta);
          if (meta.lastSuccessAt && parseTime(meta.lastSuccessAt) > lastSuccessfulRefreshRef.current) {
            void hydrateCache();
          }
          void load('foreground');
        });
      }
    }

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [authStatus, hydrateCache, load]);

  const isStale = useMemo(() => {
    const reference = parseTime(syncMeta.lastSuccessAt || cacheUpdatedAt || lastSyncedAt);
    return reference === 0 || Date.now() - reference > CACHE_STALE_AFTER_MS;
  }, [cacheUpdatedAt, lastSyncedAt, syncMeta.lastSuccessAt]);

  const value = useMemo<ReportDataContextValue>(
    () => ({
      status,
      sheet,
      rma,
      error,
      lastSyncedAt,
      cacheUpdatedAt,
      dataSource,
      isStale,
      syncMeta,
      backgroundSync,
      refresh: load,
    }),
    [status, sheet, rma, error, lastSyncedAt, cacheUpdatedAt, dataSource, isStale, syncMeta, backgroundSync, load],
  );

  return <ReportDataContext.Provider value={value}>{children}</ReportDataContext.Provider>;
}

export function useReportData() {
  const context = useContext(ReportDataContext);
  if (!context) throw new Error('useReportData must be used inside ReportDataProvider.');
  return context;
}
