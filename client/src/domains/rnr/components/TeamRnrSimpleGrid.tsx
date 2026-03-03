/**
 * TeamRnrSimpleGrid Component
 *
 * 팀 R&R 현황 간단히 보기
 * 팀원명 / R&R 명 / 수행 기간을 한 행씩 나열합니다. (R&R 갯수만큼 행 생성)
 */

import React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { TeamRrEmployeeItem } from '../types';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

interface TeamRnrSimpleGridProps {
  items: TeamRrEmployeeItem[];
  isLoading: boolean;
  year: string;
}

function formatPeriod(startDate: string, endDate: string): string {
  const sy = startDate.substring(0, 4);
  const sm = startDate.substring(4, 6);
  const ey = endDate.substring(0, 4);
  const em = endDate.substring(4, 6);
  return `${sy}.${sm} ~ ${ey}.${em}`;
}

export const TeamRnrSimpleGrid: React.FC<TeamRnrSimpleGridProps> = ({
  items,
  isLoading,
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

  // 팀원별 R&R을 한 행씩 평탄화
  const rows: Array<{
    key: string;
    empName: string;
    deptName: string;
    positionName: string;
    rrTitle: string;
    periods: string;
    isFirstRr: boolean;
    rrCount: number;
  }> = [];

  items.forEach((emp) => {
    if (emp.rr_list.length === 0) {
      rows.push({
        key: `${emp.emp_no}-empty`,
        empName: emp.emp_name,
        deptName: emp.dept_name,
        positionName: emp.position_name,
        rrTitle: '-',
        periods: '-',
        isFirstRr: true,
        rrCount: 0,
      });
    } else {
      emp.rr_list.forEach((rr, idx) => {
        const periodText =
          rr.periods.length > 0
            ? rr.periods.map((p) => formatPeriod(p.start_date, p.end_date)).join(', ')
            : '-';
        rows.push({
          key: `${emp.emp_no}-${rr.rr_id}`,
          empName: emp.emp_name,
          deptName: emp.dept_name,
          positionName: emp.position_name,
          rrTitle: rr.title,
          periods: periodText,
          isFirstRr: idx === 0,
          rrCount: emp.rr_list.length,
        });
      });
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[18%]">팀원명</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[18%]">부서명</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[12%]">직책</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[32%]">R&R 명</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[20%]">수행 기간</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3 font-medium text-gray-900">{row.empName}</td>
              <td className="px-5 py-3 text-gray-600">{row.deptName}</td>
              <td className="px-5 py-3">
                <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                  {row.positionName}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-700 line-clamp-1">{row.rrTitle}</td>
              <td className="px-5 py-3 text-gray-500 text-xs">{row.periods}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
