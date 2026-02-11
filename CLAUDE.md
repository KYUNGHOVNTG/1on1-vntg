# CLAUDE.md - 1on1-vntg Project

이 프로젝트는 **"유지보수성 최우선" 및 "모듈화"**를 핵심 가치로 하는 FastAPI + React 19 풀스택 웹 애플리케이션입니다.
AI 에이전트와 협업할 때 다음 규칙을 **엄격히** 준수해야 합니다.

---

## Quick Reference - 빌드 & 실행 명령어

```bash
# Backend (Python 3.12+, FastAPI)
pip install -r requirements.txt
uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (React 19, Vite)
cd client && npm install && npm run dev

# Lint & Format (Backend)
black server/ --line-length 100
isort server/ --profile black
ruff check server/

# Lint (Frontend)
cd client && npm run lint

# Test (Backend)
pytest tests/

# DB Migration (Alembic)
alembic revision --autogenerate -m "설명"
alembic upgrade head
alembic downgrade -1
```

---

## 작업 시작 전 필수 확인

**중요**: 코드 작업을 시작하기 전에 반드시 **[docs/AI_DEVELOPER_CHECKLIST.md](./docs/AI_DEVELOPER_CHECKLIST.md)**를 확인하세요.

이 체크리스트는 다음을 포함합니다:
- **작업 시작 전 체크리스트**: 문서 확인, 요구사항 분석, 영향 범위 평가
- **코드 작성 중 체크리스트**: Backend/Frontend별 상세 가이드
- **코드 작성 완료 후 체크리스트**: 품질 검증, 기능 테스트, Git 커밋

---

## 절대 금지 사항 (NEVER DO)

1. **폴더 구조 파괴 금지**: 기존의 계층화된 폴더 구조(`core/`, `shared/`, `domain/`, `domains/`)를 절대 변경하지 마세요
2. **절차지향 함수 금지**: 백엔드 비즈니스 로직은 반드시 클래스 기반으로 작성
3. **직접 DB 접근 금지**: Service 레이어에서 직접 DB 쿼리 작성 금지 (Repository로 위임)
4. **직접 axios 호출 금지**: 프론트엔드에서 `axios`를 직접 import 금지 (apiClient 사용)
5. **도메인 간 의존성 금지**: 한 도메인이 다른 도메인의 내부 구현에 의존하지 않도록
6. **인라인 스타일 금지**: React 컴포넌트에서 `style={{ ... }}` 사용 금지 (Tailwind CSS 사용)
7. **타입 힌트 생략 금지**: Python, TypeScript 모두 명시적 타입 선언 필수
8. **SUPABASE 사용 정책**
   - 권장: Supabase를 PostgreSQL 데이터베이스로 활용
   - 금지: Supabase 전용 기능 사용 (Auth, Storage, Realtime, Edge Functions 등)
   - 이유: 향후 순수 PostgreSQL 환경으로 쉬운 이관을 위해
   - 대안 구현: 인증은 JWT 직접 구현 / 파일 저장은 S3 또는 로컬 스토리지 / 실시간은 WebSocket 직접 구현

---

## Tech Stack

- **Backend**: Python 3.12, FastAPI 0.109, SQLAlchemy 2.0 (async), Pydantic v2, Alembic
- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5, React Router 7
- **Database**: PostgreSQL (Supabase as PostgreSQL only)
- **Auth**: JWT (python-jose), Google OAuth 2.0, bcrypt (passlib)
- **Linting**: black, isort, ruff, mypy (Backend) / ESLint (Frontend)
- **Testing**: pytest, pytest-asyncio, pytest-cov (Backend)

---

## General Principles

### 아키텍처 우선

- **변경 전 확인**: 코드를 수정하기 전 항상 변경 사항이 아키텍처에 미치는 영향을 설명하고 사용자의 확인을 받으세요
- **레이어드 아키텍처 준수**: Router → Service → Repository/Calculator/Formatter 흐름을 절대 위반하지 마세요
- **단일 책임 원칙**: 각 클래스/컴포넌트는 하나의 역할만 담당해야 합니다

### 타입 안전성

