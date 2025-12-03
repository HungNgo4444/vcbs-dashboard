'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-6 h-full"
      style={{
        boxShadow: '0 4px 24px rgba(27, 67, 50, 0.06)',
        border: '1px solid #D8F3DC',
      }}
    >
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="m-0 text-forest-800 text-[15px] font-bold flex items-center gap-2.5">
            <span
              className="w-1 h-[18px] rounded-sm"
              style={{
                background: 'linear-gradient(180deg, #1B4332 0%, #52B788 100%)',
              }}
            />
            {title}
          </h3>
          {subtitle && (
            <p className="m-0 mt-1.5 ml-3.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
