'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MonthlyReport } from '@/types';

interface UseMonthlyReportsOptions {
  month?: number | null;
  year?: number | null;
  enabled?: boolean;
}

interface UseMonthlyReportsReturn {
  report: MonthlyReport | null;
  reports: MonthlyReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createReport: (data: CreateReportData) => Promise<MonthlyReport>;
  updateReport: (id: string, data: CreateReportData) => Promise<MonthlyReport>;
  deleteReport: (id: string) => Promise<void>;
}

interface CreateReportData {
  month: number;
  year: number;
  title: string;
  content: string;
}

export function useMonthlyReports(options: UseMonthlyReportsOptions = {}): UseMonthlyReportsReturn {
  const { month, year, enabled = true } = options;
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (month !== null && month !== undefined) params.set('month', month.toString());
      if (year !== null && year !== undefined) params.set('year', year.toString());

      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [month, year, enabled]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(async (data: CreateReportData): Promise<MonthlyReport> => {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create report');
    }

    // Refetch to update list
    fetchReports();
    return result.report;
  }, [fetchReports]);

  const updateReport = useCallback(async (id: string, data: CreateReportData): Promise<MonthlyReport> => {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update report');
    }

    // Refetch to update list
    fetchReports();
    return result.report;
  }, [fetchReports]);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete report');
    }

    // Refetch to update list
    fetchReports();
  }, [fetchReports]);

  // Get single report if specific month/year is provided
  const report = (month !== null && year !== null && reports.length === 1) ? reports[0] : null;

  return {
    report,
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport,
    deleteReport,
  };
}
