/**
 * Idle Timeout 경고 모달
 *
 * 14분 idle 시 표시되며, 사용자에게 1분 후 자동 로그아웃됨을 알립니다.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface IdleTimeoutModalProps {
    /** 모달 표시 여부 */
    isOpen: boolean;
    /** "계속 사용" 버튼 클릭 핸들러 */
    onKeepAlive: () => void;
    /** 남은 시간 (초) */
    remainingSeconds?: number;
}

export function IdleTimeoutModal({
    isOpen,
    onKeepAlive,
    remainingSeconds = 60,
}: IdleTimeoutModalProps) {
    const [countdown, setCountdown] = useState(remainingSeconds);

    // 카운트다운
    useEffect(() => {
        if (!isOpen) {
            setCountdown(remainingSeconds);
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, remainingSeconds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* 모달 컨텐츠 */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                {/* 아이콘 */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                </div>

                {/* 제목 */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                    세션 만료 예정
                </h2>

                {/* 내용 */}
                <p className="text-gray-600 text-center mb-2">
                    장시간 사용하지 않아 세션이 곧 만료됩니다.
                </p>
                <p className="text-gray-900 font-semibold text-center mb-6">
                    <span className="text-orange-600 text-3xl font-bold">{countdown}</span>초 후 자동
                    로그아웃됩니다.
                </p>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onKeepAlive}
                        className="flex-1 px-6 py-3 bg-[#4950DC] hover:bg-[#3840C5] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                    >
                        계속 사용
                    </button>
                </div>

                {/* 안내 문구 */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    "계속 사용"을 클릭하면 세션이 연장됩니다.
                </p>
            </div>
        </div>
    );
}
