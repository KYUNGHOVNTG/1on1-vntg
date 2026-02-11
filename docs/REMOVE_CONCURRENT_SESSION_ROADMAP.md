# 🗑️ 동시접속 제어 기능 제거 로드맵

## 📋 목표

**동시접속 제어 기능만 제거**하고 **Idle Timeout 기능은 유지**합니다.

- ✅ 유지: Idle Timeout (15분 자동 로그아웃)
- ✅ 유지: 세션 추적 (last_activity_at, device_info, ip_address)
- ❌ 제거: 동시접속 제어 (다른 기기 로그인 시 기존 세션 종료)

---

## 🔍 영향도 분석 결과

### 1. 시스템 구조 요약

현재 세션 관리 시스템은 크게 **3가지 기능**으로 구성됩니다:

1. **세션 생성 및 추적** → ✅ 유지
2. **Idle Timeout (15분)** → ✅ 유지
3. **동시접속 제어** → ❌ 제거 대상

### 2. 삭제 가능 여부: **가능 ✅**

동시접속 제어 기능은 독립적으로 분리되어 있어 제거 가능합니다.

### 3. 주요 변경 사항

| 구분 | 제거 대상 | 유지 대상 |
|------|-----------|-----------|
| **DB 컬럼** | 없음 | `revoked_yn` (Idle timeout에서 사용)<br>`last_activity_at`, `device_info`, `ip_address` |
| **백엔드 메서드** | `check_active_session()`<br>`revoke_previous_sessions()`<br>`complete_force_login()` | `create_session()`<br>`update_heartbeat()`<br>`cleanup_expired_sessions()` |
| **API 엔드포인트** | `/check-active-session`<br>`/revoke-session`<br>`/complete-force-login` | `/session/heartbeat`<br>`/session/stats`<br>`/session/cleanup` |
| **프론트엔드** | `SessionConflictModal`<br>세션 충돌 처리 로직<br>`SESSION_REVOKED` 에러 처리 | `useActivityTracker`<br>`IdleTimeoutModal`<br>`SESSION_IDLE_TIMEOUT` 에러 처리 |

---

## 📊 전체 구조 (4 Tasks)

```
Task 1: 백엔드 - 동시접속 제어 로직 제거
  ├─ SessionService 메서드 제거
  ├─ GoogleAuthService 활성 세션 체크 로직 제거
  ├─ API 엔드포인트 제거
  └─ pending_login_store 삭제

Task 2: 백엔드 - 세션 검증 로직 단순화
  ├─ dependencies.py의 SESSION_REVOKED 에러 처리 제거
  └─ 스키마 정리

Task 3: 프론트엔드 - 동시접속 제어 UI 및 로직 제거
  ├─ SessionConflictModal 컴포넌트 삭제
  ├─ LoginPage 세션 충돌 처리 제거
  ├─ API 클라이언트 SESSION_REVOKED 에러 처리 제거
  └─ 관련 API 함수 제거

Task 4: DB 인덱스 최적화 및 문서 업데이트
  ├─ DB 인덱스 재검토 (동시접속 체크용 인덱스 제거 가능)
  ├─ 마이그레이션 파일 생성
  └─ 문서 업데이트
```

---

# 🔵 Task 1: 백엔드 - 동시접속 제어 로직 제거

> **목표**: SessionService, GoogleAuthService에서 동시접속 제어 관련 메서드 및 로직 제거
> **시작 조건**: 없음 (바로 시작 가능)
> **완료 기준**: 동시접속 체크 및 세션 폐기 로직 제거

## 📝 작업 내용

### 1. `server/app/domain/auth/service.py` 수정

**제거할 메서드**:
- `SessionService.check_active_session()` (61-112줄)
- `SessionService.revoke_previous_sessions()` (114-158줄)
- `SessionService.complete_force_login()` (160-234줄)

**유지할 메서드**:
- `SessionService.create_session()` ✅
- `SessionService.update_heartbeat()` ✅
- `SessionService.cleanup_expired_sessions()` ✅
- `SessionService.get_session_stats()` ✅

### 2. `server/app/domain/auth/service.py` - GoogleAuthService 수정

**제거할 로직** (execute 메서드 일부):
- 기존 활성 세션 확인 (559-635줄)
  - `session_service.check_active_session()` 호출 부분
  - pending_login_store 저장 로직
  - `has_active_session=True` 응답 로직

