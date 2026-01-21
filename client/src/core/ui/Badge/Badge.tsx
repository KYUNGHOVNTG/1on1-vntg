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
    success: 'bg-success/5 text-success border-success/20',
    warning: 'bg-warning/5 text-warning border-warning/20',
    error: 'bg-error/5 text-error border-error/20',
    neutral: 'bg-gray-50 text-gray-500 border-gray-200',
    primary: 'bg-primary/5 text-primary border-primary/20',
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
