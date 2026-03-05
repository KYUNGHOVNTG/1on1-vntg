/**
 * 대시보드 상단 요약 카드 컴포넌트
 *
 * 면담 현황 통계를 3개 카드로 표시합니다.
 * 카드 클릭 시 클라이언트 사이드 필터링 동작 (추가 API 호출 없음)
 */

import { Users, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { DashboardSummary, MeetingStatusBadge } from '../types';

interface DashboardSummaryCardsProps {
  summary: DashboardSummary;
  activeFilter: MeetingStatusBadge | null;
  onFilterChange: (filter: MeetingStatusBadge | null) => void;
}

interface SummaryCardConfig {
  key: MeetingStatusBadge;
  label: string;
  value: number;
  icon: React.ElementType;
  textColor: string;
  bgColor: string;
  borderColor: string;
  activeBorderColor: string;
}

export function DashboardSummaryCards({
  summary,
  activeFilter,
  onFilterChange,
}: DashboardSummaryCardsProps) {
  const cards: SummaryCardConfig[] = [
    {
      key: 'NOT_STARTED',
      label: '면담 미실시',
      value: summary.requested_count,
      icon: Users,
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      activeBorderColor: 'border-gray-400',
    },
    {
      key: 'OVERDUE_2M',
      label: '2개월 초과 지연',
      value: summary.overdue_2month,
      icon: AlertTriangle,
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      activeBorderColor: 'border-red-400',
    },
    {
      key: 'DUE_1M',
      label: '1개월 도래',
      value: summary.due_1month,
      icon: Clock,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      activeBorderColor: 'border-amber-400',
    },
  ];

  const handleCardClick = (key: MeetingStatusBadge) => {
    // 이미 선택된 카드 클릭 시 필터 해제
    onFilterChange(activeFilter === key ? null : key);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => handleCardClick(card.key)}
            className={cn(
              'bg-white rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer',
              isActive
                ? `${card.activeBorderColor} shadow-md ring-1 ring-offset-0 ${card.activeBorderColor.replace('border-', 'ring-')}`
                : `${card.borderColor} shadow-sm`
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">{card.label}</span>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bgColor)}>
                <Icon size={18} className={card.textColor} />
              </div>
            </div>
            <div className={cn('text-3xl font-bold', card.textColor)}>
              {card.value}
              <span className="text-base font-normal ml-1 text-gray-400">명</span>
            </div>
            {isActive && (
              <div className={cn('mt-2 text-xs font-medium', card.textColor)}>
                필터 적용 중 · 클릭하여 해제
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
