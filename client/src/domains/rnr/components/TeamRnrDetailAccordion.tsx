/**
 * TeamRnrDetailAccordion Component
 *
 * 팀 R&R 현황 조회 화면
 * - Card DIV 아코디언 방식
 * - 접힌 상태: 이름(진하게) + 부서·직책(연하게), R&R 건수 뱃지
 * - 펼친 상태: grid-cols-12 (4:7:1) 레이아웃으로 상위 R&R/R&R + 타임라인 + 상세버튼
 *   (1월~12월 레이블은 펼친 영역 최상단에 1번만 표시, flex justify-between)
 * - 사람별 막대그래프 색상 구분
 * - R&R별 상세보기 버튼 → hover 시에만 표시 → RrDetailModal
 */

import React, { useState } from 'react';
import { ClipboardList, ChevronDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { TeamRrEmployeeItem, RrItem } from '../types';
import { TimelineBar } from './TimelineBar';
import { RrDetailModal } from './RrDetailModal';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

/** 사람별 막대그래프 색상 팔레트 */
const PERSON_COLOR_CLASSES = [
  'bg-[#4950DC]',
  'bg-[#14B287]',
  'bg-[#E64D4D]',
  'bg-[#F59E0B]',
  'bg-[#2E81B1]',
  'bg-[#8B5CF6]',
  'bg-[#EC4899]',
  'bg-[#059669]',
  'bg-[#0EA5E9]',
  'bg-[#D97706]',
];

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

interface TeamRnrDetailAccordionProps {
  items: TeamRrEmployeeItem[];
  isLoading: boolean;
  year: string;
}

interface AccordionRowProps {
  emp: TeamRrEmployeeItem;
  year: string;
  colorClass: string;
}

const AccordionRow: React.FC<AccordionRowProps> = ({ emp, year, colorClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRr, setSelectedRr] = useState<RrItem | null>(null);

  const handleDetailClick = (rr: RrItem) => {
    setSelectedRr(rr);
    setModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 (접힌 상태) - 이름+부서·직책 좌측 / R&R 건수 뱃지+화살표 우측 */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/70 transition-colors text-left"
        >
          {/* 좌측: 이름(크고 진하게) + 부서·직책(작고 연하게) 세로 배치 */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold text-gray-900">{emp.emp_name}</span>
            <span className="text-xs text-gray-500">
              {emp.dept_name}
              {emp.position_name ? ` · ${emp.position_name}` : ''}
            </span>
          </div>

          {/* 우측: R&R 건수 뱃지 + 화살표 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4950DC]/10 text-[#4950DC]">
              R&amp;R {emp.rr_count}건
            </span>
            <ChevronDown
              size={16}
              className={cn(
                'text-gray-400 transition-transform duration-200',
                isOpen ? 'rotate-180 text-[#4950DC]' : '',
              )}
            />
          </div>
        </button>

        {/* 펼침 영역 */}
        {isOpen && (
          <div className="border-t border-gray-100">
            {emp.rr_list.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">등록된 R&R이 없습니다</p>
            ) : (
              <>
                {/* 컬럼 헤더 행: grid-cols-12 (4:7:1) */}
                <div className="bg-gray-50/60 border-b border-gray-100">
                  <div className="grid grid-cols-12 items-center px-5 py-2 gap-2">
                    {/* 4칸: 레이블 */}
                    <div className="col-span-4 text-xs font-semibold text-gray-500">
                      상위 R&amp;R / R&amp;R
                    </div>
                    {/* 7칸: 1~12월 헤더 (justify-between) */}
                    <div className="col-span-7 flex justify-between">
                      {MONTHS.map((m) => (
                        <span key={m} className="text-[10px] font-medium text-gray-400">
                          {m}
                        </span>
                      ))}
                    </div>
                    {/* 1칸: 비어 있음 */}
                    <div className="col-span-1" />
                  </div>
                </div>

                {/* R&R 목록: grid-cols-12 (4:7:1) */}
                <div className="divide-y divide-gray-100">
                  {emp.rr_list.map((rr) => (
                    <div
                      key={rr.rr_id}
                      className="grid grid-cols-12 items-center px-5 py-3 gap-2 group"
                    >
                      {/* 4칸: 상위 R&R + 담당 R&R 텍스트 */}
                      <div className="col-span-4 min-w-0 pr-2">
                        {rr.parent_title && (
                          <p className="text-xs text-gray-400 truncate mb-0.5">
                            {rr.parent_title}
                          </p>
                        )}
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {rr.title}
                        </p>
                      </div>

                      {/* 7칸: 타임라인 막대 (레이블 없음) */}
                      <div className="col-span-7">
                        <TimelineBar
                          periods={rr.periods}
                          year={year}
                          showLabels={false}
                          colorClass={colorClass}
                        />
                      </div>

                      {/* 1칸: 상세보기 버튼 (hover 시에만 표시) */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleDetailClick(rr)}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[#4950DC] bg-[#4950DC]/10 hover:bg-[#4950DC]/20 rounded-lg transition-all whitespace-nowrap"
                        >
                          <Search size={12} />
                          상세
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* R&R 상세 조회 모달 */}
      <RrDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        empName={emp.emp_name}
        deptName={emp.dept_name}
        rr={selectedRr}
        year={year}
      />
    </>
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
      {items.map((emp, idx) => (
        <AccordionRow
          key={emp.emp_no}
          emp={emp}
          year={year}
          colorClass={PERSON_COLOR_CLASSES[idx % PERSON_COLOR_CLASSES.length]}
        />
      ))}
    </div>
  );
};
