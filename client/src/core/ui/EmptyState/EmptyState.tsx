/**
 * EmptyState Component
 *
 * 데이터가 없거나 초기 상태일 때 표시되는 컴포넌트
 * 조회 결과 없음, 빈 목록 등에 사용
 *
 * @example
 * <EmptyState
 *   icon={Inbox}
 *   title="데이터가 없습니다"
 *   description="아직 등록된 항목이 없습니다. 새로운 항목을 추가해보세요."
 *   action={{
 *     label: '추가하기',
 *     onClick: handleAdd
 *   }}
 * />
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import type { EmptyStateProps } from './EmptyState.types';
import { cn } from '../../utils/cn';

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">{description}</p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all',
            action.variant === 'secondary'
              ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
              : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
