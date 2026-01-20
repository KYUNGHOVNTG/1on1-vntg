import { useState, useEffect } from 'react';
import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';
import { logout as logoutAPI } from './domains/auth/api';
import { DashboardPage } from './domains/dashboard';
import { MainLayout } from './core/layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 로그인 상태 확인 (URL에서 code 파라미터가 있으면 콜백 처리 중)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // 로컬 스토리지에서 인증 토큰 확인
    const token = localStorage.getItem('access_token');

    if (token && !code) {
      setIsAuthenticated(true);
    }
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 (선택적)
      await logoutAPI();
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 실패해도 클라이언트 측 로그아웃은 진행
    } finally {
      // localStorage에서 토큰 제거
      localStorage.removeItem('access_token');

      // 인증 상태 초기화
      setIsAuthenticated(false);
    }
  };

  return (
    <>
      {/* 전역 로딩 오버레이 */}
      <LoadingOverlay />

      {/* 라우팅: 로그인 vs 대시보드 */}
      {isAuthenticated ? (
        <MainLayout onLogout={handleLogout}>
          <DashboardPage />
        </MainLayout>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
