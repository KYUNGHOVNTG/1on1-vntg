# 🔐 세션 관리 및 Idle Timeout 시스템 가이드

이 문서는 프로젝트의 세션 관리 및 Idle Timeout(15분) 기능에 대한 기술 명세 및 가이드를 제공합니다.

---

## 🚀 1. 시스템 개요

사용자의 보안을 강화하고 서버 자원을 효율적으로 관리하기 위해 다음과 같은 기능을 구현하였습니다.
- **Idle Timeout**: 15분 동안 활동이 없을 경우 자동 로그아웃
- **세션 추적**: 마지막 활동 시간, IP 주소, 디바이스 정보를 DB에서 관리

---

## 🛠️ 2. 백엔드 구현 (Server)

### 2.1. 데이터 모델 (`RefreshToken`)
세션 관리를 위해 기존 `auth_refresh_token` 테이블을 확장하였습니다.
- **파일**: `server/app/domain/auth/models.py`
- **주요 컬럼**:
  - `last_activity_at`: 마지막 API 활동 시간 (Idle 체크용)
  - `device_info`: User-Agent 정보
  - `ip_address`: 접속 IP 주소
  - `revoked_yn`: 세션 폐기 여부 ('Y'일 경우 접속 차단)

### 2.2. 인증 의존성 (`get_current_user_id`)
모든 보호된 API 호출 시 세션 상태를 검증합니다.
- **파일**: `server/app/core/dependencies.py`
- **검증 로직**:
  1. JWT 토큰의 유효성 검사
  2. DB에서 `session_id`로 세션 존재 여부 확인
  3. `revoked_yn == 'Y'`인 경우 `SESSION_EXPIRED` 에러 반환
  4. `last_activity_at` 기준 15분 경과 시 `SESSION_IDLE_TIMEOUT` 에러 반환 후 세션 폐기
  5. 검증 성공 시 `last_activity_at`을 현재 시간으로 업데이트

### 2.3. 세션 서비스 및 라우터
- **파일**: `server/app/domain/auth/service.py`, `server/app/domain/auth/router.py`
- **주요 기능**:
  - **세션 생성**: 로그인 시 새로운 `RefreshToken` 레코드 생성
  - **Heartbeat**: 프론트엔드에서 주기적으로 활동을 알림 (`/session/heartbeat`)
  - **세션 정리**: 만료된 세션을 주기적으로 정리 (`/session/cleanup`)

---

## 🖥️ 3. 프론트엔드 구현 (Client)

### 3.1. API 인터셉터
- **파일**: `client/src/core/api/client.ts`
- **요청 인터셉터**: 모든 요청에 `Authorization: Bearer <token>` 헤더 자동 추가
- **응답 인터셉터**: 401 에러 발생 시 `error_code`를 분석하여 처리
  - `SESSION_IDLE_TIMEOUT`: "장시간 사용하지 않아 자동 로그아웃되었습니다" 알림 후 로그아웃
  - `SESSION_EXPIRED`: "세션이 만료되었습니다" 알림 후 로그아웃

### 3.2. 활동 추적 (`useActivityTracker`)
사용자의 입력을 감지하고 세션 유지를 관리합니다.
- **파일**: `client/src/core/hooks/useActivityTracker.ts`
- **동작**:
  - 마우스 이동, 클릭, 키보드 입력을 감지
  - 1분마다 서버에 Heartbeat 전송 (상태 유지)
  - 14분 동안 활동이 없으면 **IdleTimeoutModal** 표시
  - 15분 경과 시 자동 로그아웃 처리

### 3.3. 주요 UI 컴포넌트
- **IdleTimeoutModal**: `14분` 경과 시 나타나며, "계속 사용" 클릭 시 세션 연장
  - **파일**: `client/src/core/components/IdleTimeoutModal.tsx`

---

## 🔍 4. 주요 시나리오

### 4.1. Idle Timeout (15분)
1. 사용자가 14분간 아무런 조작을 하지 않음.
2. `IdleTimeoutModal`이 화면에 표시됨.
3. 1분 내에 "계속 사용"을 누르지 않으면 자동 로그아웃 및 로그인 페이지로 이동.

### 4.2. 다중 기기 로그인
여러 기기에서 동시 로그인이 가능합니다. 각 기기마다 독립적인 세션이 유지되며, Idle Timeout은 각 세션별로 적용됩니다.

---

## ⚡ 5. 성능 및 최적화

- **DB 인덱스**: `last_activity_at`에 인덱스를 생성하여 세션 정리 쿼리 성능 최적화
  - **인덱스**: `idx_refresh_token_cleanup` (Idle timeout 세션 정리용)
  - **파일**: `server/app/domain/auth/models.py`
- **Heartbeat 쓰로틀링**: 프론트엔드에서 1분 미만의 중복 Heartbeat 요청은 전송하지 않도록 제어

---

## 📝 6. 유지보수 가이드

- **Timeout 시간 변경**: 
  - 백엔드: `server/app/core/dependencies.py`의 `idle_minutes` 파라미터 수정
  - 프론트엔드: `client/src/core/hooks/useActivityTracker.ts`의 타임아웃 상수 수정
- **로그 확인**: 세션 폐기 및 만료 관련 로그는 서버 콘솔에서 `Auth` 도메인 로그를 통해 확인 가능합니다.
