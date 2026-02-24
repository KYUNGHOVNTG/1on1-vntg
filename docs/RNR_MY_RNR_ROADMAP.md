# 나의 R&R 관리 (M002_1) 개발 로드맵

> **작성일**: 2026-02-23
> **대상 메뉴**: R&R 관리 > 나의 R&R 관리 (M002_1, `/goals/myRnr`)
> **브랜치**: `claude/rnr-management-roadmap-skojL`

이 문서는 `나의 R&R 관리` 기능의 풀스택 개발 계획을 정의합니다.
`.antigravityrules` 및 `CLAUDE.md`의 아키텍처 원칙을 엄격히 준수합니다.

---

## 1. 개발 목표

로그인한 사용자가 자신의 R&R(역할 및 책임)을 **등록·조회**할 수 있는 기능을 구현합니다.

### 핵심 기능
- 내 R&R 목록을 **카드 형태 + 타임라인 바**로 시각화
- 상위 R&R에 연결된 계층 구조 표현
- **기간이 단절된 다중 수행 기간** 등록 지원 (예: 1~3월 + 7~12월)
- **겸직자**의 소속 부서 선택 지원
- 등록 모달에서 **상위 R&R 자동 조회** (직책 기반)

---

## 2. 아키텍처 결정 사항

### 2.1 DB 테이블 네이밍
요구사항 명세에 따라 `tb_*` prefix 사용 (프로젝트 내 도메인 전용 테이블로 구분)

| 논리명 | 물리 테이블명 |
|--------|------------|
| R&R 마스터 | `tb_rr` |
| R&R 레벨 | `tb_rr_level` |
| 업무 기간 | `tb_rr_period` |

### 2.2 RR_TYPE 자동 결정 (시스템 판단)
사용자가 직접 선택하지 않음. 로그인한 사용자의 직책 코드로 자동 결정.

| 직책 코드 | RR_TYPE | 비고 |
|----------|---------|------|
| `P005` | `MEMBER` (팀원) | 팀원 |
| `P001~P004` | `LEADER` (조직장) | 대표/총괄/센터장/팀장 등 |

### 2.3 상위 R&R 조회 로직

```
사용자 직책이 P005(팀원)인 경우:
  → 같은 부서(dept_code)에서 P001~P004 직책의 조직장이 등록한 R&R 목록 조회

사용자 직책이 P001~P004(조직장)인 경우:
  → 상위 부서의 조직장이 등록한 R&R 목록 조회
  (cm_department_tree의 parent_dept_code 활용)
```

### 2.4 겸직자 처리
- `hr_mgnt_concur` 테이블에 겸직 데이터가 있는 경우 → 드롭다운으로 부서 선택 제공
- 본소속 + 겸직 부서 모두 포함하여 표시
- 선택된 부서에 따라 상위 R&R 목록 재조회

### 2.5 Status 상태 정의

| 코드 | 의미 | 비고 |
|------|------|------|
| `N` | 미작성 | 초기 상태 |
| `R` | 작성중 | 임시저장 |
| `Y` | 확정 | 완료 |

> **이번 개발 범위**: 등록 시 기본값 `N`, 저장 시 `R` 처리 (확정 기능은 이후 Task에서)

---

## 3. DB 스키마 설계

### 3.1 tb_rr_level (R&R 레벨)

```sql
CREATE TABLE tb_rr_level (
    level_id    VARCHAR(20)  NOT NULL PRIMARY KEY,
    year        VARCHAR(4)   NOT NULL,       -- 기준 연도 (예: '2026')
    level_name  VARCHAR(100) NOT NULL,       -- 전사, 부문, 본부, 센터, 팀, 파트
    level_step  INTEGER      NOT NULL        -- 0(Root), 1, 2, 3...
);
```

**초기 데이터 예시 (2026년)**

