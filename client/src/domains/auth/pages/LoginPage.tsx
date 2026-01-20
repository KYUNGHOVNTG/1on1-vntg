/**
 * Google 로그인 페이지
 *
 * Google OAuth 로그인 버튼만 표시하는 메인 화면입니다.
 */

import { useState, useEffect } from 'react';
import { getGoogleAuthURL, handleGoogleCallback } from '../api';

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

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

    // 콜백 처리 시작
    setIsProcessingCallback(true);
    handleCallback(code);
  }, [isProcessingCallback]);

  /**
   * Google OAuth 콜백 처리
   */
  const handleCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await handleGoogleCallback({ code });

      if (response.success) {
        setLoginSuccess(true);
        setUserInfo({
          email: response.email,
          name: response.name,
        });

        console.log('✅ Google 로그인 성공:', {
          email: response.email,
          name: response.name,
        });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">환영합니다</h1>
          <p className="text-gray-600">Google 계정으로 로그인하세요</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>로그인 중...</span>
            </>
          ) : (
            <>
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
              <span>Google로 로그인</span>
            </>
          )}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Google OAuth 2.0을 사용한 안전한 로그인
        </p>
      </div>
    </div>
  );
};
