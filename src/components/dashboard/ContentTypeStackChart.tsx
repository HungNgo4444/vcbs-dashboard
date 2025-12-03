'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CONTENT_TYPE_COLORS } from '@/lib/constants';
import type { ContentTypeDataPoint } from '@/types';

interface ContentTypeStackChartProps {
  data: ContentTypeDataPoint[];
}

export function ContentTypeStackChart({ data }: ContentTypeStackChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#666' }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="month"
          tick={{ fontSize: 12, fill: '#1B4332', fontWeight: 600 }}
          width={35}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => `${v}%`}
          contentStyle={{
            background: '#fff',
            border: '1px solid #D8F3DC',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          iconType="square"
          iconSize={10}
        />
        <Bar
          dataKey="Tin tức thị trường"
          stackId="a"
          fill={CONTENT_TYPE_COLORS['Tin tức thị trường']}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Bán hàng/Môi giới"
          stackId="a"
          fill={CONTENT_TYPE_COLORS['Bán hàng/Môi giới']}
        />
        <Bar
          dataKey="Tin trực tiếp về thương hiệu"
          stackId="a"
          fill={CONTENT_TYPE_COLORS['Tin trực tiếp về thương hiệu']}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
