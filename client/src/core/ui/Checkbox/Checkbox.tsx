import React from 'react';
import { Check } from 'lucide-react';
import type { CheckboxProps } from './Checkbox.types';
import { cn } from '../../utils/cn';

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  checked,
  ...props
}) => {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer group', className)}>
      <div
        className={cn(
          'w-5 h-5 rounded-md border flex items-center justify-center transition-all',
          checked
            ? 'bg-[#5B5FED] border-[#5B5FED]'
            : 'bg-white border-gray-300 group-hover:border-[#5B5FED]'
        )}
      >
        {checked && <Check size={14} className="text-white" />}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};
