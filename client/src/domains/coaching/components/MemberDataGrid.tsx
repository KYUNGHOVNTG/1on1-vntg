/**
 * 팀원 목록 그리드 컴포넌트
 *
 * 팀원별 면담 현황을 테이블 형태로 표시합니다.
 * - 면담 상태 뱃지 색상 구분
 * - 마지막 면담일, 총 면담 횟수 표시
 * - [미팅 시작] 버튼
 */

import { Users, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/core/ui/EmptyState';
import { MeetingStatusBadge } from './MeetingStatusBadge';
import { StartMeetingButton } from './StartMeetingButton';
import type { DashboardMemberItem } from '../types';

interface MemberDataGridProps {
  items: DashboardMemberItem[];
  onMeetingCreated: (meetingId: string, memberEmpNo: string) => void;
}

function formatLastMeetingDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function MemberDataGrid({ items, onMeetingCreated }: MemberDataGridProps) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="팀원이 없습니다"
        description="조건에 맞는 팀원이 없습니다. 검색 조건을 변경해보세요."
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500">이름</span>
        <span className="text-xs font-semibold text-gray-500">부서</span>
        <span className="text-xs font-semibold text-gray-500">면담 상태</span>
        <span className="text-xs font-semibold text-gray-500">마지막 면담일</span>
        <span className="text-xs font-semibold text-gray-500 text-center">총 면담 횟수</span>
        <span className="text-xs font-semibold text-gray-500">액션</span>
      </div>

      {/* 테이블 바디 */}
      <div className="divide-y divide-gray-50">
        {items.map((member) => (
          <div
            key={member.emp_no}
            className="grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors"
          >
            {/* 이름 + 사번 */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#4950DC]/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-[#4950DC]">
                  {member.emp_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{member.emp_name}</p>
                <p className="text-xs text-gray-400">{member.emp_no}</p>
              </div>
            </div>

            {/* 부서 */}
            <span className="text-sm text-gray-600 truncate">{member.dept_name}</span>

            {/* 면담 상태 뱃지 */}
            <div>
              <MeetingStatusBadge status={member.meeting_status} />
            </div>

            {/* 마지막 면담일 */}
            <span className="text-sm text-gray-600">
              {formatLastMeetingDate(member.last_meeting_date)}
            </span>

            {/* 총 면담 횟수 */}
            <div className="flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">
                {member.total_meeting_count}
                <span className="text-xs font-normal text-gray-400 ml-0.5">회</span>
              </span>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {/* 히스토리 보기 버튼 */}
              {member.total_meeting_count > 0 && (
                <button
                  type="button"
                  onClick={() => navigate(`/coaching/members/${member.emp_no}`)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all"
                  title="면담 히스토리 보기"
                >
                  <History size={16} />
                </button>
              )}

              {/* 미팅 시작 버튼 */}
              <StartMeetingButton
                memberEmpNo={member.emp_no}
                memberName={member.emp_name}
                onMeetingCreated={onMeetingCreated}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
