import { useState, useCallback } from "react";

const HISTORY_KEY  = "analajzer_scan_history_v1";
const MAX_ENTRIES  = 50;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveHistory(entries) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); }
  catch { /* ignore */ }
}

/**
 * useScanHistory — persists a log of completed background scan runs.
 *
 * Each entry stored:
 *   { id, filterId, filterName, completedAt, processedCount, newCount,
 *     archivedCount, priceChanges }
 */
export function useScanHistory() {
  const [scanHistory, setScanHistory] = useState(loadHistory);

  const addScanRun = useCallback((run) => {
    setScanHistory(prev => {
      const entry = {
        id:             `run_${Date.now()}`,
        filterId:       run.filterId       ?? null,
        filterName:     run.filterName     ?? "Nieznany filtr",
        completedAt:    new Date().toISOString(),
        processedCount: run.processedCount ?? 0,
        newCount:       run.newCount       ?? 0,
        archivedCount:  run.archivedCount  ?? 0,
        priceChanges:   run.priceChanges   ?? 0,
      };
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
    saveHistory([]);
  }, []);

  return { scanHistory, addScanRun, clearScanHistory };
}
