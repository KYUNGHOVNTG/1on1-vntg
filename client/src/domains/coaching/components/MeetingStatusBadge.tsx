/**
 * 면담 상태 뱃지 컴포넌트
 *
 * 팀원별 면담 상태를 색상으로 구분하여 표시합니다.
 * NOT_STARTED: 회색 (미실시)
 * OVERDUE_2M: 빨간색 (2개월 초과 지연 — 경고)
 * DUE_1M: 황색 (1개월 도래)
 * NORMAL: 초록색 (정상)
 */

import { cn } from '@/core/utils/cn';
import type { MeetingStatusBadge as MeetingStatusBadgeType } from '../types';

interface MeetingStatusBadgeProps {
  status: MeetingStatusBadgeType;
}

const STATUS_CONFIG: Record<
  MeetingStatusBadgeType,
  { label: string; className: string }
> = {
  NOT_STARTED: {
    label: '미실시',
    className: 'bg-gray-50 text-gray-500 border-gray-200',
  },
  OVERDUE_2M: {
    label: '2개월 초과',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  DUE_1M: {
    label: '1개월 도래',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  NORMAL: {
    label: '정상',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
};

export function MeetingStatusBadge({ status }: MeetingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
