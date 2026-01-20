import React from 'react';
import type { BadgeProps } from './Badge.types';
import { cn } from '../../utils/cn';

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-orange-50 text-orange-600 border-orange-100',
    error: 'bg-red-50 text-red-600 border-red-100',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
    primary: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-semibold border inline-flex items-center',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
