import React from 'react';
import type { ProgressBarProps } from './ProgressBar.types';
import { cn } from '../../utils/cn';

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = 'bg-[#5B5FED]',
  className,
  ...props
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-700">{label}</span>
          <span className="text-[#5B5FED]">{clampedValue}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
