'use client';

import { CHANNEL_BADGE_COLORS } from '@/lib/constants';
import type { Channel } from '@/types';

interface ChannelBadgeProps {
  channel: Channel;
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const colors = CHANNEL_BADGE_COLORS[channel] || CHANNEL_BADGE_COLORS['Báo mạng'];

  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {channel}
    </span>
  );
}
