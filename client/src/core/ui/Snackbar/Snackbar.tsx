/**
 * Snackbar Component
 *
 * 화면 하단 중앙에 표시되는 액션 가능한 알림
 * Undo, 재시도 등 사용자 액션을 제공
 *
 * @example
 * snackbar.show('항목이 삭제되었습니다', {
 *   label: '취소',
 *   onClick: handleUndo
 * });
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { SnackbarProps } from './Snackbar.types';
import { cn } from '../../utils/cn';

export const Snackbar: React.FC<SnackbarProps> = ({
  id,
  message,
  action,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={cn(
        'flex items-center gap-4 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-xl',
        'min-w-[320px] max-w-[560px]'
      )}
      role="alert"
    >
      <p className="flex-1 text-sm font-medium">{message}</p>

      <div className="flex items-center gap-2">
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="px-3 py-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide"
          >
            {action.label}
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
};
