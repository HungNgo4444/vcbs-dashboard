'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  isNegativeMetric?: boolean;
  suffix?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  isNegativeMetric = false,
  suffix = '',
}: MetricCardProps) {
  // isNegativeMetric: true for "Tiêu cực" metric - when decrease is good
  const isPositiveChange = isNegativeMetric ? (change ?? 0) < 0 : (change ?? 0) >= 0;

  return (
    <div
      className="rounded-2xl px-6 py-5 text-white relative overflow-hidden min-h-[120px]"
      style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        boxShadow: '0 10px 40px rgba(27, 67, 50, 0.25)',
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
      <div
        className="absolute -bottom-5 right-10 w-[60px] h-[60px] rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />

      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-[13px] opacity-90 font-medium">{title}</span>
      </div>
      <div className="text-[32px] font-bold mb-1.5 tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      {change !== undefined && change !== 0 && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: isPositiveChange ? '#B7E4C7' : '#FF8A8A' }}
        >
          <span className="text-[10px]">{change >= 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(change)}% vs tháng trước</span>
        </div>
      )}
      {change === 0 && (
        <div className="text-xs font-medium opacity-60">
          -- vs tháng trước
        </div>
      )}
    </div>
  );
}
