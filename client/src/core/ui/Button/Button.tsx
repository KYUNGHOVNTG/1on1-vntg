import React from 'react';
import { ButtonProps } from './Button.types';
import { cn } from '../../utils/cn';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all';

  const variantStyles = {
    primary: 'bg-[#5B5FED] hover:bg-[#4f53d1] text-white shadow-sm',
    secondary: 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700',
    ghost: 'bg-transparent hover:bg-gray-50 text-[#5B5FED]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