**수정 후 로직**:
```python
# OAuth 콜백 처리:
1. Authorization Code → Access Token 교환
2. Access Token → 사용자 정보 조회
3. CM_USER 테이블에서 사용자 검증
4. (삭제) 기존 활성 세션 확인
5. 공통코드 조회 (role, position)
6. JWT 토큰 생성
7. 세션 생성
8. 로그인 성공 응답 반환
```

### 3. `server/app/domain/auth/pending_login_store.py` 삭제

**파일 전체 삭제**:
- `PendingLoginData` 클래스
- `PendingLoginStore` 클래스
- `pending_login_store` 인스턴스

### 4. `server/app/domain/auth/router.py` 수정

**제거할 엔드포인트**:
- `POST /auth/check-active-session` (174-201줄)
- `POST /auth/revoke-session` (204-237줄)
- `POST /auth/complete-force-login` (240-281줄)

**유지할 엔드포인트**:
- `POST /auth/session/heartbeat` ✅
- `GET /auth/session/stats` ✅
- `POST /auth/session/cleanup` ✅

### 5. Import 정리

**제거할 import**:
```python
# service.py
from server.app.domain.auth.pending_login_store import (
    PendingLoginData,
    pending_login_store,
)
from server.app.domain.auth.schemas import (
    CheckActiveSessionResponse,  # 제거
    RevokeSessionResponse,       # 제거
    SessionInfo,                 # 제거 (또는 유지, 통계용으로 사용 가능)
)

# router.py
from server.app.domain.auth.schemas import (
    CheckActiveSessionRequest,   # 제거
    CheckActiveSessionResponse,  # 제거
    CompleteForceLoginRequest,   # 제거
    RevokeSessionRequest,        # 제거
    RevokeSessionResponse,       # 제거
)
```

## 📂 수정 파일

- `server/app/domain/auth/service.py` (수정)
- `server/app/domain/auth/router.py` (수정)
- `server/app/domain/auth/pending_login_store.py` (삭제)
- `server/app/domain/auth/schemas/__init__.py` (스키마 제거, Task 2에서 처리)

## ✅ 완료 조건

- [ ] `check_active_session()` 메서드 삭제
- [ ] `revoke_previous_sessions()` 메서드 삭제
- [ ] `complete_force_login()` 메서드 삭제
- [ ] `GoogleAuthService.execute()`에서 활성 세션 체크 로직 제거
- [ ] pending_login_store 파일 삭제
- [ ] 관련 API 엔드포인트 3개 삭제
- [ ] 백엔드 서버 정상 기동 확인

## ⏱️ 예상 시간: 1시간

---

# 🟢 Task 2: 백엔드 - 세션 검증 로직 단순화

> **목표**: dependencies.py에서 SESSION_REVOKED 에러 처리 제거 및 스키마 정리
> **시작 조건**: Task 1 완료
> **완료 기준**: 세션 검증 시 동시접속 관련 에러 제거

## 📝 작업 내용

### 1. `server/app/core/dependencies.py` 수정

**제거할 로직** (`get_current_user_id` 메서드):

```python
# 제거 대상 (105-114줄, 147-156줄):
if session and session.revoked_yn == 'Y':
    # 해당 세션이 폐기됨 (다른 곳에서 로그인)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error_code": "SESSION_REVOKED",
            "message": "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
```

**수정 후 로직**:
- `revoked_yn == 'Y'` 체크는 **유지** (Idle timeout에서 사용)
- 단, 에러 메시지를 일반화:
  ```python
  if session.revoked_yn == 'Y':
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail={
              "error_code": "SESSION_EXPIRED",
              "message": "세션이 만료되었습니다"
          },
          headers={"WWW-Authenticate": "Bearer"},
      )
  ```

**`get_current_session_id` 메서드도 동일하게 수정** (265-273줄):
```python
if session.revoked_yn == 'Y':
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error_code": "SESSION_EXPIRED",
            "message": "세션이 만료되었습니다"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
```

### 2. `server/app/domain/auth/schemas/__init__.py` 수정

**제거할 스키마**:
```python
class CheckActiveSessionRequest(BaseModel):
    user_id: str

class CheckActiveSessionResponse(BaseModel):
    has_active_session: bool
    session_info: Optional[SessionInfo] = None

class SessionInfo(BaseModel):
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[str] = None
    last_activity_at: Optional[str] = None

class RevokeSessionRequest(BaseModel):
    user_id: str
    revoke_previous: bool = True

class RevokeSessionResponse(BaseModel):
    success: bool
    message: str

class CompleteForceLoginRequest(BaseModel):
    user_id: str
```

