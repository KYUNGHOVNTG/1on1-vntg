/**
 * TeamRnrDetailAccordion Component
 *
 * 팀 R&R 현황 자세히 보기
 * - Card DIV 아코디언 방식
 * - 접힌 상태: 부서명, 성명, 보유R&R 갯수
 * - 펼친 상태: 부서명, 성명, 보유R&R 갯수 + 상위R&R + R&R + 수행일정 막대그래프
 *   (1월~12월 레이블은 펼친 영역 최상단에 1번만 표시)
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

/** 1월~12월 레이블 헤더 (펼친 영역 최상단에 1회만 표시) */
const MonthHeader: React.FC = () => (
  <div className="grid grid-cols-12 text-[10px] text-gray-400 font-medium px-4 pb-2 pt-1">
    {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map(
      (m) => (
        <div key={m} className="text-center">
          {m}
        </div>
      ),
    )}
  </div>
);

const AccordionRow: React.FC<AccordionRowProps> = ({ emp, year }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 (접힌 상태) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center px-5 py-4 hover:bg-gray-50/70 transition-colors text-left"
      >
        <span className="w-[30%] text-sm text-gray-600 truncate">{emp.dept_name}</span>
        <span className="w-[35%] font-semibold text-gray-900 text-sm truncate">{emp.emp_name}</span>
        <span className="flex-1 text-sm text-gray-500">
          보유 R&R{' '}
          <span className="font-semibold text-[#4950DC]">{emp.rr_count}</span>건
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-gray-400 transition-transform duration-200 flex-shrink-0',
            isOpen ? 'rotate-180 text-[#4950DC]' : '',
          )}
        />
      </button>

      {/* 펼침 영역 */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {emp.rr_list.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">등록된 R&R이 없습니다</p>
          ) : (
            <>
              {/* 1월~12월 레이블: 최상단 1회만 표시 */}
              <div className="bg-gray-50/60 border-b border-gray-100">
                {/* 헤더 라벨 행 */}
                <div className="flex items-center px-5 py-2">
                  <div className="w-[40%] text-xs font-semibold text-gray-500">상위 R&R / R&R</div>
                  <div className="flex-1">
                    <MonthHeader />
                  </div>
                </div>
              </div>

              {/* R&R 목록 */}
              <div className="divide-y divide-gray-100">
                {emp.rr_list.map((rr) => (
                  <div key={rr.rr_id} className="flex items-start gap-4 px-5 py-3">
                    {/* 상위 R&R + R&R 명 */}
                    <div className="w-[40%] min-w-0">
                      {rr.parent_title && (
                        <p className="text-xs text-gray-400 truncate mb-0.5">
                          {rr.parent_title}
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{rr.title}</p>
                    </div>

                    {/* 구분선 */}
                    <div className="w-px bg-gray-100 self-stretch flex-shrink-0" />

                    {/* 수행일정 막대 (레이블 없음) */}
                    <div className="flex-1 min-w-0 pt-1">
                      <TimelineBar periods={rr.periods} year={year} showLabels={false} />
                    </div>
                  </div>
                ))}
              </div>
            </>
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
    <div className="space-y-3">
      {items.map((emp) => (
        <AccordionRow key={emp.emp_no} emp={emp} year={year} />
      ))}
    </div>
  );
};