| level_id | year | level_name | level_step |
|----------|------|-----------|-----------|
| LV2026_0 | 2026 | 전사 | 0 |
| LV2026_1 | 2026 | 부문 | 1 |
| LV2026_2 | 2026 | 본부 | 2 |
| LV2026_3 | 2026 | 센터 | 3 |
| LV2026_4 | 2026 | 팀 | 4 |
| LV2026_5 | 2026 | 파트 | 5 |

### 3.2 tb_rr (R&R 마스터)

```sql
CREATE TABLE tb_rr (
    rr_id         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year          VARCHAR(4)   NOT NULL,
    level_id      VARCHAR(20)  NOT NULL REFERENCES tb_rr_level(level_id),
    emp_no        VARCHAR(20)  NOT NULL REFERENCES hr_mgnt(emp_no),
    dept_code     VARCHAR(20)  NOT NULL REFERENCES cm_department(dept_code),
    rr_type       VARCHAR(10)  NOT NULL CHECK (rr_type IN ('COMPANY','LEADER','MEMBER')),
    parent_rr_id  UUID         REFERENCES tb_rr(rr_id),   -- Self-Reference, 최상위 NULL
    title         VARCHAR(500) NOT NULL,
    content       TEXT,
    status        VARCHAR(1)   NOT NULL DEFAULT 'N' CHECK (status IN ('N','R','Y')),
    in_user       VARCHAR(20)  NOT NULL,
    in_date       TIMESTAMP    NOT NULL DEFAULT NOW(),
    up_user       VARCHAR(20),
    up_date       TIMESTAMP
);

CREATE INDEX idx_tb_rr_year_emp ON tb_rr (year, emp_no);
CREATE INDEX idx_tb_rr_dept ON tb_rr (dept_code, year);
```

### 3.3 tb_rr_period (업무 기간)

```sql
CREATE TABLE tb_rr_period (
    rr_id       UUID         NOT NULL REFERENCES tb_rr(rr_id) ON DELETE CASCADE,
    seq         INTEGER      NOT NULL,
    start_date  VARCHAR(6)   NOT NULL,   -- YYYYMM
    end_date    VARCHAR(6)   NOT NULL,   -- YYYYMM
    PRIMARY KEY (rr_id, seq)
);
```

---

## 4. API 설계

### Backend 엔드포인트 (prefix: `/v1/rnr`)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/v1/rnr/my` | 나의 R&R 목록 조회 (year 파라미터, 기본=현재 연도) |
| `GET` | `/v1/rnr/my-departments` | 내 부서 목록 (겸직 포함) |
| `GET` | `/v1/rnr/departments/{dept_code}/parent-rr` | 상위 R&R 선택 목록 (year 파라미터) |
| `POST` | `/v1/rnr` | R&R 등록 |

### 응답 구조 원칙
- 목록 API: `{ items: T[], total: number }` 구조 통일
- 단일 객체 API: 객체 직접 반환

---

## 5. 프론트엔드 UI 설계

### 5.1 페이지 레이아웃 (MyRnrPage)

```
┌─────────────────────────────────────────────────────┐
│  나의 R&R 관리                    [+ 새 R&R 등록]    │
├─────────────────────────────────────────────────────┤
│  [카드 1]                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  상위 R&R: [팀 전략 목표 달성]                  │  │
│  │  ■ 신규 서비스 기획 및 로드맵 수립              │  │
│  │  서비스 전략을 수립하고 분기별 마일스톤을...     │  │
│  │                                               │  │
│  │  수행 기간                                     │  │
│  │  Jan ──────── Mar      Jul ──────── Dec       │  │
│  │  ████████████          ████████████████       │  │
│  └───────────────────────────────────────────────┘  │
│  [카드 2] ...                                       │
└─────────────────────────────────────────────────────┘
```

### 5.2 빈 상태 (EmptyState)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📋 (아이콘)                             │
│        등록된 R&R이 없습니다                         │
│    새 R&R을 등록하여 역할과 책임을 정의해보세요       │
│                                                     │
│                  [+ 등록하기]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 등록 모달 필드 구성

