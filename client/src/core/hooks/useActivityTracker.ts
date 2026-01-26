/**
 * Activity Tracker Hook
 *
 * 사용자 활동을 감지하고 주기적으로 Heartbeat를 전송하여 세션을 유지합니다.
 * 14분 idle 시 경고 모달을 표시하고, 15분 idle 시 자동 로그아웃합니다.
 */

import { useEffect, useRef, useCallback } from 'react';
import { sendHeartbeat } from '@/domains/auth/api';
import { toast } from 'sonner';

interface UseActivityTrackerOptions {
    /** Heartbeat 전송 간격 (밀리초, 기본 60초) */
    heartbeatInterval?: number;
    /** Idle 경고 시간 (밀리초, 기본 14분) */
    warningTime?: number;
    /** Idle timeout 시간 (밀리초, 기본 15분) */
    idleTimeout?: number;
    /** Idle 경고 콜백 */
    onIdleWarning?: () => void;
    /** Idle timeout 콜백 (자동 로그아웃) */
    onIdleTimeout?: () => void;
    /** 활성화 여부 (로그인 상태에서만 활성화) */
    enabled?: boolean;
}

export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
    const {
        heartbeatInterval = 60 * 1000, // 1분
        warningTime = 14 * 60 * 1000,
        // warningTime = 10 * 1000, // 테스트: 10초
        idleTimeout = 15 * 60 * 1000, // 15분
        // idleTimeout = 70 * 1000, // 테스트: 70초 (warningTime + 60초)
        onIdleWarning,
        onIdleTimeout,
        enabled = true,
    } = options;

    // 마지막 활동 시간
    const lastActivityRef = useRef<number>(Date.now());
    // 마지막 Heartbeat 전송 시간
    const lastHeartbeatRef = useRef<number>(Date.now());
    // Heartbeat 체크 타이머
    const heartbeatCheckTimerRef = useRef<number | null>(null);
    // Idle 체크 타이머
    const idleCheckTimerRef = useRef<number | null>(null);
    // 경고 표시 여부
    const warningShownRef = useRef<boolean>(false);

    /**
     * 활동 시간 업데이트
     */
    const updateActivity = useCallback(() => {
        const now = Date.now();
        lastActivityRef.current = now;
        warningShownRef.current = false; // 활동 시 경고 리셋
        console.log('🎯 사용자 활동 감지:', new Date(now).toLocaleTimeString());
    }, []);

    /**
     * Heartbeat 전송 (활동이 있었을 때만)
     */
    const sendHeartbeatRequest = useCallback(async () => {
        if (!enabled) return;

        // 경고 모달이 떠있는 경우 Heartbeat 전송 중단 (명시적 연장 필요)
        if (warningShownRef.current) {
            console.log('⚠️ 경고 모달 표시 중 - Heartbeat 전송 중단');
            return;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;

        // 마지막 Heartbeat 이후 1분이 지나지 않았으면 스킵
        if (timeSinceLastHeartbeat < heartbeatInterval) {
            return;
        }

        // 마지막 활동 이후 1분 이내에 활동이 있었으면 Heartbeat 전송
        if (timeSinceLastActivity < heartbeatInterval) {
            try {
                await sendHeartbeat();
                lastHeartbeatRef.current = now;
                console.log('💓 Heartbeat 전송 성공:', new Date(now).toLocaleTimeString());
            } catch (error) {
                console.error('❌ Heartbeat 전송 실패:', error);
                // 401 에러는 client.ts의 interceptor에서 처리됨
            }
        } else {
            console.log('⏸️ 활동 없음 - Heartbeat 전송 스킵');
        }
    }, [enabled, heartbeatInterval]);

    /**
     * Idle 상태 체크
     */
    const checkIdleStatus = useCallback(() => {
        if (!enabled) return;

        const now = Date.now();
        const idleTime = now - lastActivityRef.current;

        // 15분 idle 시 자동 로그아웃
        if (idleTime >= idleTimeout) {
            console.warn('⏰ Idle timeout - 자동 로그아웃');
            toast.warning('장시간 사용하지 않아 자동 로그아웃되었습니다');
            onIdleTimeout?.();
            return;
        }

        // 14분 idle 시 경고
        if (idleTime >= warningTime && !warningShownRef.current) {
            console.warn('⚠️ Idle warning - 1분 후 자동 로그아웃');
            warningShownRef.current = true;
            onIdleWarning?.();
        }
    }, [enabled, idleTimeout, warningTime, onIdleWarning, onIdleTimeout]);

    /**
     * 활동 이벤트 핸들러
     */
    useEffect(() => {
        if (!enabled) return;

        // 감지할 이벤트 목록
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // 쓰로틀링을 위한 플래그
        let throttleTimeout: number | null = null;

        const handleActivity = () => {
            // 경고 모달이 떠있는 경우 활동 감지 무시 (명시적 연장만 허용)
            // "계속 사용" 버튼을 눌러야만 해제됨
            if (warningShownRef.current) return;

            // 1초 쓰로틀링 (과도한 업데이트 방지)
            if (throttleTimeout) return;

            updateActivity();

            throttleTimeout = setTimeout(() => {
                throttleTimeout = null;
            }, 1000);
        };

        // 이벤트 리스너 등록
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        console.log('👂 활동 감지 리스너 등록됨');

        // 정리
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (throttleTimeout) {
                clearTimeout(throttleTimeout);
            }
            console.log('👋 활동 감지 리스너 제거됨');
        };
    }, [enabled, updateActivity]);

    /**
     * Heartbeat 주기적 체크 (10초마다)
     * 활동이 있었는지 확인하고 필요시 Heartbeat 전송
     */
    useEffect(() => {
        if (!enabled) return;

        // 초기 Heartbeat 전송
        sendHeartbeatRequest();

        // 10초마다 Heartbeat 전송 여부 체크
        heartbeatCheckTimerRef.current = setInterval(() => {
            sendHeartbeatRequest();
        }, 10 * 1000); // 10초마다 체크

        return () => {
            if (heartbeatCheckTimerRef.current) {
                clearInterval(heartbeatCheckTimerRef.current);
            }
        };
    }, [enabled, sendHeartbeatRequest]);

    /**
     * Idle 상태 주기적 체크
     */
    useEffect(() => {
        if (!enabled) return;

        // 10초마다 idle 상태 체크
        idleCheckTimerRef.current = setInterval(() => {
            checkIdleStatus();
        }, 10 * 1000);

        return () => {
            if (idleCheckTimerRef.current) {
                clearInterval(idleCheckTimerRef.current);
            }
        };
    }, [enabled, checkIdleStatus]);

    /**
     * 수동으로 Heartbeat 전송 (경고 모달에서 "계속 사용" 클릭 시)
     */
    const keepAlive = useCallback(async () => {
        const now = Date.now();
        updateActivity();

        // 즉시 Heartbeat 전송
        try {
            await sendHeartbeat();
            lastHeartbeatRef.current = now;
            console.log('✅ 수동 Heartbeat 전송 성공 (계속 사용)');
        } catch (error) {
            console.error('❌ 수동 Heartbeat 전송 실패:', error);
        }

        warningShownRef.current = false;
    }, [updateActivity]);

    return {
        keepAlive,
    };
}
