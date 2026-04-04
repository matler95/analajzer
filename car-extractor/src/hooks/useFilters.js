import { useState, useCallback } from "react";
import { buildOtomotoUrlFull, buildOlxUrl } from "../utils/otomotoData.js";

const FILTERS_KEY = "analajzer_filters_v2";

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map(f => {
      const { maxPages, ...rest } = f;
      if (!rest.portal) rest.portal = "otomoto";
      return rest;
    });
  } catch { return []; }
}

function persistFilters(filters) {
  try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); }
  catch { /* ignore */ }
}

/**
 * Rebuild searchUrls from vehicles + params + portal.
 * Called when a filter is edited so the stored URLs stay in sync
 * with the new configuration.
 */
function buildSearchUrls(vehicles, params, portal) {
  const entries = [];
  for (const v of vehicles.filter(vv => vv.brand)) {
    const commonParams = { ...params, brand: v.brand, model: v.model };
    if (portal === "otomoto" || portal === "both") entries.push(buildOtomotoUrlFull(commonParams));
    if (portal === "olx"     || portal === "both") entries.push(buildOlxUrl(commonParams));
  }
  return entries;
}

export function useFilters() {
  const [filters, setFilters] = useState(loadFilters);

  const addFilter = useCallback((data) => {
    const newFilter = {
      id: `f_${Date.now()}`,
      name: data.name?.trim() || "Filtr bez nazwy",
      portal: data.portal || "otomoto",
      vehicles: data.vehicles || [],
      params: data.params || {},
      searchUrls: data.searchUrls || (data.searchUrl ? [data.searchUrl] : []),
      searchUrl: data.searchUrl || data.searchUrls?.[0] || "",
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      lastRunCount: null,
      lastRunNewCount: null,
      lastRunArchivedCount: null,
    };
    setFilters(prev => {
      const next = [...prev, newFilter];
      persistFilters(next);
      return next;
    });
    return newFilter;
  }, []);

  const removeFilter = useCallback((id) => {
    setFilters(prev => {
      const next = prev.filter(f => f.id !== id);
      persistFilters(next);
      return next;
    });
  }, []);

  /**
   * updateFilter — used for both programmatic updates (markFilterRun)
   * and user-facing edits from FiltersTab.
   * When the update includes vehicles/params/portal, regenerates searchUrls
   * so the stored URLs stay in sync with the current configuration.
   */
  const updateFilter = useCallback((id, updates) => {
    setFilters(prev => {
      const next = prev.map(f => {
        if (f.id !== id) return f;
        const merged = { ...f, ...updates };

        // If any of the URL-determining fields changed, regenerate searchUrls
        const urlDeterminingFields = ["vehicles", "params", "portal"];
        const anyUrlFieldChanged = urlDeterminingFields.some(k => k in updates);
        if (anyUrlFieldChanged) {
          const newUrls = buildSearchUrls(
            merged.vehicles ?? [],
            merged.params   ?? {},
            merged.portal   ?? "otomoto",
          );
          merged.searchUrls = newUrls;
          merged.searchUrl  = newUrls[0] ?? "";
        }

        return merged;
      });
      persistFilters(next);
      return next;
    });
  }, []);

  const markFilterRun = useCallback((id, stats) => {
    setFilters(prev => {
      const next = prev.map(f =>
        f.id === id
          ? {
              ...f,
              lastRunAt:           new Date().toISOString(),
              lastRunCount:        stats.processedCount ?? 0,
              lastRunNewCount:     stats.newCount       ?? 0,
              lastRunArchivedCount: stats.archivedCount ?? 0,
            }
          : f
      );
      persistFilters(next);
      return next;
    });
  }, []);

  return { filters, addFilter, removeFilter, updateFilter, markFilterRun };
}