| 순서 | 필드 | 타입 | 비고 |
|------|------|------|------|
| 1 | 기준 년도 | Select (년도) | 기본값: 현재 연도 |
| 2 | 소속 부서 | Select | 겸직자: 다중 부서 드롭다운 |
| 3 | ☐ 상위 R&R 없이 등록 | Checkbox | 체크 시 상위 R&R 비활성화 |
| 4 | 상위 R&R | Select | 부서 선택 시 자동 조회 |
| 5 | R&R 명 | Input | 필수, 핵심 과업 제목 |
| 6 | 상세 내용 | Textarea | 구체적 역할 및 책임 |
| 7 | 수행 기간 | 기간 행 (동적) | 시작월 ~ 종료월, 행 추가/삭제 |

### 5.4 타임라인 바 설계

- 기준: 1월~12월 가로 막대 (현재 연도 기준)
- 기간 영역: Primary 색상(`#4950DC`) 으로 표시
- 다중 기간: 같은 행에 여러 구간 표시
- 월 레이블: Jan, Feb, Mar ... Dec (약어)

---

## 6. 디렉토리 구조 (생성 예정)

### Backend
```
server/app/domain/rnr/
├── __init__.py
├── router.py              # FastAPI 라우터
├── service.py             # RrService (흐름 제어)
├── models/
│   └── __init__.py        # RrLevel, Rr, RrPeriod (SQLAlchemy)
├── schemas/
│   └── __init__.py        # Pydantic 요청/응답 스키마
└── repositories/
    └── __init__.py        # RrRepository (DB 접근)
```

### Frontend
```
client/src/domains/rnr/
├── index.ts
├── types.ts               # TypeScript 타입 정의
├── api.ts                 # API 호출 함수 (apiClient 사용)
├── store.ts               # Zustand 스토어
├── components/
│   ├── index.ts
│   ├── TimelineBar.tsx    # 수행 기간 가로막대 그래프
│   ├── RrCard.tsx         # R&R 카드 컴포넌트
│   ├── RrListSection.tsx  # 목록 + EmptyState 분기
│   └── RrRegisterModal.tsx # 등록 모달 (기간 동적 추가)
└── pages/
    └── MyRnrPage.tsx      # 나의 R&R 관리 페이지
```

---

## 7. Task 분할

> **원칙**: 각 Task는 AI 에이전트가 1회 세션에서 완결 가능한 단위로 정의
> **실행 순서**: 반드시 TASK-01 → TASK-09 순서로 진행 (의존성 있음)

---

### TASK-01: 메뉴 데이터 업데이트 마이그레이션

**목적**: 기존 M002 하위 메뉴의 이름과 URL을 R&R 관리 체계로 변경

**변경 내용**

| 메뉴 코드 | 기존 이름 | 새 이름 | 기존 URL | 새 URL |
|---------|---------|---------|---------|-------|
| M002 | 목표 관리 | R&R 관리 | - | - |
| M002_1 | 목표 설정 | 나의 R&R 관리 | /goals/setting | /goals/myRnr |
| M002_2 | 목표 진행 현황 | 전체 R&R 관리 | /goals/progress | /goals/allRnr |
| M002_3 | 목표 평가 | 조직원 R&R 현황 | /goals/evaluation | /goals/teamRnr |

**작업 파일**
- `alembic/versions/새파일_update_rnr_menu_data.py` (데이터 마이그레이션)

**주의사항**
- 기존 마이그레이션 파일 검색 후 중복 방지 (`ON CONFLICT DO NOTHING`)
- downgrade() 함수 필수 구현 (원복 가능하도록)

---

### TASK-02: R&R SQLAlchemy 모델 + DB 테이블 생성 마이그레이션

**목적**: `tb_rr_level`, `tb_rr`, `tb_rr_period` 테이블 생성

