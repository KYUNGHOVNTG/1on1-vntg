import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SelectProps } from './Select.types';
import { cn } from '../../utils/cn';

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = '선택해주세요',
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-1.5 w-full', className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 ml-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'w-full h-10 pl-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-left transition-all duration-200 outline-none',
            'hover:border-gray-300 focus:border-[#5B5FED] focus:ring-1 focus:ring-[#5B5FED]',
            isOpen ? 'border-[#5B5FED] ring-1 ring-[#5B5FED]' : '',
            disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'cursor-pointer'
          )}
        >
          <span className={cn('block truncate', !selectedOption && 'text-gray-400')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'absolute right-3 top-3 text-gray-400 transition-transform duration-200 pointer-events-none',
              isOpen ? 'rotate-180 text-[#5B5FED]' : ''
            )}
            size={16}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 mt-1 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto scrollbar-hide">
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left transition-colors flex items-center justify-between',
                        option.value === value
                          ? 'bg-indigo-50 text-[#5B5FED] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check size={14} className="text-[#5B5FED]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400 text-center">
                    옵션이 없습니다
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
