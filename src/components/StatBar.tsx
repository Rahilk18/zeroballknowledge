import React from 'react';
import { getStatBarColor } from '../utils/formatters';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  showValue?: boolean;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue = 100,
  showValue = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-slate-400 tracking-wider uppercase text-[11px]">{label}</span>
        {showValue && (
          <span className="font-black text-slate-100 text-xs">
            {value}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-slate-700/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getStatBarColor(value)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
