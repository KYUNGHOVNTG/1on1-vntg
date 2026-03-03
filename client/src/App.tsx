import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';

import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';
import { logout as logoutAPI, getCurrentUser } from './domains/auth/api';
import { DashboardPage } from './domains/dashboard';
import { CodeManagementPage } from './domains/common';
import { MenuManagementPage } from './domains/menu';
import { PermissionManagementPage } from './domains/permission';
import { ComponentShowcasePage } from './domains/system/pages/ComponentShowcasePage';
import { EmployeeListPage, OrgChartPage, DepartmentDetailPage, SyncManagementPage } from './domains/hr';
import { MyRnrPage, TeamRnrStatusPage } from './domains/rnr';
import { MainLayout } from './core/layout';
import { useAuthStore } from './core/store/useAuthStore';
import { useActivityTracker } from './core/hooks';
import { IdleTimeoutModal } from './core/components/IdleTimeoutModal';

function App() {
  // useAuthStore에서 인증 상태 가져오기
  const { isAuthenticated, logout: logoutStore } = useAuthStore();

  // 세션 검증 중 상태
  const [isValidatingSession, setIsValidatingSession] = useState(true);

  // 검증 완료 여부 (초기 로드 시 한 번만 실행)
  const validationDone = useRef(false);

  // Idle timeout 경고 모달 상태
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // 로그아웃 핸들러
  const handleLogout = useCallback(async () => {
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

      // 다음 로그인 시 검증 다시 수행할 수 있도록 리셋
      validationDone.current = false;

      console.log('✅ 로그아웃 완료');
    }
  }, [logoutStore]);

  /**
   * 세션 유효성 검증
   * 서버에 /auth/me API를 호출하여 현재 세션이 유효한지 확인합니다.
   * 세션이 폐기되었으면 401 에러가 발생하고 client.ts의 interceptor에서 로그아웃 처리됩니다.
   */
  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('access_token');

    // 토큰이 없으면 검증 불필요
    if (!token) {
      console.log('🔍 토큰 없음 - 세션 검증 스킵');
      setIsValidatingSession(false);
      return;
    }

    try {
      console.log('🔄 세션 유효성 검증 중...');
      await getCurrentUser();
      console.log('✅ 세션 유효성 검증 완료 - 세션 유효');
    } catch (error: any) {
      // 401 에러는 client.ts의 interceptor에서 이미 처리됨 (toast + redirect)
      // 하지만 네트워크 오류 등 401이 아닌 에러가 발생한 경우 여기서 로그아웃 처리
      console.log('❌ 세션 유효성 검증 실패 (강제 로그아웃):', error);

      // 네트워크 에러 등 401 외의 에러 발생 시에도 안전하게 로그아웃 처리
      // (인터셉터에서 처리되지 않은 경우를 대비)
      toast.error('세션 검증에 실패하여 로그아웃됩니다.');
      handleLogout();
    } finally {
      setIsValidatingSession(false);
    }
  }, [handleLogout]);

  // Activity Tracker 설정
  const { keepAlive } = useActivityTracker({
    enabled: isAuthenticated,
    onIdleWarning: () => {
      console.log('⚠️ Idle warning - 모달 표시');
      setShowIdleWarning(true);
    },
    onIdleTimeout: () => {
      console.log('⏰ Idle timeout - 자동 로그아웃');
      setShowIdleWarning(false);
      handleLogout();
    },
  });

  // "계속 사용" 버튼 핸들러
  const handleKeepAlive = useCallback(() => {
    console.log('✅ 계속 사용 - Heartbeat 전송');
    setShowIdleWarning(false);
    keepAlive();
  }, [keepAlive]);

  // 앱 초기화 시 세션 검증
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
      setIsValidatingSession(false);
    } else if (sessionExpired === 'true') {
      // 일반 세션 만료
      toast.error('세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.');
      sessionStorage.removeItem('session_expired');
      logoutStore();
      setIsValidatingSession(false);
    } else if (isAuthenticated && token && !validationDone.current && !code) {
      // 인증된 상태이고 토큰이 있으면 서버에서 세션 유효성 검증
      // OAuth 콜백 처리 중(code가 있는 경우)에는 스킵
      validationDone.current = true;
      validateSession();
    } else {
      // 인증되지 않았거나 OAuth 콜백 처리 중이면 검증 스킵
      setIsValidatingSession(false);
    }
  }, [isAuthenticated, logoutStore, validateSession]);

  // 로그인 성공 핸들러
  const handleLoginSuccess = () => {
    console.log('✅ 로그인 성공! 대시보드로 이동');
    // useAuthStore에서 이미 상태가 변경되어 자동으로 리렌더링됨
    validationDone.current = true; // 로그인 직후에는 검증 스킵
    setIsValidatingSession(false);
  };

  // 세션 검증 중일 때는 로딩 표시
  if (isValidatingSession && isAuthenticated) {
    return (
      <>
        <LoadingOverlay />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <Router>
      {/* 전역 로딩 오버레이 */}
      <LoadingOverlay />

      {/* Idle Timeout 경고 모달 */}
      <IdleTimeoutModal
        isOpen={showIdleWarning}
        onKeepAlive={handleKeepAlive}
        remainingSeconds={60}
      />

      {/* 라우팅: 로그인 vs 인증된 레이아웃 */}
      {isAuthenticated ? (
        <MainLayout onLogout={handleLogout}>
          <Toaster richColors position="top-center" />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/hr/employees" element={<EmployeeListPage />} />
            <Route path="/hr/org-chart" element={<OrgChartPage />} />
            <Route path="/hr/departments/:deptCode" element={<DepartmentDetailPage />} />
            <Route path="/hr/sync" element={<SyncManagementPage />} />
            <Route path="/goals/myRnr" element={<MyRnrPage />} />
            <Route path="/goals/teamRnr" element={<TeamRnrStatusPage />} />
            <Route path="/system/codes" element={<CodeManagementPage />} />
            <Route path="/system/menus" element={<MenuManagementPage />} />
            <Route path="/system/permissions" element={<PermissionManagementPage />} />
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
