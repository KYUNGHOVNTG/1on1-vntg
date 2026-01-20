import React from 'react';
import { InputProps } from './Input.types';
import { cn } from '../../utils/cn';

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  type = 'text',
  ...props
}) => {
  const hasError = !!error;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-700 ml-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'w-full h-10 px-3 rounded-xl text-sm outline-none transition-all',
          hasError
            ? 'bg-red-50/30 border border-red-300 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'bg-white border border-gray-200 focus:border-[#5B5FED] focus:ring-1 focus:ring-[#5B5FED]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
};
