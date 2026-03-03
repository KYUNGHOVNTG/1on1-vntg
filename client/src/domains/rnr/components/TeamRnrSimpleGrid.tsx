/**
 * TeamRnrSimpleGrid Component
 *
 * 팀 R&R 현황 간단히 보기
 * - 성명(사원별 MERGE), 부서명, R&R명
 * - R&R별 상세보기 버튼 제공
 * - 상세보기 클릭 시 RrDetailModal 출력 (성명, 부서명, 상위R&R, R&R, 상세내용, 수행일정)
 */

import React, { useState } from 'react';
import { ClipboardList, Loader2, Search } from 'lucide-react';
import type { TeamRrEmployeeItem, RrItem } from '../types';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';
import { RrDetailModal } from './RrDetailModal';

interface TeamRnrSimpleGridProps {
  items: TeamRrEmployeeItem[];
  isLoading: boolean;
  year: string;
}

export const TeamRnrSimpleGrid: React.FC<TeamRnrSimpleGridProps> = ({
  items,
  isLoading,
  year,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedRr, setSelectedRr] = useState<RrItem | null>(null);

  const handleDetailClick = (empName: string, deptName: string, rr: RrItem) => {
    setSelectedEmpName(empName);
    setSelectedDeptName(deptName);
    setSelectedRr(rr);
    setModalOpen(true);
  };

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

  // 팀원별 Row 평탄화
  const rows: Array<{
    key: string;
    empName: string;
    deptName: string;
    rr: RrItem | null;
    rrTitle: string;
    isFirstRr: boolean;
    rrCount: number;
    isLastRr: boolean;
  }> = [];

  items.forEach((emp) => {
    if (emp.rr_list.length === 0) {
      rows.push({
        key: `${emp.emp_no}-empty`,
        empName: emp.emp_name,
        deptName: emp.dept_name,
        rr: null,
        rrTitle: '-',
        isFirstRr: true,
        rrCount: 0,
        isLastRr: true,
      });
    } else {
      emp.rr_list.forEach((rr, idx) => {
        rows.push({
          key: `${emp.emp_no}-${rr.rr_id}`,
          empName: emp.emp_name,
          deptName: emp.dept_name,
          rr,
          rrTitle: rr.title,
          isFirstRr: idx === 0,
          rrCount: emp.rr_list.length,
          isLastRr: idx === emp.rr_list.length - 1,
        });
      });
    }
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '60%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">부서명</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">R&R</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const showTopBorder = rowIdx > 0 && rows[rowIdx - 1].empName !== row.empName;

              return (
                <tr
                  key={row.key}
                  className={`hover:bg-gray-50/60 transition-colors ${
                    showTopBorder ? 'border-t-2 border-gray-200' : 'border-t border-gray-100'
                  }`}
                >
                  {/* 성명 (사원 첫 번째 R&R에만 표시) */}
                  <td className="px-4 py-3 align-top">
                    {row.isFirstRr && (
                      <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                        {row.empName}
                      </span>
                    )}
                  </td>

                  {/* 부서명 */}
                  <td className="px-4 py-3 text-gray-600 text-xs align-top whitespace-nowrap">
                    {row.deptName}
                  </td>

                  {/* R&R 명 */}
                  <td className="px-4 py-3 align-middle">
                    <span className="font-medium text-gray-800 text-sm leading-snug">
                      {row.rrTitle}
                    </span>
                  </td>

                  {/* 상세보기 버튼 */}
                  <td className="px-4 py-3 align-middle text-center">
                    {row.rr && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDetailClick(row.empName, row.deptName, row.rr as RrItem)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#4950DC] bg-[#4950DC]/10 hover:bg-[#4950DC]/20 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Search size={12} />
                        상세보기
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* R&R 상세 조회 모달 */}
      <RrDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        empName={selectedEmpName}
        deptName={selectedDeptName}
        rr={selectedRr}
        year={year}
      />
    </>
  );
};
