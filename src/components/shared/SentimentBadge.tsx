'use client';

import { SENTIMENT_COLORS } from '@/lib/constants';
import type { Sentiment } from '@/types';

interface SentimentBadgeProps {
  sentiment: Sentiment;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const colors = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS['Trung tính'];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.text }}
      />
      {sentiment}
    </span>
  );
}
