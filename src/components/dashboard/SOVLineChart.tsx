'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CHANNEL_COLORS } from '@/lib/constants';
import type { SOVDataPoint } from '@/types';

interface SOVLineChartProps {
  data: SOVDataPoint[];
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
}

export function SOVLineChart({ data, onDateClick, selectedDate }: SOVLineChartProps) {
  const hasSelection = selectedDate !== null && selectedDate !== undefined;

  // Handle click on chart area
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (state: any) => {
    if (state?.activeLabel && onDateClick) {
      onDateClick(String(state.activeLabel));
    }
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        onClick={handleChartClick}
        style={{ cursor: onDateClick ? 'pointer' : 'default' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#666' }}
          axisLine={{ stroke: '#D8F3DC' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#666' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #D8F3DC',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
        />
        {/* Show reference line for selected date */}
        {hasSelection && selectedDate && (
          <ReferenceLine
            x={selectedDate}
            stroke="#1B4332"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
        {Object.entries(CHANNEL_COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            opacity={hasSelection ? 0.7 : 1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