**작업 파일**
- `server/app/domain/rnr/__init__.py` (신규 생성)
- `server/app/domain/rnr/models/__init__.py` (신규 생성)
  - `RrLevel` 모델
  - `Rr` 모델 (Self-Reference 포함)
  - `RrPeriod` 모델
- `alembic/versions/새파일_create_rnr_tables.py` (--autogenerate 후 검토)

**작업 순서** (CLAUDE.md DB 마이그레이션 규칙 준수)
1. SQLAlchemy 모델 먼저 작성
2. models를 alembic/env.py의 Base에 등록
3. `alembic revision --autogenerate -m "create_rnr_tables"` 실행
4. 생성된 파일 검토 및 인덱스 수동 추가

**의존성**: 없음 (첫 번째 코드 작업)

---

### TASK-03: Mock 데이터 시드 마이그레이션

**목적**: 개발/테스트용 R&R 샘플 데이터 삽입 (기존 직원 사번 활용)

**삽입 데이터**
1. `tb_rr_level`: 2026년 기준 레벨 6개 (전사~파트)
2. `tb_rr`: 계층 구조 샘플 (최소 5~8건)
   - 조직장 R&R 2~3건
   - 팀원 R&R 3~5건 (기존 직원 사번 활용, 상위 R&R 연결)
3. `tb_rr_period`: 각 R&R당 1~2개 기간

**작업 파일**
- `alembic/versions/새파일_seed_rnr_mock_data.py`

**주의사항**
- 기존 직원 사번(`emp_no`) 확인 후 사용 (hr_mgnt 테이블 기준)
- downgrade() 시 삽입된 mock 데이터 전체 삭제

**의존성**: TASK-02 완료 후

---

### TASK-04: 백엔드 rnr 도메인 스키마 + Repository

**목적**: Pydantic 스키마 정의와 DB 데이터 접근 로직 구현

**작업 파일**
- `server/app/domain/rnr/schemas/__init__.py`
  - `RrLevelResponse`
  - `RrPeriodSchema` (기간 입력/응답)
  - `RrResponse` (단일 R&R, 상위 R&R 명 포함, 기간 목록 포함)
  - `RrListResponse` → `{ items: list[RrResponse], total: int }`
  - `MyDepartmentItem` (겸직 부서 아이템)
  - `MyDepartmentsResponse` → `{ items: list[MyDepartmentItem], total: int }`
  - `ParentRrOption` (상위 R&R 드롭다운 항목)
  - `ParentRrOptionsResponse` → `{ items: list[ParentRrOption], total: int }`
  - `RrCreateRequest` (등록 요청: year, dept_code, parent_rr_id, title, content, periods)

- `server/app/domain/rnr/repositories/__init__.py`
  - `RrRepository` 클래스 (BaseRepository 상속)
  - `find_my_rr_list(emp_no, year)`: 내 R&R 목록 + 기간 + 상위 R&R명 조회
  - `find_my_departments(emp_no)`: 본소속 + 겸직 부서 목록 조회
  - `find_parent_rr_options(dept_code, year, position_code)`: 상위 R&R 선택 목록
  - `create_rr(data)`: R&R 등록 (tb_rr INSERT)
  - `create_rr_periods(rr_id, periods)`: 기간 등록 (tb_rr_period INSERT)

**주의사항 (가이드라인 준수)**
- 모든 Repository 메서드에 타입 힌트 필수
  ```python
  async def find_my_rr_list(self, emp_no: str, year: str) -> list[RrResponse]:
  async def create_rr(self, data: RrCreateRequest, emp_no: str) -> Rr:
  ```
- `create_rr`에서 `in_date` 저장 시 `datetime.utcnow()` 사용 (`datetime.now()` 금지)
- 데이터 미존재 처리 시 커스텀 예외 사용
  ```python
  from server.app.shared.exceptions import NotFoundException
  raise NotFoundException(message="R&R을 찾을 수 없습니다", details={"rr_id": rr_id})
  ```
- 로깅 필수: `from server.app.core.logging import get_logger` 사용

