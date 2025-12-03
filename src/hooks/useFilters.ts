'use client';

import { useState, useCallback } from 'react';
import type { DashboardFilters } from '@/types';

const defaultFilters: DashboardFilters = {
  channels: [],
  sentiments: [],
  contentTypes: [],
  categories: [],
  month: null,
  year: null,
};

export function useFilters() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  // Auto-apply when filters change (for smoother UX)
  const updateAndApply = useCallback((newFilters: Partial<DashboardFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setAppliedFilters(updated);
  }, [filters]);

  return {
    filters,
    appliedFilters,
    updateFilters,
    applyFilters,
    resetFilters,
    updateAndApply,
  };
}
