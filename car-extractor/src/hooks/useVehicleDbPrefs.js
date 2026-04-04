import { useState, useCallback } from "react";

/* ─── Storage keys ─────────────────────────────────────── */
const VIEW_KEY    = "analajzer_vdb_view_v1";      // "list" | "compact" | "grid"
const SORT_KEY    = "analajzer_vdb_sort_v1";      // { [groupKey]: sortKey }
const NOTES_KEY   = "analajzer_notes_v1";         // { [id]: string }
const VIEWED_KEY  = "analajzer_viewed_v1";        // number[]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

/* ─── Sort options ─────────────────────────────────────── */
export const SORT_OPTIONS = [
  { key: "newest",       label: "Najnowsze"       },
  { key: "price_asc",    label: "Cena ↑"          },
  { key: "price_desc",   label: "Cena ↓"          },
  { key: "mileage_asc",  label: "Przebieg ↑"      },
  { key: "mileage_desc", label: "Przebieg ↓"      },
  { key: "year_desc",    label: "Rok (nowe)"      },
  { key: "year_asc",     label: "Rok (stare)"     },
  { key: "deal",         label: "🔥 Okazje"        },
];

export function sortRows(rows, sortKey) {
  if (!sortKey || sortKey === "newest") {
    return [...rows].sort((a, b) => {
      const ta = new Date(a.snapshot_json?.__firstSeenAt ?? a.created_at ?? 0).getTime();
      const tb = new Date(b.snapshot_json?.__firstSeenAt ?? b.created_at ?? 0).getTime();
      return tb - ta;
    });
  }
  const get = (r) => {
    const s = r.snapshot_json ?? {};
    switch (sortKey) {
      case "price_asc":    return s.price    ?? Infinity;
      case "price_desc":   return -(s.price    ?? 0);
      case "mileage_asc":  return s.mileage  ?? Infinity;
      case "mileage_desc": return -(s.mileage  ?? 0);
      case "year_desc":    return -(s.year     ?? 0);
      case "year_asc":     return s.year     ?? Infinity;
      case "deal": {
        // Higher score = better deal (lower price relative to group median, lower mileage)
        const price   = s.price   ?? 0;
        const mileage = s.mileage ?? 0;
        // Negative so best deals sort first
        return -(price > 0 ? -price / 1000 : 0) + (mileage > 0 ? mileage / 100000 : 0);
      }
      default: return 0;
    }
  };
  return [...rows].sort((a, b) => get(a) - get(b));
}

/* ─── Hook ─────────────────────────────────────────────── */
export function useVehicleDbPrefs() {
  const [viewMode, setViewModeState]   = useState(() => load(VIEW_KEY, "list"));
  const [sortByGroup, setSortByGroup]  = useState(() => load(SORT_KEY, {}));
  const [notes, setNotes]              = useState(() => load(NOTES_KEY, {}));
  const [viewedIds, setViewedIds]      = useState(() => new Set(load(VIEWED_KEY, [])));

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    save(VIEW_KEY, mode);
  }, []);

  const setSortForGroup = useCallback((groupKey, sortKey) => {
    setSortByGroup(prev => {
      const next = { ...prev, [groupKey]: sortKey };
      save(SORT_KEY, next);
      return next;
    });
  }, []);

  const setNote = useCallback((id, text) => {
    setNotes(prev => {
      const next = { ...prev };
      if (text?.trim()) next[id] = text.trim();
      else delete next[id];
      save(NOTES_KEY, next);
      return next;
    });
  }, []);

  const markViewed = useCallback((id) => {
    setViewedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      save(VIEWED_KEY, [...next]);
      return next;
    });
  }, []);

  const clearViewed = useCallback(() => {
    setViewedIds(new Set());
    save(VIEWED_KEY, []);
  }, []);

  return {
    viewMode,  setViewMode,
    sortByGroup, setSortForGroup,
    notes,     setNote,
    viewedIds, markViewed, clearViewed,
  };
}
