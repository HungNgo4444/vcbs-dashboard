'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface MonthPickerProps {
  value: { month: number | null; year: number | null };
  onChange: (value: { month: number | null; year: number | null }) => void;
  availableYears: number[];
}

const MONTH_NAMES = [
  'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
  'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
];

const MONTH_FULL_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function MonthPicker({ value, onChange, availableYears }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year || new Date().getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (month: number) => {
    onChange({ month, year: viewYear });
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ month: null, year: null });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (value.month !== null && value.year !== null) {
      return `${MONTH_FULL_NAMES[value.month - 1]} ${value.year}`;
    }
    return 'Tất cả thời gian';
  };

  const minYear = Math.min(...availableYears, viewYear);
  const maxYear = Math.max(...availableYears, viewYear);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-forest-700 font-bold uppercase tracking-wider">
          Thời gian
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-forest-200 bg-white text-forest-800 text-[13px] font-medium cursor-pointer outline-none min-w-[180px] transition-all hover:border-forest-300 focus:border-forest-500"
        >
          <Calendar className="w-4 h-4 text-forest-600" />
          <span className="flex-1 text-left">{getDisplayText()}</span>
          {value.month !== null && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-forest-200 p-4 z-50"
          style={{ minWidth: '280px' }}
        >
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewYear(Math.max(minYear, viewYear - 1))}
              disabled={viewYear <= minYear}
              className="p-1.5 rounded-lg hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-forest-700" />
            </button>
            <span className="text-lg font-bold text-forest-800">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(Math.min(maxYear, viewYear + 1))}
              disabled={viewYear >= maxYear}
              className="p-1.5 rounded-lg hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-forest-700" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTH_NAMES.map((name, idx) => {
              const month = idx + 1;
              const isSelected = value.month === month && value.year === viewYear;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(month)}
                  className={`px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    isSelected
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full mt-3 py-2 text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Xóa bộ lọc thời gian
          </button>
        </div>
      )}
    </div>
  );
}
