'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  centeredTitle?: boolean;
  largeTitle?: boolean;
}

export function ChartCard({ title, subtitle, children, action, centeredTitle, largeTitle }: ChartCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-6 h-full"
      style={{
        boxShadow: '0 4px 24px rgba(27, 67, 50, 0.06)',
        border: '1px solid #D8F3DC',
      }}
    >
      <div className={`flex ${centeredTitle ? 'flex-col items-center' : 'justify-between items-start'} mb-5`}>
        <div className={centeredTitle ? 'text-center' : ''}>
          <h3 className={`m-0 text-forest-800 font-bold flex items-center gap-2.5 ${largeTitle ? 'text-[28px]' : 'text-[15px]'} ${centeredTitle ? 'justify-center' : ''}`}>
            {!centeredTitle && (
              <span
                className="w-1 h-[18px] rounded-sm"
                style={{
                  background: 'linear-gradient(180deg, #1B4332 0%, #52B788 100%)',
                }}
              />
            )}
            {title}
          </h3>
          {subtitle && (
            <p className={`m-0 mt-1.5 text-xs text-gray-500 ${centeredTitle ? '' : 'ml-3.5'}`}>{subtitle}</p>
          )}
        </div>
        {action && !centeredTitle && action}
        {action && centeredTitle && <div className="mt-3">{action}</div>}
      </div>
      {children}
    </div>
  );
}
