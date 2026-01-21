/**
 * Toast Component
 *
 * 우측 하단에 표시되는 일시적인 알림 메시지
 * 자동으로 사라지며, 비차단적인 피드백 제공
 *
 * @example
 * toast.success('저장되었습니다');
 * toast.error('오류가 발생했습니다');
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastProps } from './Toast.types';
import { cn } from '../../utils/cn';

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = 'info',
  duration = 3000,
  onClose,
}) => {
  const variantConfig = {
    success: {
      containerClass: 'bg-white border-emerald-200 shadow-lg shadow-emerald-100/50',
      icon: CheckCircle,
      iconClass: 'text-emerald-500',
    },
    error: {
      containerClass: 'bg-white border-red-200 shadow-lg shadow-red-100/50',
      icon: XCircle,
      iconClass: 'text-red-500',
    },
    warning: {
      containerClass: 'bg-white border-orange-200 shadow-lg shadow-orange-100/50',
      icon: AlertTriangle,
      iconClass: 'text-orange-500',
    },
    info: {
      containerClass: 'bg-white border-indigo-200 shadow-lg shadow-indigo-100/50',
      icon: Info,
      iconClass: 'text-indigo-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

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
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border min-w-[320px] max-w-[480px]',
        config.containerClass
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />
      <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
};
