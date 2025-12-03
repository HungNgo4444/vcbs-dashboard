'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return 'Tất cả';
    if (selected.length === 1) return selected[0];
    if (selected.length === options.length) return 'Tất cả';
    return `${selected.length} đã chọn`;
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-[11px] text-forest-700 font-bold uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-3 py-2.5 pr-3 rounded-lg border-2 border-forest-200 bg-white text-forest-800 text-[13px] font-medium cursor-pointer outline-none min-w-[140px] transition-all hover:border-forest-300 focus:border-forest-500"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className={`w-4 h-4 ml-2 text-forest-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 min-w-[200px] bg-white rounded-lg border-2 border-forest-200 shadow-lg overflow-hidden">
            {/* Quick actions */}
            <div className="flex gap-2 p-2 border-b border-forest-100 bg-forest-50/50">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] text-forest-700 hover:text-forest-900 font-medium"
              >
                Chọn tất cả
              </button>
              <span className="text-forest-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-forest-700 hover:text-forest-900 font-medium"
              >
                Bỏ chọn
              </button>
            </div>

            {/* Options */}
            <div className="max-h-[250px] overflow-y-auto">
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-forest-50' : 'hover:bg-forest-50/50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-forest-700 border-forest-700'
                          : 'border-forest-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[13px] ${isSelected ? 'text-forest-800 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
