import { LoadingOverlay } from './core/loading';
import { LoginPage } from './domains/auth';

function App() {
  return (
    <>
      {/* 전역 로딩 오버레이 */}
      <LoadingOverlay />

      {/* Google 로그인 화면 */}
      <LoginPage />
    </>
  );
}

export default App;
