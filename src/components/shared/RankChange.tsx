'use client';

interface RankChangeProps {
  change: number;
}

export function RankChange({ change }: RankChangeProps) {
  if (change === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  // Positive change means rank improved (e.g., prevRank 5 - currentRank 3 = +2)
  // Negative change means rank declined (e.g., prevRank 3 - currentRank 5 = -2)
  const isUp = change > 0;

  return (
    <span
      className="font-bold text-xs flex items-center gap-0.5"
      style={{ color: isUp ? '#2D6A4F' : '#D62828' }}
    >
      {isUp ? '↑' : '↓'}
      {Math.abs(change)}
    </span>
  );
}
