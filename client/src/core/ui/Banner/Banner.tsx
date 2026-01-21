/**
 * Banner Component
 *
 * 페이지 상단에 고정되는 전역 공지/알림
 * 시스템 공지, 권한 안내, 정책 변경 등에 사용
 *
 * @example
 * <Banner
 *   variant="warning"
 *   title="시스템 점검 안내"
 *   message="2024년 1월 15일 02:00 ~ 06:00 시스템 점검이 예정되어 있습니다."
 *   dismissible
 *   onDismiss={handleDismiss}
 * />
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import type { BannerProps } from './Banner.types';
import { cn } from '../../utils/cn';

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  showIcon = true,
  className,
}) => {
  const variantConfig = {
    info: {
      containerClass: 'bg-indigo-50 border-indigo-200',
      icon: Info,
      iconClass: 'text-indigo-600',
      titleClass: 'text-indigo-900',
      messageClass: 'text-indigo-700',
    },
    warning: {
      containerClass: 'bg-orange-50 border-orange-200',
      icon: AlertTriangle,
      iconClass: 'text-orange-600',
      titleClass: 'text-orange-900',
      messageClass: 'text-orange-700',
    },
    success: {
      containerClass: 'bg-emerald-50 border-emerald-200',
      icon: CheckCircle,
      iconClass: 'text-emerald-600',
      titleClass: 'text-emerald-900',
      messageClass: 'text-emerald-700',
    },
    error: {
      containerClass: 'bg-red-50 border-red-200',
      icon: XCircle,
      iconClass: 'text-red-600',
      titleClass: 'text-red-900',
      messageClass: 'text-red-700',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('border-b overflow-hidden', config.containerClass, className)}
        role="alert"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start gap-4">
            {showIcon && <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />}

            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={cn('text-sm font-semibold mb-1', config.titleClass)}>{title}</h3>
              )}
              <p className={cn('text-sm', config.messageClass)}>{message}</p>
            </div>

            <div className="flex items-center gap-3">
              {action && (
                <button
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors',
                    variant === 'info' && 'text-indigo-700 hover:bg-indigo-100',
                    variant === 'warning' && 'text-orange-700 hover:bg-orange-100',
                    variant === 'success' && 'text-emerald-700 hover:bg-emerald-100',
                    variant === 'error' && 'text-red-700 hover:bg-red-100'
                  )}
                >
                  {action.label}
                </button>
              )}

              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
