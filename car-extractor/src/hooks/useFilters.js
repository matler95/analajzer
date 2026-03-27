import { useState, useCallback } from "react";

const FILTERS_KEY = "analajzer_filters_v2";

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old v1 filters that had maxPages
    return parsed.map(f => {
      const { maxPages, ...rest } = f;
      return rest;
    });
  } catch {
    return [];
  }
}

function persistFilters(filters) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore storage errors
  }
}

export function useFilters() {
  const [filters, setFilters] = useState(loadFilters);

  const addFilter = useCallback((data) => {
    const newFilter = {
      id: `f_${Date.now()}`,
      name: data.name?.trim() || "Filtr bez nazwy",
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

  const updateFilter = useCallback((id, updates) => {
    setFilters(prev => {
      const next = prev.map(f => f.id === id ? { ...f, ...updates } : f);
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
              lastRunAt: new Date().toISOString(),
              lastRunCount: stats.processedCount ?? 0,
              lastRunNewCount: stats.newCount ?? 0,
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