- **Python**: 모든 함수/메서드에 타입 힌트 명시 (`def foo(x: int) -> str:`)
- **TypeScript**: `any` 타입 사용 금지 (불가피한 경우 `unknown` 사용 후 타입 가드)
- **Pydantic**: Request/Response DTO는 반드시 Pydantic BaseModel 상속
- **Generic Types**: BaseService, BaseRepository 등은 제네릭 타입 파라미터 명시

---

## DB Migration & Model Rule (필수)

이 프로젝트는 Alembic을 사용하여 마이그레이션을 관리합니다.

### 기본 원칙

1. **모든 DB 변경은 Alembic 마이그레이션으로 관리**:
   - 스키마 변경 (테이블, 컬럼 추가/수정/삭제)
   - 데이터 변경 (초기 데이터, 마스터 데이터 INSERT/UPDATE/DELETE)
   - DB 콘솔에서 직접 실행 절대 금지
   - 직접 SQL 쿼리 제공 금지 (반드시 Alembic 마이그레이션 파일로)

2. **마이그레이션 생성 절차**:
   - 스키마 변경: 모델(models.py) 먼저 수정 → `alembic revision --autogenerate -m "설명"`
   - 데이터 변경: `alembic revision -m "설명"` → 수동으로 upgrade/downgrade 작성
   - 검토 후 `alembic upgrade head` 실행

3. **변경 원칙**:
   - 모델 우선 변경 (Single Source of Truth)
   - 기존 마이그레이션 파일 수정 금지 (새 마이그레이션 생성)
   - 테이블 정의 변경 시 반드시 해당 도메인의 모델(`server/app/domain/{domain}/models/`)을 함께 수정
   - 모든 마이그레이션은 rollback 가능하도록 downgrade() 함수 필수 구현

### AI 에이전트 필수 체크리스트 (DB 작업 전)

**CRITICAL**: DB 관련 작업을 시작하기 전 다음을 **반드시** 확인하세요:

1. **기존 데이터 확인 (필수)**:
   - `migration/` 폴더의 초기 데이터 파일 확인 (예: `20260120_seed_*.sql`)
   - `alembic/versions/` 폴더의 기존 마이그레이션 파일 확인
   - 추가하려는 데이터가 이미 존재하는지 검색 (`grep`, `Glob` 도구 활용)

2. **메뉴 데이터 작업 시 (특히 중요)**:
   - 기존 메뉴 코드 확인: `migration/` 폴더에서 `menu_code` 검색
   - 메뉴 URL 중복 확인: 동일한 `menu_url`이 있는지 확인
   - 메뉴 계층 구조 파악: 상위 메뉴(`up_menu_code`) 관계 확인
   - **절대로 임의의 메뉴 코드를 생성하지 마세요**

3. **Alembic 마이그레이션 규칙**:
   ```python
   # 올바른 예시: 데이터 마이그레이션
   def upgrade() -> None:
       op.execute("""
           INSERT INTO cm_menu (...) VALUES (...)
       """)

   def downgrade() -> None:
       op.execute("DELETE FROM cm_menu WHERE menu_code = 'M999'")
   ```

4. **금지 사항**:
   - ❌ 직접 SQL 쿼리 제공 (`INSERT INTO ...` 직접 실행)
   - ❌ 기존 데이터 확인 없이 작업
   - ❌ 사용자에게 "DB에서 직접 실행하세요" 안내
   - ❌ `migration/` 폴더 확인 생략

### AI 에이전트 작업 절차

DB 변경이 필요할 시:
1. **기존 데이터 확인** (migration/, alembic/versions/ 검색)
2. 도메인 모델 수정 (스키마 변경 시)
3. Alembic 마이그레이션 생성 명령어 안내
4. 사용자 확인 후 진행

---

## Backend (Python) Rules

### 필수: Repository-Calculator-Formatter 패턴 사용

#### 표준 템플릿 & 예제 위치
- **표준 템플릿**: `server/app/examples/sample_domain/` (repositories, calculators, formatters, service 모두 포함)
- **실제 적용 예제**: `server/app/domain/common/` (Repository 패턴 적용, 리팩토링 완료)
- **레거시 (참고 금지)**: `server/app/domain/auth/` (점진적 리팩토링 중)