**의존성**: TASK-02 완료 후

---

### TASK-05: 백엔드 rnr Service + Router + 라우터 등록

**목적**: 비즈니스 로직 흐름 제어 및 API 엔드포인트 구현

**작업 파일**
- `server/app/domain/rnr/service.py`
  - `RrService` 클래스
  - `get_my_rr_list(emp_no, year)` → Repository 위임
  - `get_my_departments(emp_no)` → Repository 위임
  - `get_parent_rr_options(emp_no, dept_code, year)` → 직책 판단 후 Repository 위임
    - P005: 동일 부서의 LEADER R&R 조회
    - P001~P004: 상위 부서의 LEADER R&R 조회
  - `create_rr(emp_no, position_code, request)` → RR_TYPE 자동 결정 후 Repository 위임

- `server/app/domain/rnr/router.py`
  - `GET /v1/rnr/my?year={year}` → `get_my_rr_list`
  - `GET /v1/rnr/my-departments` → `get_my_departments`
  - `GET /v1/rnr/departments/{dept_code}/parent-rr?year={year}` → `get_parent_rr_options`
  - `POST /v1/rnr` → `create_rr`

- `server/app/core/routers.py`
  - rnr 라우터 등록 추가

**주의사항 (가이드라인 준수)**
- Router에서 현재 로그인 사용자 정보 추출: `auth` 도메인의 `get_current_user` Depends 패턴 참조
  ```python
  from server.app.domain.auth.dependencies import get_current_user

  @router.get("/my")
  async def get_my_rr(
      year: str = Query(default=...),
      current_user: TokenPayload = Depends(get_current_user),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- `get_parent_rr_options`에서 `position_code`는 `emp_no`로 `hr_mgnt` 테이블 조회 필요
  → TASK-04 `RrRepository`에 `find_employee_position(emp_no)` 메서드 추가 고려
- DB 세션 의존성 주입: `db: AsyncSession = Depends(get_db)` 패턴 사용
- 모든 Service/Router 메서드에 타입 힌트 필수
  ```python
  async def get_my_rr_list(self, emp_no: str, year: str) -> RrListResponse:
  async def create_rr(self, emp_no: str, position_code: str, request: RrCreateRequest) -> RrResponse:
  ```
- 커스텀 예외 사용: `BusinessLogicException`, `NotFoundException` 등 (`server.app.shared.exceptions`)
- 작업 전 CLAUDE.md 체크리스트 출력 후 사용자 승인 필수

**의존성**: TASK-04 완료 후

---

### TASK-06: 프론트엔드 rnr 도메인 기반 (types + api + store)

**목적**: 프론트엔드 API 통신 계층 및 상태 관리 구현

**작업 파일**
- `client/src/domains/rnr/types.ts`
  - `RrPeriod`: `{ seq, startDate, endDate }`
  - `RrItem`: `{ rrId, year, levelId, empNo, deptCode, rrType, parentRrId, parentTitle?, title, content, status, periods }`
  - `RrListResponse`: `{ items: RrItem[], total: number }`
  - `MyDepartmentItem`: `{ deptCode, deptName, isMain: boolean }`
  - `MyDepartmentsResponse`: `{ items: MyDepartmentItem[], total: number }`
  - `ParentRrOption`: `{ rrId, title, empNo, empName }`
  - `ParentRrOptionsResponse`: `{ items: ParentRrOption[], total: number }`
  - `RrCreateRequest`: `{ year, deptCode, parentRrId?, title, content, periods: PeriodInput[] }`
  - `PeriodInput`: `{ startDate: string, endDate: string }` (YYYYMM)

- `client/src/domains/rnr/api.ts` (apiClient 사용)
  - `getMyRrList(year)`: GET /v1/rnr/my
  - `getMyDepartments()`: GET /v1/rnr/my-departments
  - `getParentRrOptions(deptCode, year)`: GET /v1/rnr/departments/:dept_code/parent-rr
  - `createRr(request)`: POST /v1/rnr

- `client/src/domains/rnr/store.ts` (Zustand)
  - State: `myRrList`, `myDepartments`, `parentRrOptions`, `isLoading`, `error`
  - Actions: `fetchMyRrList`, `fetchMyDepartments`, `fetchParentRrOptions`, `createRr`

- `client/src/domains/rnr/index.ts` (내보내기)

**의존성**: TASK-05 완료 후 (API 스펙 확인)

---

### TASK-07: 프론트엔드 R&R 목록 컴포넌트 (카드 + 타임라인 바)

**목적**: R&R 카드 UI와 수행 기간 타임라인 바 컴포넌트 구현

**작업 파일**
- `client/src/domains/rnr/components/TimelineBar.tsx`
  - Props: `periods: RrPeriod[], year: string`
  - 1월~12월 가로축 표시
  - 각 기간 구간을 `bg-[#4950DC]` 막대로 렌더링
  - Tailwind CSS로 구현 (인라인 스타일 금지)
  - 월 레이블: Jan ~ Dec (약어, 균등 분할)

- `client/src/domains/rnr/components/RrCard.tsx`
  - Props: `rr: RrItem`
  - 상위 R&R 명 (있을 경우 표시, badge 스타일)
  - R&R 명 (title)
  - 상세 내용 (content, 3줄 말줄임)
  - `<TimelineBar />` 포함
  - Card 클래스: `bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`

- `client/src/domains/rnr/components/RrListSection.tsx`
  - Props: `items: RrItem[], isLoading, onRegisterClick`
  - Loading 상태, EmptyState, 카드 목록 분기 처리
  - EmptyState: `@/core/ui/EmptyState` 활용 (`ClipboardList` 아이콘, "등록하기" 액션)

- `client/src/domains/rnr/components/index.ts`

**의존성**: TASK-06 완료 후

---

### TASK-08: 프론트엔드 R&R 등록 모달

**목적**: R&R 등록 모달 컴포넌트 구현 (동적 기간 추가/삭제 포함)

**작업 파일**
- `client/src/domains/rnr/components/RrRegisterModal.tsx`

**모달 내부 동작 상세**

```
[기준 년도]  Select (현재 연도 기본값, ±2년 범위)
[소속 부서]  Select
              - 겸직 없음: 자동 선택 (비활성화)
              - 겸직 있음: 드롭다운 (본소속 + 겸직 부서 목록)
              → 부서 변경 시: 상위 R&R 목록 재조회

☐ 상위 R&R 없이 등록
[상위 R&R]  Select (체크 시 비활성화, 미체크 시 필수)
              - 선택된 부서 기준으로 API 조회
              - 직책 자동 판단: P005→동일부서 조직장 R&R / 그 외→상위부서 조직장 R&R

[R&R 명]    Input (필수)
[상세 내용] Textarea (선택)

[수행 기간]
  ┌─────────────────────┬──────────────────────┬──────┐
  │ 시작 월 (YYYY.MM)   │ 종료 월 (YYYY.MM)    │  삭제 │
  ├─────────────────────┼──────────────────────┼──────┤
  │ [Select YYYY] [MM]  │ [Select YYYY] [MM]   │  ✕  │
  ├─────────────────────┼──────────────────────┼──────┤
  │ [Select YYYY] [MM]  │ [Select YYYY] [MM]   │  ✕  │
  └─────────────────────┴──────────────────────┴──────┘
  [+ 기간 추가]   (최소 1개 필수, 삭제 시 1개 미만이면 삭제 불가)

[취소] [저장]
```

**유효성 검사**
- R&R 명: 필수
- 상위 R&R: "상위 없이 등록" 미체크 시 필수
- 수행 기간: 최소 1개, start_date ≤ end_date 검증

**피드백**
- 저장 성공: `toast.success('R&R이 등록되었습니다')`
- 저장 실패: `toast.error('등록에 실패했습니다')`
- 폼 오류: `InlineMessage` 각 필드 하단

**의존성**: TASK-06, TASK-07 완료 후

---

### TASK-09: 프론트엔드 나의 R&R 페이지 + 라우팅 연결

**목적**: 페이지 컴포넌트 조합과 App.tsx 라우팅 등록

**작업 파일**
- `client/src/domains/rnr/pages/MyRnrPage.tsx`
  - 페이지 진입 시 `fetchMyRrList(currentYear)` 자동 호출
  - 상단: 페이지 제목 + `[+ 새 R&R 등록]` 버튼
  - 본문: `<RrListSection />` (목록 또는 EmptyState)
  - 모달: `<RrRegisterModal />` (버튼 클릭 시 열림)
  - 등록 완료 후 목록 자동 새로고침

- `client/src/App.tsx`
  - `/goals/myRnr` 라우트 추가
  - 기존 라우팅 구조 파악 후 동일 패턴으로 추가

**의존성**: TASK-07, TASK-08 완료 후

---

## 8. Task 의존성 그래프

```
TASK-01 (메뉴 마이그레이션)
    │  (독립 실행 가능)

TASK-02 (DB 테이블 생성)
    │
    ├─→ TASK-03 (Mock 데이터)
    │
    └─→ TASK-04 (스키마 + Repository)
            │
            └─→ TASK-05 (Service + Router)
                    │
                    └─→ TASK-06 (FE types + api + store)
                            │
                            ├─→ TASK-07 (FE 카드 + 타임라인)
                            │        │
                            │        └─→ TASK-09 (FE 페이지)
                            │                 ↑
                            └─→ TASK-08 (FE 등록 모달)
```

> **TASK-01, TASK-02, TASK-03**은 병렬 진행 가능
> **TASK-04~09**는 순서 의존성 있음

---

## 9. 공통 규칙 체크리스트 (각 Task 시작 전 확인)

### Backend
- [ ] Service에서 직접 DB 접근 없음 (Repository 위임)
- [ ] 모든 함수/메서드에 타입 힌트 필수 (파라미터 + 반환값)
- [ ] 커스텀 예외 사용 (`server.app.shared.exceptions` — `NotFoundException`, `BusinessLogicException`)
- [ ] UTC 기준 시간 처리 (`datetime.utcnow()` — `datetime.now()` 금지)
- [ ] 리스트 API 응답: `{ items: [...], total: N }` 구조
- [ ] 로깅: `from server.app.core.logging import get_logger` 사용
- [ ] Router에서 `get_current_user` Depends 패턴 사용 (`auth` 도메인 참조)
- [ ] DB 세션 주입: `db: AsyncSession = Depends(get_db)` 패턴 사용
- [ ] 작업 전 CLAUDE.md 체크리스트 출력 후 사용자 승인

### Frontend
- [ ] `apiClient` 사용 (axios 직접 import 금지)
- [ ] 인라인 스타일 금지 (Tailwind CSS 사용)
- [ ] Tailwind v4 opacity: `bg-[#4950DC]/10` 형태 사용 (`bg-opacity-*` 금지)
- [ ] 브라우저 기본 다이얼로그 금지 (Toast, Modal 사용)
- [ ] `any` 타입 금지

### Git
- [ ] 커밋 메시지 한글 작성
- [ ] 세션 URL 포함: `https://claude.ai/code/session_xxxxx`
- [ ] 브랜치: `claude/rnr-management-roadmap-skojL`

---

## 10. 향후 확장 계획 (이번 범위 외)

- **TASK-10**: 전체 R&R 관리 (M002_2, `/goals/allRnr`) — 조직 전체 R&R 조회
- **TASK-11**: 조직원 R&R 현황 (M002_3, `/goals/teamRnr`) — 조직장 전용 현황 뷰
- **TASK-12**: R&R 확정/수정/삭제 기능
- **TASK-13**: R&R 상태 관리 (N→R→Y 워크플로우)
