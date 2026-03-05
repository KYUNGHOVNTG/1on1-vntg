/**
 * 팀원 정보 헤더 컴포넌트 (사전 준비 모달용)
 *
 * 팀원 이름, 직책, 부서 및 총 미팅 횟수를 표시합니다.
 */

import { User, MessageSquare } from 'lucide-react';
import type { MemberInfo } from '../types';

interface MemberInfoHeaderProps {
  memberInfo: MemberInfo;
  totalMeetingCount: number;
  isFirstMeeting: boolean;
}

export function MemberInfoHeader({
  memberInfo,
  totalMeetingCount,
  isFirstMeeting,
}: MemberInfoHeaderProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#F9FAFB] rounded-2xl border border-gray-200">
      {/* 아바타 */}
      <div className="w-12 h-12 rounded-xl bg-[#4950DC]/10 flex items-center justify-center shrink-0">
        <User size={22} className="text-[#4950DC]" />
      </div>

      {/* 팀원 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900">{memberInfo.emp_name}</h3>
          <span className="text-sm text-gray-500">{memberInfo.position_name}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{memberInfo.dept_name}</p>
      </div>

      {/* 미팅 횟수 */}
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1.5 text-gray-500">
          <MessageSquare size={14} />
          <span className="text-xs">
            {isFirstMeeting ? (
              <span className="text-[#4950DC] font-semibold">첫 번째 미팅</span>
            ) : (
              <>
                총{' '}
                <span className="font-semibold text-gray-900">{totalMeetingCount}</span>
                회
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
