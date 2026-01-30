'use client';

import { Search, RotateCcw } from 'lucide-react';
import {
  ALLOWED_CHANNELS,
  ALLOWED_SENTIMENTS,
  ALLOWED_CONTENT_TYPES,
  ALLOWED_CATEGORIES,
} from '@/lib/constants';
import { MonthPicker } from './MonthPicker';
import { MultiSelectFilter } from './MultiSelectFilter';
import type { DashboardFilters, Channel, Sentiment, ContentType, Category } from '@/types';

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
  onApply: () => void;
  onReset: () => void;
  availableYears?: number[];
  availableTiers?: string[];
}

export function FilterBar({ filters, onFiltersChange, onApply, onReset, availableYears = [], availableTiers = [] }: FilterBarProps) {
  return (
    <div className="bg-white px-10 py-5 border-b border-forest-100 flex gap-5 flex-wrap items-end shadow-sm">
      {/* Month/Year Calendar Picker */}
      <MonthPicker
        value={{ month: filters.month, year: filters.year }}
        onChange={({ month, year }) => onFiltersChange({ month, year })}
        availableYears={availableYears}
      />

      <div className="w-px h-10 bg-forest-100 mx-2" />

      <MultiSelectFilter
        label="Kênh"
        options={ALLOWED_CHANNELS}
        selected={filters.channels}
        onChange={(v) => onFiltersChange({ channels: v as Channel[] })}
      />
      <MultiSelectFilter
        label="Sắc thái"
        options={ALLOWED_SENTIMENTS}
        selected={filters.sentiments}
        onChange={(v) => onFiltersChange({ sentiments: v as Sentiment[] })}
      />
      <MultiSelectFilter
        label="Thể loại nội dung"
        options={ALLOWED_CONTENT_TYPES}
        selected={filters.contentTypes}
        onChange={(v) => onFiltersChange({ contentTypes: v as ContentType[] })}
      />
      <MultiSelectFilter
        label="Category"
        options={ALLOWED_CATEGORIES}
        selected={filters.categories}
        onChange={(v) => onFiltersChange({ categories: v as Category[] })}
      />
      <MultiSelectFilter
        label="Tier"
        options={availableTiers.length > 0 ? availableTiers : ['A', 'B', 'C', 'D']}
        selected={filters.tiers}
        onChange={(v) => onFiltersChange({ tiers: v as string[] })}
      />

      <div className="flex gap-2.5 ml-auto">
        <button
          onClick={onApply}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-white font-semibold text-[13px] transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
            boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
          }}
        >
          <Search className="w-4 h-4" />
          Áp dụng bộ lọc
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-forest-700 font-semibold text-[13px] border-2 border-forest-200 bg-transparent transition-all hover:bg-forest-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