#### 새 도메인 추가 시
1. `examples/sample_domain`을 복사하여 시작 (권장)
2. `domain/common`을 참고 (단순 CRUD 도메인)
3. `domain/auth`는 예시로 사용 금지 (레거시 패턴)

### 레이어별 책임 (절대 준수)

| 레이어 | 책임 | 허용 | 금지 |
|--------|------|------|------|
| **Router** | HTTP 요청/응답 처리 | Service 호출 | 비즈니스 로직, DB 접근 |
| **Service** | 흐름 제어, 트랜잭션 관리 | Repository/Calculator/Formatter 조율 | 직접 DB 조회, 계산 로직 |
| **Repository** | 데이터 조회 | DB/API/파일 접근, Side Effect | 계산 로직, 포맷팅 |
| **Calculator** | 순수 계산 로직 | 계산, 검증 | DB 접근, Side Effect, API 호출 |
| **Formatter** | 응답 변환 | 데이터 변환 | 비즈니스 로직, DB 접근 |

### 파일 배치 규칙

```
server/app/domain/{domain_name}/
├── __init__.py
├── service.py              # 도메인 서비스
├── models/                 # SQLAlchemy 모델
│   └── __init__.py
├── schemas/                # Pydantic 스키마
│   └── __init__.py
├── repositories/           # 데이터 조회 (DB, API, 파일)
│   └── __init__.py
├── calculators/            # 비즈니스 로직 (순수 함수, 복잡한 경우만)
│   └── __init__.py
└── formatters/             # 응답 포맷팅 (복잡한 변환이 필요한 경우만)
    └── __init__.py
```

### 예외 처리
- 일반 Exception 사용 금지 → `server.app.shared.exceptions`의 커스텀 예외 사용

### 로깅 규칙
- Request ID 필수 사용, 구조화된 로깅, 민감정보 로깅 금지
- `from server.app.core.logging import get_logger` 사용

### 시간 처리 규칙
- UTC 기준 사용: `datetime.utcnow()` 사용 (`datetime.now()` 금지)
- 모든 타임스탬프 필드에 적용 (`expires_at`, `in_date`, `last_activity_at` 등)

---

## Frontend (React) Rules

### 컴포넌트 분리 원칙
- 모놀리식 컴포넌트 금지 → 기능 단위 분리

### Tailwind CSS 4 사용 규칙
- 인라인 스타일 절대 금지 → Tailwind 유틸리티 클래스 사용
- 조건부 클래스: `cn()` 유틸리티 사용 (`import { cn } from '@/utils/cn'`)

### API 통신 규칙
- 직접 axios import 금지 → `import { apiClient } from '@/core/api/client'` 사용

### 상태 관리 규칙
- 전역 상태: `core/store/` (Zustand) - Auth, Theme 등
- 도메인 상태: `domains/{domain}/store.ts` (Zustand)

### 컴포넌트 파일 배치

```
client/src/
├── core/                   # 공통 인프라
│   ├── api/                # API 클라이언트
│   ├── hooks/              # 커스텀 훅
│   ├── layout/             # 레이아웃 컴포넌트
│   ├── store/              # 전역 상태
│   └── ui/                 # 재사용 UI 컴포넌트
└── domains/                # 도메인별 기능
    └── {domain_name}/
        ├── api.ts          # API 호출 함수
        ├── store.ts        # Zustand 스토어
        ├── types.ts        # TypeScript 타입
        ├── components/     # 도메인 컴포넌트
        ├── pages/          # 도메인 페이지
        └── index.ts        # 내보내기
```

### 디자인 시스템 (1on1-Mirror)

#### 색상
- Primary: `#4950DC` / Hover: `#3840C5`
- Secondary: `#2E81B1` / Hover: `#256991`
- Accent/Success: `#14B287` / Hover: `#108E6C`
- Background: `bg-white` / Surface: `bg-[#F9FAFB]`
- Text: `text-gray-900` (main) / `text-gray-500` (sub)

#### 타이포그래피
- Font: `'Noto Sans KR'`
- 기본 본문: `text-sm (14px)` — **text-[10px] 사용 금지**

