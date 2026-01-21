/**
 * Button Component (Skeleton)
 *
 * 재사용 가능한 버튼 컴포넌트
 *
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantStyles: Record<string, string> = {
    primary: 'bg-[#5B5FED] text-white hover:bg-[#4A4ED9] focus:ring-[#5B5FED] shadow-sm',
    secondary: 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900 shadow-sm',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-100',
  };

  const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2.5 text-sm h-10',
    lg: 'px-6 py-3.5 text-base h-12',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};
