/**
 * ToggleTabs Component
 *
 * R&R 목록 뷰 모드 전환 컴포넌트 (간단히 / 자세히)
 */

import React from 'react';
import { cn } from '@/core/utils/cn';

export type ViewMode = 'simple' | 'detail';

interface ToggleTabsProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export const ToggleTabs: React.FC<ToggleTabsProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1 w-fit">
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
          value === 'simple'
            ? 'bg-white text-[#4950DC] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        간단히
      </button>
      <button
        type="button"
        onClick={() => onChange('detail')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
          value === 'detail'
            ? 'bg-white text-[#4950DC] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        자세히
      </button>
    </div>
  );
};
