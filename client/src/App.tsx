import { useState, useEffect } from 'react';
import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';
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

  return (
    <>
      {/* 전역 로딩 오버레이 */}
      <LoadingOverlay />

      {/* 라우팅: 로그인 vs 대시보드 */}
      {isAuthenticated ? (
        <MainLayout>
          <DashboardPage />
        </MainLayout>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