**유지할 스키마**:
- `GoogleAuthResponse` (단, `has_active_session`, `existing_session_info` 필드 제거)
- `HeartbeatResponse` ✅
- `SessionStatsResponse` ✅
- `CleanupExpiredSessionsResponse` ✅

### 3. `GoogleAuthResponse` 스키마 수정

**제거할 필드**:
```python
has_active_session: bool = False
existing_session_info: Optional[SessionInfo] = None
```

**수정 후**:
```python
class GoogleAuthResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None
    role_code: Optional[str] = None
    position_code: Optional[str] = None
    # has_active_session 제거
    # existing_session_info 제거
```

## 📂 수정 파일

- `server/app/core/dependencies.py` (수정)
- `server/app/domain/auth/schemas/__init__.py` (수정)

## ✅ 완료 조건

- [ ] `SESSION_REVOKED` 에러 코드를 `SESSION_EXPIRED`로 통합
- [ ] 동시접속 관련 스키마 6개 삭제
- [ ] `GoogleAuthResponse`에서 `has_active_session`, `existing_session_info` 필드 제거
- [ ] 백엔드 서버 정상 기동 확인
- [ ] Swagger UI에서 스키마 정상 표시 확인

## ⏱️ 예상 시간: 30분

---

# 🟣 Task 3: 프론트엔드 - 동시접속 제어 UI 및 로직 제거

> **목표**: SessionConflictModal 제거 및 관련 로직 정리
> **시작 조건**: Task 2 완료 (백엔드 API 제거 후)
> **완료 기준**: 동시접속 관련 UI 및 에러 처리 제거

## 📝 작업 내용

### 1. 파일 삭제

```bash
# SessionConflictModal 컴포넌트 삭제
rm client/src/domains/auth/components/SessionConflictModal.tsx
```

### 2. `client/src/domains/auth/pages/LoginPage.tsx` 수정

**제거할 로직**:
- SessionConflictModal import
- 세션 충돌 상태 관리 (useState)
- 세션 충돌 모달 렌더링
- 강제 로그인 처리 함수
- OAuth 콜백 응답에서 `has_active_session` 체크

**수정 전 플로우**:
```
1. OAuth 콜백 처리
2. has_active_session 체크
3. true면 SessionConflictModal 표시
4. 사용자 선택 → complete-force-login API 호출
5. 로그인 완료
```

**수정 후 플로우**:
```
1. OAuth 콜백 처리
2. 로그인 완료 (즉시)
```

### 3. `client/src/domains/auth/api.ts` 수정

**제거할 API 함수**:
```typescript
// 제거 대상
export async function checkActiveSession(userId: string): Promise<CheckActiveSessionResponse> { ... }

export async function revokeSession(userId: string, revokePrevious: boolean = true): Promise<RevokeSessionResponse> { ... }

export async function completeForceLogin(userId: string): Promise<GoogleAuthResponse> { ... }
```

**유지할 API 함수**:
- `sendHeartbeat()` ✅
- `getSessionStats()` ✅ (선택적)

### 4. `client/src/domains/auth/types.ts` 수정

**제거할 타입**:
```typescript
export interface SessionInfo {
  device_info?: string;
  ip_address?: string;
  created_at?: string;
  last_activity_at?: string;
}

export interface CheckActiveSessionResponse {
  has_active_session: boolean;
  session_info?: SessionInfo;
}

export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}
```

**수정할 타입** (`GoogleAuthResponse`):
```typescript
export interface GoogleAuthResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  position?: string;
  role_code?: string;
  position_code?: string;
  // has_active_session 제거
  // existing_session_info 제거
}
```

### 5. `client/src/core/api/client.ts` 수정

**제거할 에러 처리** (Response Interceptor):
```typescript
// 제거 대상
if (errorCode === 'SESSION_REVOKED') {
  toast.error('다른 기기에서 로그인하여 현재 세션이 종료되었습니다');
  // 로그아웃 처리
  return Promise.reject(error);
}
```

**유지할 에러 처리**:
- `SESSION_IDLE_TIMEOUT` ✅
- `SESSION_EXPIRED` ✅ (통합된 에러)

### 6. Import 정리

**제거할 import**:
```typescript
// LoginPage.tsx
import { SessionConflictModal } from '../components/SessionConflictModal';

// api.ts
import type {
  CheckActiveSessionResponse,
  RevokeSessionResponse
} from './types';
```

## 📂 수정/삭제 파일

