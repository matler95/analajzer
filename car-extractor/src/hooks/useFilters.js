import { useState, useCallback } from "react";

const FILTERS_KEY = "analajzer_filters_v1";

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? JSON.parse(raw) : [];
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
      searchUrl: data.searchUrl?.trim() || "",
      maxPages: Number(data.maxPages) || 2,
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      lastRunCount: null,
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

  const markFilterRun = useCallback((id, count) => {
    setFilters(prev => {
      const next = prev.map(f =>
        f.id === id
          ? { ...f, lastRunAt: new Date().toISOString(), lastRunCount: count }
          : f
      );
      persistFilters(next);
      return next;
    });
  }, []);

  return { filters, addFilter, removeFilter, updateFilter, markFilterRun };
}
