import React from 'react';
import type { TextareaProps } from './Textarea.types';
import { cn } from '../../utils/cn';

export const Textarea: React.FC<TextareaProps> = ({
  label,
  className,
  rows = 3,
  ...props
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 ml-1 block">
          {label}
        </label>
      )}
      <div className="relative group">
        <textarea
          rows={rows}
          className={cn(
            'w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-200 outline-none',
            'placeholder:text-gray-400',
            'focus:border-primary focus:ring-1 focus:ring-primary',
            'group-hover:border-gray-300 focus:group-hover:border-primary',
            'resize-none'
          )}
          {...props}
        />
      </div>
    </div>
  );
};
