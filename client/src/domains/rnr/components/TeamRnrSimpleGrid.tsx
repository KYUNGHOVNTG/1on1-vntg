/**
 * TeamRnrSimpleGrid Component
 *
 * 팀 R&R 현황 간단히 보기
 * - 성명(사원별 MERGE), 부서명, R&R명, 수행일정(가로막대 그래프)
 * - 수행일정: 월을 숫자로 상단에 표시
 * - 사람마다 다른 색상 막대 사용
 */

import React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { TeamRrEmployeeItem, RrPeriod } from '../types';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

interface TeamRnrSimpleGridProps {
  items: TeamRrEmployeeItem[];
  isLoading: boolean;
  year: string;
}

// 사람마다 다른 색상 팔레트 (첨부 이미지 참고: 파란계열, 초록계열, 보라계열 등)
const PERSON_COLORS = [
  '#6EA8FE', // 파란색 (라이트)
  '#3DDC84', // 초록색 (민트)
  '#C084FC', // 보라색 (라벤더)
  '#FDBA74', // 주황색 (피치)
  '#67E8F9', // 하늘색 (시안)
  '#86EFAC', // 연두색
  '#FCA5A5', // 분홍빛 빨강
  '#A5B4FC', // 인디고 라이트
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TOTAL_MONTHS = 12;

/**
 * 수행 기간을 가로막대 그래프로 렌더링
 */
interface GanttBarProps {
  periods: RrPeriod[];
  year: string;
  color: string;
}

const GanttBar: React.FC<GanttBarProps> = ({ periods, year, color }) => {
  const bars = periods
    .map((period) => {
      const startYear = period.start_date.substring(0, 4);
      const endYear = period.end_date.substring(0, 4);

      // 조회 연도와 무관한 기간 제외
      if (startYear > year || endYear < year) return null;

      let startMonth = parseInt(period.start_date.substring(4, 6), 10);
      let endMonth = parseInt(period.end_date.substring(4, 6), 10);

      // 연도 걸치는 경우 보정
      if (startYear < year) startMonth = 1;
      if (endYear > year) endMonth = 12;

      const span = endMonth - startMonth + 1;
      if (span <= 0) return null;

      const leftPct = ((startMonth - 1) / TOTAL_MONTHS) * 100;
      const widthPct = (span / TOTAL_MONTHS) * 100;

      return { key: period.seq, leftPct, widthPct };
    })
    .filter(Boolean);

  return (
    <div className="relative w-full h-5">
      {bars.map((bar) =>
        bar ? (
          <div
            key={bar.key}
            className="absolute top-1/2 -translate-y-1/2 h-4 rounded-sm"
            style={{
              left: `${bar.leftPct}%`,
              width: `${bar.widthPct}%`,
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        ) : null,
      )}
    </div>
  );
};

/**
 * 수행일정 헤더 (월 숫자 표시)
 */
const ScheduleHeader: React.FC = () => (
  <div className="relative w-full flex">
    {MONTHS.map((m) => (
      <div
        key={m}
        className="flex-1 text-center text-[10px] text-gray-400 font-medium leading-none"
      >
        {m}
      </div>
    ))}
  </div>
);

export const TeamRnrSimpleGrid: React.FC<TeamRnrSimpleGridProps> = ({
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

  // 팀원별 Row 평탄화: 사람별로 색상 할당
  const rows: Array<{
    key: string;
    empName: string;
    deptName: string;
    rrTitle: string;
    rrContent: string | null;
    periods: RrPeriod[];
    isFirstRr: boolean;
    rrCount: number;
    color: string;
    isLastRr: boolean;
  }> = [];

  items.forEach((emp, empIdx) => {
    const color = PERSON_COLORS[empIdx % PERSON_COLORS.length];

    if (emp.rr_list.length === 0) {
      rows.push({
        key: `${emp.emp_no}-empty`,
        empName: emp.emp_name,
        deptName: emp.dept_name,
        rrTitle: '-',
        rrContent: null,
        periods: [],
        isFirstRr: true,
        rrCount: 0,
        color,
        isLastRr: true,
      });
    } else {
      emp.rr_list.forEach((rr, idx) => {
        rows.push({
          key: `${emp.emp_no}-${rr.rr_id}`,
          empName: emp.emp_name,
          deptName: emp.dept_name,
          rrTitle: rr.title,
          rrContent: rr.content,
          periods: rr.periods,
          isFirstRr: idx === 0,
          rrCount: emp.rr_list.length,
          color,
          isLastRr: idx === emp.rr_list.length - 1,
        });
      });
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '50%' }} />
        </colgroup>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">
              성명
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">
              부서명
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">
              R&R 명
            </th>
            <th className="px-4 py-2 font-semibold text-gray-600 text-xs">
              <div className="mb-1 text-gray-500">수행 일정 ({year})</div>
              <ScheduleHeader />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            // 사람 사이 구분선
            const showTopBorder = rowIdx > 0 && rows[rowIdx - 1].empName !== row.empName;

            return (
              <tr
                key={row.key}
                className={`hover:bg-gray-50/60 transition-colors ${showTopBorder ? 'border-t-2 border-gray-200' : 'border-t border-gray-100'
                  }`}
              >
                {/* 성명 (사원 첫 번째 R&R에만 표시 — MERGE 효과) */}
                <td
                  className="px-4 py-3 align-top"
                  style={{ verticalAlign: 'top' }}
                >
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

                {/* R&R 명 + 내용 */}
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-800 text-sm leading-snug line-clamp-2">
                    {row.rrTitle}
                  </div>
                  {row.rrContent && (
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {row.rrContent}
                    </div>
                  )}
                </td>

                {/* 수행 일정 (가로 막대 그래프) */}
                <td className="px-4 py-3 align-middle">
                  {row.periods.length > 0 ? (
                    <GanttBar periods={row.periods} year={year} color={row.color} />
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
