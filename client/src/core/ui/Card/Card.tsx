import React from 'react';
import { CardProps } from './Card.types';
import { cn } from '../../utils/cn';

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  hoverable = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden',
        hoverable && 'hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {header}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};
