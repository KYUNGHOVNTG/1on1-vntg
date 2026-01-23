/**
 * SessionConflictModal Component
 *
 * 동시접속 감지 시 표시되는 모달
 * 기존 세션 정보를 보여주고 사용자가 선택할 수 있도록 합니다.
 *
 * @example
 * <SessionConflictModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onForceLogin={handleForceLogin}
 *   sessionInfo={existingSession}
 * />
 */

import React from 'react';
import { Monitor, Clock, MapPin } from 'lucide-react';
import { Modal } from '@/core/ui/Modal/Modal';
import type { SessionInfo } from '../types';

interface SessionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceLogin: () => void;
  sessionInfo?: SessionInfo;
}

/**
 * 날짜를 "YYYY년 MM월 DD일 HH:mm" 형식으로 포맷팅
 */
function formatDateTime(isoString?: string): string {
  if (!isoString) return '알 수 없음';

  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  } catch {
    return '알 수 없음';
  }
}

/**
 * User-Agent에서 브라우저 정보 추출
 */
function extractBrowserInfo(userAgent?: string): string {
  if (!userAgent) return '알 수 없는 디바이스';

  // 간단한 브라우저 감지
  if (userAgent.includes('Chrome')) return 'Chrome 브라우저';
  if (userAgent.includes('Firefox')) return 'Firefox 브라우저';
  if (userAgent.includes('Safari')) return 'Safari 브라우저';
  if (userAgent.includes('Edge')) return 'Edge 브라우저';

  return '알 수 없는 브라우저';
}

export const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  isOpen,
  onClose,
  onForceLogin,
  sessionInfo,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
          >
            취소
          </button>
          <button
            onClick={onForceLogin}
            className="px-5 py-2.5 bg-[#4950DC] hover:bg-[#3840C5] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            기존 세션 종료하고 로그인
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 제목 */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            다른 기기에서 로그인 중입니다
          </h3>
          <p className="text-sm text-gray-600">
            이미 다른 곳에서 로그인되어 있습니다. 계속 진행하시면 기존 세션이 종료됩니다.
          </p>
        </div>

        {/* 세션 정보 */}
        {sessionInfo && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900">기존 세션 정보</h4>

            {/* 디바이스 정보 */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                <Monitor className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">디바이스</p>
                <p className="text-sm text-gray-900 font-medium truncate">
                  {extractBrowserInfo(sessionInfo.device_info)}
                </p>
              </div>
            </div>

            {/* 로그인 시간 */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">로그인 시간</p>
                <p className="text-sm text-gray-900 font-medium">
                  {formatDateTime(sessionInfo.created_at)}
                </p>
              </div>
            </div>

            {/* IP 주소 */}
            {sessionInfo.ip_address && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">IP 주소</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {sessionInfo.ip_address}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 경고 메시지 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800">
            기존 세션을 종료하면 다른 기기에서 자동으로 로그아웃됩니다.
          </p>
        </div>
      </div>
    </Modal>
  );
};
