/**
 * MyRnrSimpleGrid Component
 *
 * 나의 R&R 간단히 보기 컴포넌트
 * R&R 명 / 상위 R&R / 수행 기간을 테이블 형식으로 간결하게 표시합니다.
 */

import React from 'react';
import { ClipboardList, Loader2, Network } from 'lucide-react';
import type { RrItem } from '../types';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

interface MyRnrSimpleGridProps {
  items: RrItem[];
  isLoading: boolean;
  onRegisterClick: () => void;
}

function formatPeriod(startDate: string, endDate: string): string {
  const sy = startDate.substring(0, 4);
  const sm = startDate.substring(4, 6);
  const ey = endDate.substring(0, 4);
  const em = endDate.substring(4, 6);
  return `${sy}.${sm} ~ ${ey}.${em}`;
}

export const MyRnrSimpleGrid: React.FC<MyRnrSimpleGridProps> = ({
  items,
  isLoading,
  onRegisterClick,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#4950DC] animate-spin mb-4" />
        <p className="text-sm text-gray-500">나의 R&R 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6">
        <EmptyState
          icon={ClipboardList}
          title="등록된 R&R이 없습니다"
          description="새 R&R을 등록하여 역할과 책임을 정의해보세요"
          action={{
            label: '+ 등록하기',
            onClick: onRegisterClick,
            variant: 'primary',
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[40%]">R&R 명</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[30%]">상위 R&R</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-600 w-[30%]">수행 기간</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((rr) => (
            <tr key={rr.rr_id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5">
                <span className="font-medium text-gray-900 line-clamp-1">{rr.title}</span>
              </td>
              <td className="px-5 py-3.5">
                {rr.parent_title ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    <Network className="w-3 h-3" />
                    {rr.parent_title}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">없음</span>
                )}
              </td>
              <td className="px-5 py-3.5">
                {rr.periods.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {rr.periods.map((p) => (
                      <span key={p.seq} className="text-gray-600 text-xs">
                        {formatPeriod(p.start_date, p.end_date)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">기간 없음</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
