/**
 * InlineMessage Component
 *
 * 폼 필드 하단이나 영역 내부에 표시되는 인라인 메시지
 * 주로 유효성 검증 오류, 경고, 성공 메시지에 사용
 *
 * @example
 * // message prop 사용
 * <InlineMessage variant="error" message="이메일 형식이 올바르지 않습니다" />
 *
 * // children 사용 (권장)
 * <InlineMessage variant="warning">
 *   변경된 내용이 있습니다. 저장 버튼을 클릭하여 저장하세요.
 * </InlineMessage>
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import type { InlineMessageProps } from './InlineMessage.types';
import { cn } from '../../utils/cn';

export const InlineMessage: React.FC<InlineMessageProps> = ({
  variant = 'error',
  message,
  children,
  className,
  showIcon = true,
}) => {
  const variantConfig = {
    error: {
      containerClass: 'bg-red-50 border-red-200 text-red-700',
      icon: AlertCircle,
      iconClass: 'text-red-500',
    },
    warning: {
      containerClass: 'bg-orange-50 border-orange-200 text-orange-700',
      icon: AlertTriangle,
      iconClass: 'text-orange-500',
    },
    success: {
      containerClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: CheckCircle,
      iconClass: 'text-emerald-500',
    },
    info: {
      containerClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      icon: Info,
      iconClass: 'text-indigo-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
        config.containerClass,
        className
      )}
      role="alert"
    >
      {showIcon && <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.iconClass)} />}
      <span className="flex-1">{children || message}</span>
    </div>
  );
};
