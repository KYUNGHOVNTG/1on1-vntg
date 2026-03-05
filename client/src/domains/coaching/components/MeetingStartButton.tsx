/**
 * 미팅 시작 버튼 컴포넌트 (사전 준비 모달 내부용)
 *
 * [녹음과 함께 미팅 시작하기] 버튼입니다.
 * 마이크 권한이 없으면 비활성화되고 안내 메시지를 표시합니다.
 */

import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface MeetingStartButtonProps {
  isLoading: boolean;
  hasMicPermission: boolean | null;
  onStart: () => void;
}

export function MeetingStartButton({
  isLoading,
  hasMicPermission,
  onStart,
}: MeetingStartButtonProps) {
  const isDisabled = isLoading || hasMicPermission === false;
  const isMicDenied = hasMicPermission === false;

  return (
    <div className="space-y-2">
      {/* 마이크 권한 거부 안내 */}
      {isMicDenied && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl border border-red-200">
          <MicOff size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">
            마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해 주세요.
          </p>
        </div>
      )}

      {/* 시작 버튼 */}
      <button
        type="button"
        onClick={onStart}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all',
          !isDisabled
            ? 'bg-[#4950DC] hover:bg-[#3840C5] text-white shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Mic size={16} />
        {isLoading ? '미팅 시작 중...' : '녹음과 함께 미팅 시작하기'}
      </button>
    </div>
  );
}
