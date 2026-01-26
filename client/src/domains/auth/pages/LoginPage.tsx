/**
 * Google 로그인 페이지
 *
 * Google OAuth 로그인 버튼만 표시하는 메인 화면입니다.
 */

import { useState, useEffect } from 'react';
import { getGoogleAuthURL, handleGoogleCallback, completeForceLogin } from '../api';
import { useAuthStore } from '@/core/store/useAuthStore';
import { SessionConflictModal } from '../components/SessionConflictModal';
import type { SessionInfo } from '../types';

interface LoginPageProps {
  /** 로그인 성공 시 콜백 */
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // 동시접속 제어
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [existingSession, setExistingSession] = useState<SessionInfo | undefined>();
  const [pendingUserId, setPendingUserId] = useState<string | undefined>();

  // useAuthStore에서 setUser 가져오기
  const { setUser } = useAuthStore();

  // URL에서 authorization code를 확인하고 로그인 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // 이미 처리 중이거나 code가 없으면 무시
    if (!code || isProcessingCallback) {
      return;
    }

    // URL에서 code 즉시 제거 (중복 요청 방지)
    window.history.replaceState({}, document.title, '/');

    // 콜백 처리 시작 (code는 위에서 null 체크를 통과했으므로 string 타입 보장)
    setIsProcessingCallback(true);
    handleCallback(code as string);
  }, [isProcessingCallback]);

  /**
   * Google OAuth 콜백 처리
   */
  const handleCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await handleGoogleCallback({ code });

      // 동시접속 감지
      if (response.has_active_session && response.existing_session_info) {
        console.log('🔒 기존 활성 세션 감지:', response.existing_session_info);

        // 모달 표시를 위한 상태 설정
        setExistingSession(response.existing_session_info);
        setPendingUserId(response.user_id);
        setShowSessionConflict(true);
        setIsLoading(false);
        return;
      }

      if (response.success && response.access_token) {
        setLoginSuccess(true);
        setUserInfo({
          email: response.email,
          name: response.name,
        });

        // 전체 응답 로깅 (JWT 토큰 및 사용자 Context 확인)
        console.log('✅ Google 로그인 성공 - 전체 응답:', response);
        console.log('📋 사용자 정보:', {
          user_id: response.user_id,
          email: response.email,
          name: response.name,
          role: response.role,
          position: response.position,
          position_code: response.position_code,
        });
        console.log('🔑 JWT 토큰:', response.access_token);

        // 토큰 저장
        localStorage.setItem('access_token', response.access_token);

        // ✅ useAuthStore에 사용자 정보 저장
        if (response.user_id && response.email && response.name) {
          // position_code 확인 (백엔드에서 반드시 제공해야 함)
          const positionCode = response.position_code;

          if (!positionCode) {
            console.warn('⚠️ position_code가 백엔드 응답에 없습니다. fallback 사용:', response.position);
          }

          setUser({
            id: response.user_id,
            email: response.email,
            name: response.name,
            position_code: positionCode || response.position || 'P005', // fallback
          });

          console.log('✅ useAuthStore에 사용자 정보 저장:', {
            id: response.user_id,
            email: response.email,
            name: response.name,
            role: response.role,
            role_code: response.role_code,
            position: response.position,
            position_code: positionCode || response.position || 'P005',
          });
        }

        // 로그인 성공 콜백 호출 (2초 후 대시보드로 이동)
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 2000);
      } else {
        setError('로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('Google 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google 로그인 버튼 클릭 핸들러
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getGoogleAuthURL();
      window.location.href = response.auth_url;
    } catch (err) {
      console.error('Google OAuth URL 가져오기 실패:', err);
      setError('로그인을 시작할 수 없습니다.');
      setIsLoading(false);
    }
  };

  /**
   * 기존 세션 종료 후 강제 로그인
   * - 백엔드에서 임시 저장된 토큰으로 세션 폐기 후 즉시 로그인 완료
   * - 사용자가 다시 Google 로그인 화면을 거치지 않아도 됨
   */
  const handleForceLogin = async () => {
    if (!pendingUserId) {
      setError('로그인 정보가 없습니다.');
      setShowSessionConflict(false);
      return;
    }

    setIsLoading(true);
    setShowSessionConflict(false);

    try {
      // 기존 세션 폐기 + 임시 저장된 토큰으로 로그인 완료 (단일 API 호출)
      console.log('🔄 강제 로그인 시작:', pendingUserId);
      const response = await completeForceLogin({ user_id: pendingUserId });

      if (response.success && response.access_token) {
        // 로그인 성공 처리
        setLoginSuccess(true);
        setUserInfo({
          email: response.email,
          name: response.name,
        });

        console.log('✅ 강제 로그인 성공:', response);
        localStorage.setItem('access_token', response.access_token);

        if (response.user_id && response.email && response.name) {
          const positionCode = response.position_code;
          setUser({
            id: response.user_id,
            email: response.email,
            name: response.name,
            position_code: positionCode || response.position || 'P005',
          });

          console.log('✅ useAuthStore에 사용자 정보 저장:', {
            id: response.user_id,
            email: response.email,
            name: response.name,
            position_code: positionCode || response.position || 'P005',
          });
        }

        // 로그인 성공 콜백 호출 (2초 후 대시보드로 이동)
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 2000);
      } else {
        setError('강제 로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('강제 로그인 오류:', err);
      setError('기존 세션 종료 중 오류가 발생했습니다. 다시 로그인해 주세요.');
      setIsLoading(false);
    } finally {
      setPendingUserId(undefined);
      setExistingSession(undefined);
    }
  };

  /**
   * 세션 충돌 모달 닫기
   */
  const handleCancelSessionConflict = () => {
    setShowSessionConflict(false);
    setPendingUserId(undefined);
    setExistingSession(undefined);
  };

  // 로그인 성공 화면
  if (loginSuccess && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인 성공</h1>

            <div className="mt-6 space-y-3">
              {userInfo.name && (
                <div className="text-left bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">이름</p>
                  <p className="text-base font-medium text-gray-900">{userInfo.name}</p>
                </div>
              )}

              {userInfo.email && (
                <div className="text-left bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">이메일</p>
                  <p className="text-base font-medium text-gray-900">{userInfo.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 화면
  return (
    <>
      {/* 동시접속 확인 모달 */}
      <SessionConflictModal
        isOpen={showSessionConflict}
        onClose={handleCancelSessionConflict}
        onForceLogin={handleForceLogin}
        sessionInfo={existingSession}
      />

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* 상단 제목 영역 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">1on1-Mirror</h1>
        <p className="text-gray-600">성과 관리를 위한 새로운 기준</p>
      </div>

      {/* 로그인 카드 */}
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">로그인</h2>
          <p className="text-gray-600 text-sm text-center">서비스를 이용하려면 로그인이 필요합니다.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>로그인 중...</span>
            </>
          ) : (
            <>
              {/* Google 로고 SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google 계정으로 계속하기</span>
            </>
          )}
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
        <button
          onClick={() => {
            // TODO: 이용약관 페이지로 이동
            console.log('이용약관 클릭');
          }}
          className="hover:text-gray-900 transition-colors"
        >
          이용약관
        </button>
        <span className="text-gray-400">|</span>
        <button
          onClick={() => {
            // TODO: 개인정보처리방침 페이지로 이동
            console.log('개인정보처리방침 클릭');
          }}
          className="hover:text-gray-900 transition-colors"
        >
          개인정보처리방침
        </button>
        <span className="text-gray-400">|</span>
        <button
          onClick={() => {
            // TODO: 도움말 페이지로 이동
            console.log('도움말 클릭');
          }}
          className="hover:text-gray-900 transition-colors"
        >
          도움말
        </button>
      </div>
      </div>
    </>
  );
};
