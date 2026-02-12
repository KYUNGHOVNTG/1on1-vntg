/**
 * 동기화 이력 테이블 컴포넌트
 *
 * 동기화 실행 이력을 테이블 형태로 표시합니다.
 */

import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { SyncHistory } from '../types';

interface SyncHistoryTableProps {
  histories: SyncHistory[];
  loading: boolean;
}

export function SyncHistoryTable({ histories, loading }: SyncHistoryTableProps) {
  // =============================================
  // Helper Functions
  // =============================================
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSyncTypeLabel = (syncType: string) => {
    const labels: Record<string, string> = {
      employees: '직원',
      departments: '부서',
      org_tree: '조직도',
    };
    return labels[syncType] || syncType;
  };

  const getSyncStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      success: {
        label: '성공',
        className: 'bg-green-50 text-green-700',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      },
      failure: {
        label: '실패',
        className: 'bg-red-50 text-red-700',
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      partial: {
        label: '부분 성공',
        className: 'bg-orange-50 text-orange-700',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      },
      in_progress: {
        label: '진행 중',
        className: 'bg-blue-50 text-blue-700',
        icon: <Clock className="w-3.5 h-3.5" />,
      },
    };

    const badge = badges[status] || badges.failure;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${badge.className}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  // =============================================
  // Render
  // =============================================
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">동기화 이력을 불러오는 중...</p>
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">동기화 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              동기화 타입
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              전체/성공/실패
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              시작 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              종료 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              실행자
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {histories.map((history) => (
            <tr
              key={history.sync_id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                #{history.sync_id}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                  {getSyncTypeLabel(history.sync_type)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                {getSyncStatusBadge(history.sync_status)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">
                    {history.total_count}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-green-600">
                    {history.success_count}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-red-600">
                    {history.failure_count}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDateTime(history.sync_start_time)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {history.sync_end_time ? formatDateTime(history.sync_end_time) : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {history.in_user || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
