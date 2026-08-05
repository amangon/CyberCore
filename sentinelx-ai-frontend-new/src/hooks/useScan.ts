"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeIOC,
  getPagedScanHistory,
  getScanErrorMessage,
  getScanHistory,
  scanFile,
  scanHash,
  scanIP,
  scanURL,
} from "@/services/scan.service";
import type { IOCAnalysis, ScanRecord, ScanResult, ScanType } from "@/types/security";

/**
 * useScan - React hooks for the security scanner.
 *
 * Wraps the scan service with state management for loading, error and
 * result tracking. All mock data is replaced with real backend calls.
 */

export interface ScanHistoryState {
  readonly records: readonly ScanRecord[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly total: number;
}

/**
 * Scan a target (file / URL / IP / hash) against the backend.
 */
export function useScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);

  const runScan = useCallback(
    async (type: ScanType, target: string, file?: File) => {
      setLoading(true);
      setError(null);
      setProgress(0);
      setResult(null);

      try {
        let res: ScanResult;

        switch (type) {
          case "file": {
            if (!file) throw new Error("A file is required for a file scan.");
            res = await scanFile(file, {
              onProgress: (percent) => {
                setProgress(Math.min(100, percent));
              },
            });
            break;
          }
          case "url":
            res = await scanURL(target);
            break;
          case "ip":
            res = await scanIP(target);
            break;
          case "hash":
            res = await scanHash(target);
            break;
          default:
            throw new Error(`Unsupported scan type: ${type}`);
        }

        setResult(res);
        setProgress(100);
        return res;
      } catch (err) {
        const message = getScanErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setProgress(0);
  }, []);

  return {
    loading,
    error,
    result,
    progress,
    runScan,
    reset,
  };
}

/**
 * Load scan history from the backend with pagination + refresh.
 */
export function useScanHistory(params?: { page?: number; pageSize?: number }) {
  const pageSize = params?.pageSize ?? 10;
  const [records, setRecords] = useState<readonly ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(params?.page ?? 1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const mountedRef = useRef(true);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getScanHistory({ page: nextPage, limit: pageSize });

        if (!mountedRef.current) return;

        const sorted = data
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRecords(sorted);
        setPage(nextPage);
        setHasMore(sorted.length >= pageSize);
        setTotal(sorted.length);
      } catch (err) {
        if (mountedRef.current) setError(getScanErrorMessage(err));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [pageSize],
  );

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchPage(page);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    records,
    loading,
    error,
    page,
    pageSize,
    hasMore,
    total,
    setPage: (next: number) => void fetchPage(next),
    refresh,
  } satisfies ScanHistoryState & {
    setPage: (next: number) => void;
    refresh: () => void;
  };
}

/**
 * Load a single page of scan history via the paginated endpoint.
 */
export function usePagedScanHistory(params?: { page?: number; pageSize?: number }) {
  const pageSize = params?.pageSize ?? 20;
  const [items, setItems] = useState<readonly ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(params?.page ?? 1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
const data = await getPagedScanHistory({ page: nextPage, limit: pageSize });
        setItems(data.items);
        setPage(nextPage);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(getScanErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    void fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items,
    loading,
    error,
    page,
    pageSize,
    hasMore,
    total,
    setPage: (next: number) => void fetchPage(next),
    refresh: () => void fetchPage(page),
  };
}

/**
 * IOC investigation hook - analyze a single indicator.
 */
export function useIOCAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IOCAnalysis | null>(null);

  const analyze = useCallback(async (indicator: string, type: ScanType | "email" = "ip") => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeIOC(indicator, type);
      setResult(res);
      return res;
    } catch (err) {
      const message = getScanErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { loading, error, result, analyze, reset };
}

const useScan = {
  useScanner,
  useScanHistory,
  usePagedScanHistory,
  useIOCAnalysis,
};

export default useScan;

