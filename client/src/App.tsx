import { useEffect } from 'react';
import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';
import { logout as logoutAPI } from './domains/auth/api';
import { DashboardPage } from './domains/dashboard';
import { MainLayout } from './core/layout';
import { useAuthStore } from './core/store/useAuthStore';

function App() {
  // useAuthStore에서 인증 상태 가져오기
  const { isAuthenticated, logout: logoutStore } = useAuthStore();

  // 로그인 상태 확인 (URL에서 code 파라미터가 있으면 콜백 처리 중)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // 로컬 스토리지에 access_token이 있는지 확인 (추가 검증용)
    const token = localStorage.getItem('access_token');

    console.log('🔍 App 초기화:', { isAuthenticated, hasToken: !!token, hasCode: !!code });
  }, [isAuthenticated]);

  // 로그인 성공 핸들러
  const handleLoginSuccess = () => {
    console.log('✅ 로그인 성공! 대시보드로 이동');
    // useAuthStore에서 이미 상태가 변경되어 자동으로 리렌더링됨
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

      // useAuthStore 상태 초기화
      logoutStore();

      console.log('✅ 로그아웃 완료');
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