- `client/src/domains/auth/components/SessionConflictModal.tsx` (삭제)
- `client/src/domains/auth/pages/LoginPage.tsx` (수정)
- `client/src/domains/auth/api.ts` (수정)
- `client/src/domains/auth/types.ts` (수정)
- `client/src/core/api/client.ts` (수정)

## ✅ 완료 조건

- [ ] SessionConflictModal 파일 삭제
- [ ] LoginPage에서 세션 충돌 처리 로직 제거
- [ ] API 함수 3개 삭제 (checkActiveSession, revokeSession, completeForceLogin)
- [ ] 타입 정의 정리
- [ ] API 인터셉터에서 SESSION_REVOKED 에러 처리 제거
- [ ] 프론트엔드 빌드 성공 (`npm run build`)
- [ ] ESLint 에러 없음 (`npm run lint`)
- [ ] 로그인 플로우 정상 작동 확인

## ⏱️ 예상 시간: 1시간

---

# 🟠 Task 4: DB 인덱스 최적화 및 문서 업데이트

> **목표**: 동시접속 체크용 인덱스 제거 및 문서 업데이트
> **시작 조건**: Task 1-3 완료
> **완료 기준**: 불필요한 인덱스 제거 및 문서 최신화

## 📝 작업 내용

### 1. DB 인덱스 검토

**현재 인덱스** (`server/app/domain/auth/models.py`):
```python
Index(
    'idx_refresh_token_user_active',
    'user_id', 'revoked_yn', 'last_activity_at',
    postgresql_where='revoked_yn = \'N\''
),
Index(
    'idx_refresh_token_cleanup',
    'last_activity_at',
    postgresql_where='revoked_yn = \'N\''
),
```

**검토 결과**:
- `idx_refresh_token_user_active`: **제거 가능** (동시접속 체크용)
  - 용도: `check_active_session()`에서 user_id로 활성 세션 조회
  - 제거 후 영향: 없음 (해당 쿼리 자체가 삭제됨)
- `idx_refresh_token_cleanup`: **유지 필요** ✅
  - 용도: `cleanup_expired_sessions()`에서 last_activity_at 기준 조회
  - Idle timeout 기능에서 사용 중

**수정 후**:
```python
__table_args__ = (
    # Idle timeout 세션 정리 최적화
    Index(
        'idx_refresh_token_cleanup',
        'last_activity_at',
        postgresql_where='revoked_yn = \'N\''
    ),
)
```

### 2. Alembic 마이그레이션 생성

**마이그레이션 파일 생성**:
```bash
alembic revision -m "remove_concurrent_session_index"
```

**마이그레이션 내용**:
```python
def upgrade() -> None:
    # idx_refresh_token_user_active 인덱스 삭제
    op.execute("DROP INDEX IF EXISTS idx_refresh_token_user_active")

def downgrade() -> None:
    # Rollback 시 인덱스 재생성
    op.execute("""
        CREATE INDEX idx_refresh_token_user_active
        ON auth_refresh_token(user_id, revoked_yn, last_activity_at)
        WHERE revoked_yn = 'N'
    """)
```

**실행**:
```bash
alembic upgrade head
```

### 3. 문서 업데이트

**수정할 문서**:

#### `docs/authentication/SESSION_MANAGEMENT.md`
- **제목 변경**: "세션 관리 및 동시접속 제어 시스템 가이드" → "세션 관리 및 Idle Timeout 시스템 가이드"
- **시스템 개요** 수정:
  ```markdown
  ## 🚀 1. 시스템 개요

  사용자의 보안을 강화하고 서버 자원을 효율적으로 관리하기 위해 다음과 같은 기능을 구현하였습니다.
  - **Idle Timeout**: 15분 동안 활동이 없을 경우 자동 로그아웃
  - **세션 추적**: 마지막 활동 시간, IP 주소, 디바이스 정보를 DB에서 관리
  ```
- **동시접속 제어 섹션 삭제** (4.2. Duplicate Login)
- **API 엔드포인트 목록 업데이트**:
  - `/check-active-session` 제거
  - `/revoke-session` 제거
  - `/complete-force-login` 제거

#### `SESSION_MANAGEMENT_ROADMAP.md`
- 파일 이름 변경 또는 아카이브:
  ```bash
  mv SESSION_MANAGEMENT_ROADMAP.md docs/archive/SESSION_MANAGEMENT_ROADMAP_OLD.md
  ```
