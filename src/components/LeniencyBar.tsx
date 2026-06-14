import React from 'react';
import { getLeniencyColor, getLeniencyLabel } from '@/lib/state-judges';

interface LeniencyBarProps {
  score: number;
  showLabel?: boolean;
  width?: string;
}

export function LeniencyBar({ score, showLabel = false, width = 'w-20' }: LeniencyBarProps) {
  const color = getLeniencyColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className={`${width} h-2 bg-[#2a2a2a] rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="font-bold text-sm min-w-[2.5rem]" style={{ color }}>
        {score}
      </span>
      {showLabel && (
        <span className="text-xs" style={{ color }}>
          {getLeniencyLabel(score)}
        </span>
      )}
    </div>
  );
}
