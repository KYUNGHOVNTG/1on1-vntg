/**
 * Input Component (Skeleton)
 *
 * 재사용 가능한 인풋 컴포넌트
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Invalid email"
 * />
 */

import React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
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
        <input
          className={cn(
            'w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-200 outline-none',
            'placeholder:text-gray-400',
            'focus:border-[#5B5FED] focus:ring-1 focus:ring-[#5B5FED]',
            'group-hover:border-gray-300 focus:group-hover:border-[#5B5FED]',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
            props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] font-medium text-red-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-gray-400 ml-1 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};
