/**
 * 미팅 시작 버튼 컴포넌트
 *
 * 팀원 그리드의 각 행에 표시되는 [미팅 시작] 버튼입니다.
 * 클릭 시 POST /meetings 호출 → 사전 준비 모달 오픈 (Task 10 구현)
 * 현재는 모달 없이 meeting_id 생성만 처리합니다.
 */

import { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { createMeeting } from '../api';

interface StartMeetingButtonProps {
  memberEmpNo: string;
  memberName: string;
  onMeetingCreated: (meetingId: string, memberEmpNo: string) => void;
}

export function StartMeetingButton({
  memberEmpNo,
  memberName,
  onMeetingCreated,
}: StartMeetingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await createMeeting({ member_emp_no: memberEmpNo });
      onMeetingCreated(response.meeting_id, memberEmpNo);
    } catch (err) {
      console.error(`미팅 생성 실패 (${memberName}):`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
        'bg-[#4950DC] hover:bg-[#3840C5] text-white shadow-sm',
        isLoading && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Play size={14} />
      {isLoading ? '생성 중...' : '미팅 시작'}
    </button>
  );
}
