import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectProps } from './Select.types';
import { cn } from '../../utils/cn';

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-700 ml-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full h-10 pl-3 pr-8 bg-white border border-gray-200 rounded-xl text-sm appearance-none',
            'focus:border-[#5B5FED] focus:ring-1 focus:ring-[#5B5FED] outline-none transition-all cursor-pointer',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-3 text-gray-400 pointer-events-none"
          size={16}
        />
      </div>
    </div>
  );
};
