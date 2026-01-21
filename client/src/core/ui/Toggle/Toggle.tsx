import React from 'react';
import type { ToggleProps } from './Toggle.types';
import { cn } from '../../utils/cn';

export const Toggle: React.FC<ToggleProps> = ({
  className,
  checked,
  ...props
}) => {
  return (
    <label className={cn('inline-flex items-center cursor-pointer', className)}>
      <div
        className={cn(
          'w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300',
          checked ? 'bg-primary' : 'bg-gray-200'
        )}
      >
        <div
          className={cn(
            'bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        {...props}
      />
    </label>
  );
};
