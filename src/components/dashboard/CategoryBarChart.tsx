'use client';

import { RankChange } from '@/components/shared/RankChange';
import type { CategoryDataPoint } from '@/types';

interface CategoryBarChartProps {
  data: CategoryDataPoint[];
  maxMentions?: number;
}

export function CategoryBarChart({ data, maxMentions }: CategoryBarChartProps) {
  // Calculate max mentions from data if not provided
  const maxValue = maxMentions || Math.max(...data.map((d) => d.mentions), 1);

  return (
    <div className="h-[600px] overflow-y-auto pr-2">
      {data.map((item, idx) => (
        <div
          key={item.name}
          className="flex items-center py-3"
          style={{
            borderBottom: idx < data.length - 1 ? '1px solid #F0FDF4' : 'none',
          }}
        >
          {/* Rank number */}
          <div
            className="w-[30px] h-[30px] rounded-md flex items-center justify-center font-bold text-[12px] mr-4 flex-shrink-0"
            style={{
              background:
                idx < 3
                  ? `linear-gradient(135deg, ${
                      idx === 0 ? '#1B4332' : idx === 1 ? '#2D6A4F' : '#40916C'
                    } 0%, ${
                      idx === 0 ? '#2D6A4F' : idx === 1 ? '#40916C' : '#52B788'
                    } 100%)`
                  : '#F0FDF4',
              color: idx < 3 ? '#fff' : '#1B4332',
            }}
          >
            {idx + 1}
          </div>

          {/* Category name and progress bar */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-forest-800 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {item.name}
            </div>
            <div className="h-[8px] bg-forest-50 rounded-[4px] overflow-hidden">
              <div
                className="h-full rounded-[4px] transition-all duration-500"
                style={{
                  width: `${Math.min((item.mentions / maxValue) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #1B4332 0%, #52B788 100%)',
                }}
              />
            </div>
          </div>

          {/* Mentions count */}
          <div className="text-[14px] font-bold text-forest-800 ml-4 min-w-[50px] text-right">
            {item.mentions.toLocaleString()}
          </div>

          {/* Rank change */}
          <div className="ml-3 min-w-[35px] text-center">
            {item.change !== null && item.change !== undefined ? (
              <RankChange change={item.change} />
            ) : (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