#### 컴포넌트 필수 클래스
- **Button Primary:** `px-5 py-2.5 bg-[#4950DC] hover:bg-[#3840C5] text-white rounded-xl text-sm font-semibold shadow-sm transition-all`
- **Button Secondary:** `px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all`
- **Input:** `h-10 px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all`
- **Card:** `bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`

#### AI 에이전트 필수 규칙
1. 위 정의된 색상/클래스만 사용 (커스텀 색상 금지)
2. 인라인 스타일 절대 금지
3. 공통 컴포넌트(`@/core/ui`) 우선 사용
4. 모든 인터랙티브 요소에 transition 적용
5. lucide-react 아이콘 사용 (16-20px)

### 알림/메시지 컴포넌트 시스템

**절대 규칙**: `alert()`, `confirm()`, `prompt()` 등 브라우저 기본 다이얼로그 사용 금지

| 상황 | 추천 컴포넌트 |
|------|-------------|
| 입력 오류 | `InlineMessage` (`@/core/ui/InlineMessage`) |
| 단순 성공/실패 | `toast` (`@/core/ui/Toast`) |
| 취소 가능 작업 | `snackbar` (`@/core/ui/Snackbar`) |
| 되돌릴 수 없는 작업 | `ConfirmModal` (`@/core/ui/Modal`) |
| 전역 공지 | `Banner` (`@/core/ui/Banner`) |
| 조회 결과 없음 | `EmptyState` (`@/core/ui/EmptyState`) |
| 시스템 이벤트 알림 | `NotificationCenter` (`@/core/ui/NotificationCenter`) |

---

## Code Style Guidelines

### Python (Backend)
- Import 순서: 표준 라이브러리 → 외부 라이브러리 → 내부 모듈 (isort 준수)
- 클래스: PascalCase / 함수: snake_case / 상수: UPPER_SNAKE_CASE / 파일: snake_case
- black (line-length=100), isort (profile=black), ruff

### TypeScript (Frontend)
- Import 순서: React → 외부 라이브러리 → core → 도메인 상대 경로 → 타입(type 키워드)
- 컴포넌트/타입: PascalCase / 함수/변수: camelCase / 상수: UPPER_SNAKE_CASE
- 컴포넌트 파일: PascalCase / 유틸 파일: camelCase

---

## 도메인별 개발 가이드라인

### auth 도메인 (인증/인가)
- JWT 기반: Access Token 15분 만료, Refresh Token 7일 만료
- Google OAuth: Authorization Code Grant, state로 CSRF 방지
- 토큰에 민감 정보 포함 금지, 만료 시간 필수

### menu 도메인 (메뉴 권한 시스템)
- 직책 기반 동적 메뉴 권한 관리
- 최대 3depth까지 허용 (Root → Parent → Child)
- 클라이언트 + 백엔드 양쪽에서 권한 체크

### common 도메인 (공통코드 관리)
- code_type/code_value/code_name 구조
- 하드코딩 금지 → DB에서 코드 조회
- 삭제 대신 use_yn = 'N'

### dashboard 도메인 (대시보드)
- 집계는 DB에서 처리 (Python에서 집계 금지)
- 위젯별 API 엔드포인트 분리

### user 도메인 (사용자 관리)
- 비밀번호 bcrypt 해싱 필수
- Response에 비밀번호 필드 절대 포함 금지
- 삭제는 soft delete (use_yn = 'N')

---

## Collaboration Guidelines

### 코드 변경 전 확인사항
1. 영향 범위 분석: 변경이 다른 레이어/도메인에 영향을 주는지 확인
2. 사용자 확인 요청: 아키텍처 변경이 필요한 경우 설명하고 승인 요청
3. 테스트 영향 평가: 기존 테스트가 깨질 가능성 확인

---

## 추가 참고 자료

- [docs/AI_DEVELOPER_CHECKLIST.md](./docs/AI_DEVELOPER_CHECKLIST.md) - AI 개발자 필수 체크리스트
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - 아키텍처 상세 설명
- [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) - 개발 가이드 및 체크리스트
- [docs/PROJECT_HANDOVER.md](./docs/PROJECT_HANDOVER.md) - AI 개발자 인수인계 문서
- [server/README.md](./server/README.md) - 백엔드 상세 가이드
- [client/README.md](./client/README.md) - 프론트엔드 상세 가이드