- 새로운 로드맵 생성 (선택):
  ```bash
  # 이 문서(REMOVE_CONCURRENT_SESSION_ROADMAP.md)를 메인 로드맵으로 사용
  ```

#### `CLAUDE.md` (프로젝트 메인 문서)
- **DB Migration & Model Rule** 섹션 업데이트:
  - 동시접속 관련 예제 제거
  - 세션 관리 관련 설명 업데이트

#### `docs/test/PHASE2_TEST_SCENARIO.md`
- 동시접속 제어 시나리오 제거
- Idle Timeout 시나리오만 유지

### 4. 코드 주석 정리

**정리 대상**:
- `server/app/domain/auth/service.py`: 동시접속 관련 주석 제거
- `server/app/domain/auth/router.py`: 삭제된 엔드포인트 관련 주석 제거
- `client/src/domains/auth/pages/LoginPage.tsx`: 세션 충돌 관련 주석 제거

## 📂 수정 파일

- `server/app/domain/auth/models.py` (인덱스 수정)
- `alembic/versions/xxx_remove_concurrent_session_index.py` (신규 생성)
- `docs/authentication/SESSION_MANAGEMENT.md` (수정)
- `SESSION_MANAGEMENT_ROADMAP.md` (아카이브)
- `CLAUDE.md` (수정)
- `docs/test/PHASE2_TEST_SCENARIO.md` (수정)

## ✅ 완료 조건

- [ ] `idx_refresh_token_user_active` 인덱스 삭제
- [ ] 마이그레이션 파일 생성 및 실행
- [ ] SESSION_MANAGEMENT.md 문서 업데이트
- [ ] 로드맵 파일 아카이브
- [ ] CLAUDE.md 업데이트
- [ ] 테스트 시나리오 정리
- [ ] 코드 주석 정리

## ⏱️ 예상 시간: 1시간

---

# 📊 전체 진행 상황 추적

## Task별 진행률

| Task | 내용 | 예상 시간 | 완료 | 상태 |
|------|------|----------|------|------|
| Task 1 | 백엔드 - 동시접속 제어 로직 제거 | 1시간 | ✅ | Completed |
| Task 2 | 백엔드 - 세션 검증 로직 단순화 | 30분 | ✅ | Completed |
| Task 3 | 프론트엔드 - UI 및 로직 제거 | 1시간 | ✅ | Completed |
| Task 4 | DB 인덱스 최적화 및 문서 업데이트 | 1시간 | ⬜ | Not Started |
| **전체** | **4개 Task** | **3.5시간** | **3/4** | 🟡 In Progress |

## 의존성 관계

```
Task 1 (백엔드 로직 제거)
  ↓
Task 2 (백엔드 스키마 정리)
  ↓
Task 3 (프론트엔드 정리)
  ↓
Task 4 (인덱스 & 문서)
  ↓
완료
```

---

# 🎯 시작 가이드

## 첫 번째 작업

**Task 1부터 시작하세요**

```bash
# 요청 예시
"Task 1을 진행해줘: 백엔드 동시접속 제어 로직 제거"
```

## 주의사항

1. **revoked_yn 컬럼은 유지**: Idle timeout에서 세션 폐기 시 사용
2. **순차 진행 필수**: Task 1 → 2 → 3 → 4 순서로 진행
3. **테스트 필수**: 각 Task 완료 후 로그인 플로우 테스트
4. **문서화**: Task 4에서 모든 문서 업데이트 완료

---

# ✅ 최종 검수 체크리스트

## 기능 확인

- [ ] 로그인 플로우 정상 작동 (세션 충돌 모달 없음)
- [ ] Idle Timeout 정상 작동 (15분)
- [ ] Heartbeat 정상 작동
- [ ] 백엔드 서버 정상 기동
- [ ] 프론트엔드 빌드 성공

## 코드 품질

- [ ] 백엔드 Lint 통과 (black, isort, ruff)
- [ ] 프론트엔드 Lint 통과 (ESLint)
- [ ] 사용하지 않는 import 제거
- [ ] 사용하지 않는 파일 삭제

## 문서

- [ ] SESSION_MANAGEMENT.md 업데이트
- [ ] CLAUDE.md 업데이트
- [ ] 테스트 시나리오 업데이트
- [ ] 로드맵 아카이브

## DB

- [ ] 마이그레이션 정상 실행
- [ ] 인덱스 삭제 확인
- [ ] 기존 데이터 영향 없음

---

**준비 완료! Task 1부터 시작하시겠습니까?**
