import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';
import { logout as logoutAPI } from './domains/auth/api';
import { DashboardPage } from './domains/dashboard';
import { CodeManagementPage } from './domains/common';
import { ComponentShowcasePage } from './domains/system/pages/ComponentShowcasePage';
import { MainLayout } from './core/layout';
import { useAuthStore } from './core/store/useAuthStore';

function App() {
  // useAuthStore에서 인증 상태 가져오기
  const { isAuthenticated, logout: logoutStore } = useAuthStore();

  // 로그인 상태 확인 및 세션 만료 알림
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // 로컬 스토리지에 access_token이 있는지 확인 (추가 검증용)
    const token = localStorage.getItem('access_token');

    console.log('🔍 App 초기화:', { isAuthenticated, hasToken: !!token, hasCode: !!code });

    // 세션 만료/폐기로 인한 로그아웃인 경우 알림 표시
    const sessionRevoked = sessionStorage.getItem('session_revoked');
    const sessionExpired = sessionStorage.getItem('session_expired');

    if (sessionRevoked === 'true') {
      // 다른 기기에서 로그인하여 세션이 종료된 경우
      toast.error('다른 기기에서 로그인하여 로그아웃되었습니다.');
      sessionStorage.removeItem('session_revoked');
      logoutStore();
    } else if (sessionExpired === 'true') {
      // 일반 세션 만료
      toast.error('세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.');
      sessionStorage.removeItem('session_expired');
      logoutStore();
    }
  }, [isAuthenticated, logoutStore]);

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
    <Router>
      {/* 전역 로딩 오버레이 */}
      <LoadingOverlay />

      {/* 라우팅: 로그인 vs 인증된 레이아웃 */}
      {isAuthenticated ? (
        <MainLayout onLogout={handleLogout}>
          <Toaster richColors position="top-center" />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/system/codes" element={<CodeManagementPage />} />
            <Route path="/system/components" element={<ComponentShowcasePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </Router>
  );
}

export default App;
