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
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-700 ml-1 block">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          'w-full p-3 bg-white border border-gray-200 rounded-xl text-sm',
          'focus:border-[#5B5FED] focus:ring-1 focus:ring-[#5B5FED] outline-none transition-all resize-none',
          className
        )}
        {...props}
      />
    </div>
  );
};
