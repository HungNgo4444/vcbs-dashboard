'use client';

import { REPORT_TYPES, type ReportType } from '@/types';

interface ReportTypeSidebarProps {
  selectedType: ReportType;
  onTypeChange: (type: ReportType) => void;
}

export function ReportTypeSidebar({ selectedType, onTypeChange }: ReportTypeSidebarProps) {
  return (
    <div className="w-48 border-r border-forest-100 pr-4 shrink-0">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Loại báo cáo
      </h4>
      <div className="space-y-1">
        {REPORT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2
              ${selectedType === type.value
                ? 'bg-forest-100 text-forest-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-forest-700'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                selectedType === type.value ? 'bg-forest-600' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
