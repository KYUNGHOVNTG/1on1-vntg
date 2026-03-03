/**
 * TeamRnrDetailAccordion Component
 *
 * 팀 R&R 현황 자세히 보기
 * 팀원별 아코디언으로 R&R 목록을 펼쳐볼 수 있습니다.
 * 기본: 팀원명 / 부서명 / 직책명 / R&R갯수
 * 펼침: 각 R&R 명칭 + 수행 기간 타임라인 바
 */

import React, { useState } from 'react';
import { ClipboardList, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { TeamRrEmployeeItem } from '../types';
import { TimelineBar } from './TimelineBar';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

interface TeamRnrDetailAccordionProps {
  items: TeamRrEmployeeItem[];
  isLoading: boolean;
  year: string;
}

interface AccordionRowProps {
  emp: TeamRrEmployeeItem;
  year: string;
}

const AccordionRow: React.FC<AccordionRowProps> = ({ emp, year }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* 헤더 행 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center px-5 py-3.5 hover:bg-gray-50/70 transition-colors text-left"
      >
        <span className="w-[18%] font-semibold text-gray-900 text-sm">{emp.emp_name}</span>
        <span className="w-[22%] text-sm text-gray-600">{emp.dept_name}</span>
        <span className="w-[15%]">
          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
            {emp.position_name}
          </span>
        </span>
        <span className="flex-1 text-sm text-gray-500">
          R&R{' '}
          <span className="font-semibold text-gray-800">{emp.rr_count}</span>건
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-gray-400 transition-transform duration-200 flex-shrink-0',
            isOpen ? 'rotate-180 text-[#4950DC]' : ''
          )}
        />
      </button>

      {/* 펼침 영역: R&R 목록 */}
      {isOpen && (
        <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 space-y-3">
          {emp.rr_list.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 text-center">등록된 R&R이 없습니다</p>
          ) : (
            emp.rr_list.map((rr) => (
              <div
                key={rr.rr_id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-4"
              >
                {/* R&R 명 (왼쪽 40%) */}
                <div className="w-[40%] min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{rr.title}</p>
                  {rr.parent_title && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      상위: {rr.parent_title}
                    </p>
                  )}
                </div>

                {/* 구분선 */}
                <div className="w-px bg-gray-100 self-stretch flex-shrink-0" />

                {/* 타임라인 바 (오른쪽) */}
                <div className="flex-1 min-w-0 pt-1">
                  <TimelineBar periods={rr.periods} year={year} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TeamRnrDetailAccordion: React.FC<TeamRnrDetailAccordionProps> = ({
  items,
  isLoading,
  year,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#4950DC] animate-spin mb-4" />
        <p className="text-sm text-gray-500">팀 R&R 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <EmptyState
          icon={ClipboardList}
          title="조회된 R&R이 없습니다"
          description="조회 조건을 변경하거나 팀원이 R&R을 등록하면 표시됩니다"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="flex items-center px-5 py-3 bg-gray-50 border-b border-gray-100">
        <span className="w-[18%] text-xs font-semibold text-gray-600">팀원명</span>
        <span className="w-[22%] text-xs font-semibold text-gray-600">부서명</span>
        <span className="w-[15%] text-xs font-semibold text-gray-600">직책</span>
        <span className="flex-1 text-xs font-semibold text-gray-600">R&R 현황</span>
      </div>

      {/* 아코디언 행 목록 */}
      {items.map((emp) => (
        <AccordionRow key={emp.emp_no} emp={emp} year={year} />
      ))}
    </div>
  );
};
