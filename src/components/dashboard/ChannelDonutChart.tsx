'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { CHANNEL_COLORS } from '@/lib/constants';
import type { ChannelDistribution } from '@/hooks/useDashboardData';

interface ChannelDonutChartProps {
  data: ChannelDistribution[];
  dataKey: 'mentions' | 'engagement';
  onChannelClick?: (channel: string) => void;
  selectedChannel?: string | null;
}

interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

export function ChannelDonutChart({ data, dataKey, onChannelClick, selectedChannel }: ChannelDonutChartProps) {
  // Transform data to the format recharts expects
  const chartData: ChartDataItem[] = data.map((item) => ({
    name: item.name,
    value: item[dataKey],
  }));

  const hasSelection = selectedChannel !== null && selectedChannel !== undefined;

  // Handle pie slice click
  const handlePieClick = (data: ChartDataItem) => {
    if (onChannelClick) {
      onChannelClick(data.name);
    }
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
    if (percent < 0.05) return null; // Don't show label for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-forest-100">
          <p className="text-[13px] font-semibold text-forest-800">{item.name}</p>
          <p className="text-[12px] text-gray-600">
            {dataKey === 'mentions' ? 'Đề cập' : 'Tương tác'}: {item.value.toLocaleString()} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={90}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="#fff"
          onClick={handlePieClick}
          style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
        >
          {chartData.map((entry) => {
            const isSelected = selectedChannel === entry.name;
            const isDimmed = hasSelection && !isSelected;
            return (
              <Cell
                key={entry.name}
                fill={CHANNEL_COLORS[entry.name] || '#999'}
                opacity={isDimmed ? 0.4 : 1}
                stroke={isSelected ? '#1B4332' : '#fff'}
                strokeWidth={isSelected ? 3 : 2}
              />
            );
          })}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: '#333', fontSize: '11px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
