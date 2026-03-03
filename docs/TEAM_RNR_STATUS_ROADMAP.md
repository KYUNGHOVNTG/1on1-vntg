# 조직원 R&R 현황 + 나의 R&R 관리 토글뷰 개발 로드맵

> **작성일**: 2026-03-03
> **대상 메뉴**: R&R 관리 > 조직원 R&R 현황 (M002_3, `/goals/teamRnr`)
>               R&R 관리 > 나의 R&R 관리 (M002_1, `/goals/myRnr`) — UI 수정
> **브랜치**: `claude/add-team-rnr-status-vKetx`
> **기반 문서**: `docs/RNR_MY_RNR_ROADMAP.md` (TASK-01~09 모두 완료된 상태 기준)

---

## 1. 개발 목표

### 1.1 조직원 R&R 현황 (신규)

리더(P001~P004)가 **본인 부서 및 하위 부서 전체**에 속한 팀원들의 R&R을 통합 조회합니다.

| 기능 | 설명 |
|------|------|
| 조회조건 | 부서(SELECT), 직책명(SELECT), 성명(INPUT) |
| 간단히 뷰 | 그리드: 팀원명 · R&R명 · 수행 일정(타임라인) |
| 자세히 뷰 | 아코디언: 팀원명 · 부서명 · R&R 갯수 (펼치면 R&R별 상세 일정) |
| 대상 사용자 | 조직장 직책만 접근 (P001 ~ P004) |

### 1.2 나의 R&R 관리 UI 개선 (기존 화면 수정)

기존 카드 전용 뷰에 **토글버튼탭**을 추가합니다.

| 탭 | 설명 |
|----|------|
| 간단히 (기본) | 그리드 형태: R&R명 · 수행 일정(타임라인) |
| 자세히 | 기존 카드 뷰 유지 (상위 R&R · 상세 내용 · 타임라인) |

---

## 2. 현재 코드베이스 현황 분석

### 2.1 완료된 항목 (재사용 가능)

| 레이어 | 파일 | 재사용 포인트 |
|--------|------|---------------|
| DB 모델 | `server/app/domain/rnr/models/__init__.py` | `Rr`, `RrPeriod`, `RrLevel` 그대로 사용 |
| Repository | `server/app/domain/rnr/repositories/__init__.py` | `find_my_rr_list`, `_find_upper_dept_code` 참조 |
| Service | `server/app/domain/rnr/service.py` | 패턴 참조 (user_id → emp_no 흐름) |
| Router | `server/app/domain/rnr/router.py` | prefix `/rnr` 공유, 신규 엔드포인트 추가 |
| Schema | `server/app/domain/rnr/schemas/__init__.py` | `RrResponse`, `RrPeriodSchema` 재사용 |
| FE 타입 | `client/src/domains/rnr/types.ts` | `RrItem`, `RrPeriod` 재사용 |
| FE API | `client/src/domains/rnr/api.ts` | 신규 함수 추가 |
| FE Store | `client/src/domains/rnr/store.ts` | 신규 상태/액션 추가 |
| FE 컴포넌트 | `client/src/domains/rnr/components/TimelineBar.tsx` | 그대로 재사용 |
| FE 페이지 | `client/src/domains/rnr/pages/MyRnrPage.tsx` | 토글탭 UI 추가 (수정 대상) |

### 2.2 기존 메뉴 현황 확인 필요

Migration `k8l9m0n1o2p3_update_rnr_menu_data.py`에서 M002_3 처리 여부 확인:

```
현재 DB 메뉴 코드 목록 (260120_cm_menu.txt 기준):
- M002     : R&R 관리
- M002_1   : 나의 R&R 관리 → /goals/myRnr  (완료)
- M002_2   : 전체 R&R 관리  → /goals/allRnr (미구현)
- M002_3   : 조직원 R&R 현황 → /goals/teamRnr (이번 개발)
```

> **주의**: TASK-03에서 M002_3 메뉴 존재 여부와 리더 권한(P001~P004) 부여 여부를 반드시 확인 후 진행

### 2.3 HR 도메인 핵심 테이블 (팀 R&R 조회에 필요)

```
cm_department      : dept_code, dept_name, upper_dept_code  ← 재귀 하위 부서 탐색
hr_mgnt            : emp_no, name_kor, dept_code, position_code  ← 팀원 목록
tb_rr              : rr_id, emp_no, dept_code, year, title, periods  ← R&R 데이터
```

직책 코드 정의 (기존 CLAUDE.md / Repository 상수 기준):
```python
LEADER_POSITION_CODES = ["P001", "P002", "P003", "P004"]  # 조직장
MEMBER_POSITION_CODE = "P005"  # 팀원
```

---

## 3. 아키텍처 결정 사항

### 3.1 팀 R&R 조회 전략

```
리더 로그인 → 리더의 dept_code 조회
    ↓
cm_department 재귀 조회 (CTE 또는 Python 루프)로 하위 부서 코드 목록 수집
    ↓
해당 부서 코드들에 속한 hr_mgnt 직원 조회 (조회조건 필터 적용)
    ↓
각 직원의 tb_rr + tb_rr_period 조회
    ↓
응답: 직원별로 그룹화된 R&R 목록
```

### 3.2 응답 구조

```python
# 자세히 뷰 / 공통 기반 응답
class TeamRrEmployeeItem(BaseModel):
    emp_no: str
    emp_name: str
    dept_code: str
    dept_name: str
    position_name: str
    rr_count: int
    rr_list: list[RrResponse]  # 기존 RrResponse 재사용

class TeamRrListResponse(BaseModel):
    items: list[TeamRrEmployeeItem]
    total: int  # 직원 수 기준
```

> **설계 원칙**: 단일 API로 `{items: TeamRrEmployeeItem[], total}` 반환.
> 프론트엔드에서 '간단히'(flatten) / '자세히'(group) 두 뷰를 클라이언트에서 렌더링.

### 3.3 조회조건 API

```
GET /v1/rnr/team-filter-options
응답: {
  departments: [{dept_code, dept_name}],   // 리더의 부서 + 하위 부서
  positions: [{position_code, position_name}]  // hr_mgnt에서 distinct
}
```

### 3.4 나의 R&R 토글뷰 구조

```tsx
// MyRnrPage.tsx 변경 구조
<ToggleTabs
  options={[{ key: 'simple', label: '간단히' }, { key: 'detail', label: '자세히' }]}
  defaultValue="simple"
/>

// 간단히 뷰: 그리드 테이블
<MyRnrSimpleGrid items={myRrList} />

// 자세히 뷰: 기존 카드 뷰
<RrListSection items={myRrList} ... />
```

---

## 4. API 설계

### Backend 엔드포인트 추가 (prefix: `/v1/rnr`)

| Method | Path | 설명 | 접근 권한 |
|--------|------|------|-----------|
| `GET` | `/v1/rnr/team` | 팀원 R&R 현황 조회 | 리더만 (P001~P004) |
| `GET` | `/v1/rnr/team-filter-options` | 조회조건 선택 목록 (부서 · 직책) | 리더만 |

### 쿼리 파라미터

```
GET /v1/rnr/team
  - year: str = "YYYY" (기본: 현재 연도)
  - dept_code: str | None = None  (필터)
  - position_code: str | None = None  (필터)
  - emp_name: str | None = None  (필터, 성명 부분 검색)
```

---

## 5. 프론트엔드 UI 설계

### 5.1 조직원 R&R 현황 페이지 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  R&R 관리 > 조직원 R&R 현황                              │
│  조직원 R&R 현황                                         │
├────────────────────────────────┬────────────────────────┤
│ 부서 [전체 ▼]  직책명 [전체 ▼] │ 성명 [입력________]  │
├─────────────────────────────────────────────────────────┤
│                     [간단히]  [자세히]                   │
├─────────────────────────────────────────────────────────┤
│ ■ 간단히 뷰 (기본)                                       │
│ ┌──────────┬─────────────────────┬────────────────────┐ │
│ │ 팀원명   │ R&R명               │ 수행 일정          │ │
│ ├──────────┼─────────────────────┼────────────────────┤ │
│ │ 홍길동   │ 서비스 기획 및...   │ ████░░░░████████   │ │
│ │ 홍길동   │ 팀원 온보딩 지원    │ ████████░░░░░░░░   │ │
│ │ 김영희   │ 데이터 분석 업무    │ ░░░░████████████   │ │
│ └──────────┴─────────────────────┴────────────────────┘ │
│                                                         │
│ ■ 자세히 뷰                                             │
│ ▶ [홍길동] · 개발팀 · 2건         ← 아코디언 기본 닫힘 │
│ ▼ [김영희] · 기획팀 · 1건         ← 펼쳐진 상태       │
│   ├ R&R명: 데이터 분석 업무                             │
│   │  Jan ───── Mar        Jul ───── Dec                │
│   │  ████████████          ████████████████            │
│   └─────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────┘
```

### 5.2 나의 R&R 관리 토글뷰

```
┌─────────────────────────────────────────────────────────┐
│  나의 R&R 관리                     [+ 새 R&R 등록]      │
│  2026년 기준 · 총 4건                                   │
│                          [간단히] [자세히]              │
├─────────────────────────────────────────────────────────┤
│ ■ 간단히 뷰 (기본)                                       │
│ ┌──────────────────────────┬────────────────────────┐   │
│ │ R&R명                    │ 수행 일정              │   │
│ ├──────────────────────────┼────────────────────────┤   │
│ │ 서비스 기획 및 로드맵 수립│ ██░░░░░░████████████   │   │
│ │ 팀원 온보딩 지원         │ ████████░░░░░░░░░░░░   │   │
│ └──────────────────────────┴────────────────────────┘   │
│                                                         │
│ ■ 자세히 뷰 (기존 카드 그대로)                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │  상위: [팀 전략 목표 달성]           [수정] [삭제]│   │
│ │  ■ 서비스 기획 및 로드맵 수립                    │   │
│ │  서비스 전략을 수립하고 ...   │ Jan── Mar Jul──Dec│   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 디렉토리 구조 (신규/변경 파일)

### Backend (추가 파일)

```
server/app/domain/rnr/
├── schemas/__init__.py          ← TeamRrEmployeeItem, TeamRrListResponse 추가
├── repositories/__init__.py     ← find_team_rr_list, find_sub_dept_codes 등 추가
├── service.py                   ← get_team_rr_list, get_team_filter_options 추가
└── router.py                    ← GET /team, GET /team-filter-options 추가
```

### Frontend (추가/수정 파일)

```
client/src/domains/rnr/
├── types.ts                          ← TeamRrEmployeeItem, TeamFilterOptions 타입 추가
├── api.ts                            ← getTeamRrList, getTeamFilterOptions 추가
├── store.ts                          ← 팀 R&R 상태/액션 추가
├── components/
│   ├── index.ts                      ← 신규 컴포넌트 export 추가
│   ├── ToggleTabs.tsx                ← [신규] 간단히/자세히 토글 버튼 컴포넌트
│   ├── MyRnrSimpleGrid.tsx           ← [신규] 나의 R&R 간단히 그리드
│   ├── TeamRnrSearchBar.tsx          ← [신규] 부서/직책/성명 검색 필터
│   ├── TeamRnrSimpleGrid.tsx         ← [신규] 팀 R&R 간단히 그리드
│   └── TeamRnrDetailAccordion.tsx    ← [신규] 팀 R&R 자세히 아코디언
├── pages/
│   ├── MyRnrPage.tsx                 ← [수정] 토글탭 추가
│   └── TeamRnrStatusPage.tsx         ← [신규] 조직원 R&R 현황 페이지
└── index.ts                          ← TeamRnrStatusPage export 추가
```

---

## 7. Task 분할

> **원칙**: 각 Task는 AI 에이전트가 1회 세션에서 완결 가능한 단위로 정의
> **실행 순서**: TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06 → TASK-07 → TASK-08
> TASK-01~03은 병렬 진행 가능, TASK-04~08은 순서 의존성 있음

---

### TASK-01: 백엔드 팀 R&R 스키마 + Repository 추가

**목적**: 팀 R&R 조회에 필요한 Pydantic 스키마와 Repository 메서드 구현

**수정 파일**
- `server/app/domain/rnr/schemas/__init__.py`

**추가할 스키마**

```python
class TeamRrFilterOptionItem(BaseModel):
    """부서/직책 SELECT 옵션 아이템"""
    code: str
    name: str

class TeamRrFilterOptions(BaseModel):
    """팀 R&R 조회조건 선택 목록"""
    departments: list[TeamRrFilterOptionItem]
    positions: list[TeamRrFilterOptionItem]

class TeamRrEmployeeItem(BaseModel):
    """팀원별 R&R 아이템 (자세히 뷰 기반)"""
    emp_no: str
    emp_name: str
    dept_code: str
    dept_name: str
    position_code: str
    position_name: str
    rr_count: int
    rr_list: list[RrResponse]  # 기존 스키마 재사용

class TeamRrListResponse(BaseModel):
    """팀 R&R 목록 응답 — { items: list[TeamRrEmployeeItem], total: int }"""
    items: list[TeamRrEmployeeItem]
    total: int  # 직원 수 기준
```

**수정 파일**
- `server/app/domain/rnr/repositories/__init__.py`

**추가할 Repository 메서드**

```python
async def find_sub_dept_codes(self, leader_emp_no: str) -> list[str]:
    """
    리더의 소속 부서 + 모든 하위 부서 코드를 재귀 조회합니다.
    PostgreSQL CTE(WITH RECURSIVE) 활용.
    """

async def find_team_rr_list(
    self,
    dept_codes: list[str],
    year: str,
    dept_code_filter: str | None,
    position_code_filter: str | None,
    emp_name_filter: str | None,
) -> TeamRrListResponse:
    """
    부서 코드 목록 기준으로 팀원별 R&R 목록을 조회합니다.
    - hr_mgnt JOIN tb_rr JOIN tb_rr_period JOIN cm_department
    - 직원별로 그룹화하여 TeamRrEmployeeItem 목록 반환
    - 조회조건 필터 적용 (부서/직책/성명)
    """

async def find_team_filter_options(
    self, dept_codes: list[str]
) -> TeamRrFilterOptions:
    """
    조회조건 SELECT 목록을 반환합니다.
    - departments: 리더 부서 + 하위 부서 목록 (cm_department)
    - positions: 해당 부서 소속 직원들의 직책 목록 (hr_mgnt distinct)
    """
```

**주의사항**
- `WITH RECURSIVE` CTE로 하위 부서 재귀 조회 (PostgreSQL 지원)
- 직원별 그룹화는 Python dict로 처리 (DB에서 원자 단위 조회 후)
- `selectinload(Rr.periods)`, `selectinload(Rr.parent)` 필수
- 타입 힌트 필수, UTC 시간 사용
- 기존 `RrResponse._to_rr_response()` 헬퍼 재사용

**의존성**: 없음 (기존 스키마/모델 파일 수정)

---

### TASK-02: 백엔드 팀 R&R Service + Router 엔드포인트 추가

**목적**: 팀 R&R 비즈니스 로직 및 API 엔드포인트 구현

**수정 파일**
- `server/app/domain/rnr/service.py`

**추가할 Service 메서드**

```python
async def get_team_rr_list(
    self,
    user_id: str,
    year: str,
    dept_code_filter: str | None,
    position_code_filter: str | None,
    emp_name_filter: str | None,
) -> TeamRrListResponse:
    """
    처리 순서:
    1. user_id → emp_no (리더 사번)
    2. 리더 직책 검증 (P001~P004 아니면 권한 에러)
    3. find_sub_dept_codes(emp_no) → 부서 코드 목록
    4. find_team_rr_list(dept_codes, year, filters) → 팀원 R&R 목록
    """

async def get_team_filter_options(self, user_id: str) -> TeamRrFilterOptions:
    """
    처리 순서:
    1. user_id → emp_no
    2. find_sub_dept_codes(emp_no) → 부서 코드 목록
    3. find_team_filter_options(dept_codes) → 조회조건 선택 목록
    """
```

**수정 파일**
- `server/app/domain/rnr/router.py`

**추가할 엔드포인트**

```python
@router.get("/team", response_model=TeamRrListResponse)
async def get_team_rr_list(
    year: str = Query(default=_CURRENT_YEAR, pattern=r"^\d{4}$"),
    dept_code: str | None = Query(default=None),
    position_code: str | None = Query(default=None),
    emp_name: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TeamRrListResponse: ...

@router.get("/team-filter-options", response_model=TeamRrFilterOptions)
async def get_team_filter_options(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TeamRrFilterOptions: ...
```

**주의사항**
- 리더 권한 검증: P001~P004가 아닌 경우 `server.app.shared.exceptions.ForbiddenException` (또는 적절한 커스텀 예외) 반환
- `get_current_user_id` Depends 패턴 (기존 패턴 그대로)
- 로깅 필수

**의존성**: TASK-01 완료 후

---

### TASK-03: 메뉴/권한 마이그레이션 확인 및 처리

**목적**: M002_3 "조직원 R&R 현황" 메뉴 존재 여부 확인 후 신규 마이그레이션 작성

**선행 작업 (필수)**
1. 기존 마이그레이션 확인:
   ```bash
   grep -r "M002_3\|teamRnr\|조직원" alembic/versions/
   grep -r "M002_3\|teamRnr\|조직원" migration/
   ```
2. DB 현재 상태 확인 (메뉴 코드 존재 여부)

**마이그레이션 작성 대상**: `alembic/versions/새파일_add_team_rnr_menu_permissions.py`

**upgrade() 내용**

```python
def upgrade() -> None:
    # 1. M002_3 메뉴 항목 (미존재 시에만 추가)
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
        VALUES ('M002_3', '조직원 R&R 현황', 'M002', 2, '/goals/teamRnr', 3, 'system')
        ON CONFLICT (menu_code) DO UPDATE
          SET menu_name = '조직원 R&R 현황',
              menu_url  = '/goals/teamRnr'
    """)

    # 2. 리더(P001~P004) 권한 부여
    op.execute("""
        INSERT INTO cm_position_menu (position_code, menu_code, in_user)
        VALUES
            ('P001', 'M002_3', 'system'),
            ('P002', 'M002_3', 'system'),
            ('P003', 'M002_3', 'system'),
            ('P004', 'M002_3', 'system')
        ON CONFLICT (position_code, menu_code) DO NOTHING
    """)

def downgrade() -> None:
    op.execute("DELETE FROM cm_position_menu WHERE menu_code = 'M002_3'")
    op.execute("DELETE FROM cm_menu WHERE menu_code = 'M002_3'")
```

**주의사항**
- 기존 마이그레이션에서 M002_3 처리 여부 반드시 grep으로 확인
- `ON CONFLICT DO NOTHING` / `DO UPDATE`로 중복 방지
- P005(팀원)는 이 메뉴에 접근 불가 (미부여)
- downgrade() 필수 구현

**의존성**: 없음 (병렬 진행 가능)

---

### TASK-04: 프론트엔드 팀 R&R 타입 + API + Store 추가

**목적**: 팀 R&R 조회에 필요한 프론트엔드 데이터 계층 구현

**수정 파일**
- `client/src/domains/rnr/types.ts`

**추가할 타입**

```typescript
/** 팀 R&R 조회조건 옵션 아이템 */
export interface TeamRrFilterOptionItem {
  code: string;
  name: string;
}

/** 팀 R&R 조회조건 선택 목록 */
export interface TeamRrFilterOptions {
  departments: TeamRrFilterOptionItem[];
  positions: TeamRrFilterOptionItem[];
}

/** 팀원별 R&R 아이템 (자세히 뷰 기반) */
export interface TeamRrEmployeeItem {
  emp_no: string;
  emp_name: string;
  dept_code: string;
  dept_name: string;
  position_code: string;
  position_name: string;
  rr_count: number;
  rr_list: RrItem[];  // 기존 RrItem 재사용
}

/** 팀 R&R 목록 응답 */
export interface TeamRrListResponse {
  items: TeamRrEmployeeItem[];
  total: number;
}
```

**수정 파일**
- `client/src/domains/rnr/api.ts`

**추가할 API 함수**

```typescript
export async function getTeamRrList(params: {
  year?: string;
  dept_code?: string;
  position_code?: string;
  emp_name?: string;
}): Promise<TeamRrListResponse>

export async function getTeamFilterOptions(): Promise<TeamRrFilterOptions>
```

**수정 파일**
- `client/src/domains/rnr/store.ts`

**추가할 상태/액션**

```typescript
// 상태 추가
teamRrList: TeamRrEmployeeItem[];
teamRrTotal: number;
teamFilterOptions: TeamRrFilterOptions | null;
isLoading: {
  ...기존...,
  teamRrList: boolean;
  teamFilterOptions: boolean;
};

// 액션 추가
fetchTeamRrList: (params: TeamRrSearchParams) => Promise<void>;
fetchTeamFilterOptions: () => Promise<void>;
```

**주의사항**
- axios 직접 import 금지 → `apiClient` 사용
- `any` 타입 금지

**의존성**: TASK-02 완료 후 (API 스펙 확인)

---

### TASK-05: 프론트엔드 공통 ToggleTabs + MyRnrSimpleGrid 컴포넌트

**목적**: 두 페이지에서 공유하는 토글탭 컴포넌트와 나의 R&R 간단히 그리드 구현

**신규 파일**
- `client/src/domains/rnr/components/ToggleTabs.tsx`

```typescript
interface ToggleTabOption {
  key: string;
  label: string;
}
interface ToggleTabsProps {
  options: ToggleTabOption[];
  value: string;
  onChange: (key: string) => void;
}
```

디자인 가이드:
- 선택됨: `bg-[#4950DC] text-white rounded-xl` (Primary 버튼 스타일)
- 미선택: `bg-white border border-gray-200 text-gray-600 rounded-xl`
- 두 버튼을 `inline-flex`로 묶어 탭 그룹처럼 표현

**신규 파일**
- `client/src/domains/rnr/components/MyRnrSimpleGrid.tsx`

```typescript
interface MyRnrSimpleGridProps {
  items: RrItem[];
  year: string;
}
```

컬럼 구성:
| 컬럼 | 내용 | 비율 |
|------|------|------|
| R&R명 | `rr.title` (한 줄 말줄임) | 50% |
| 수행 일정 | `<TimelineBar periods={rr.periods} year={year} />` | 50% |

**수정 파일**
- `client/src/domains/rnr/components/index.ts` — 신규 컴포넌트 export 추가

**주의사항**
- 인라인 스타일 금지, Tailwind v4 opacity 규칙 준수 (`bg-[#4950DC]/10`)
- Tailwind `text-[10px]` 금지 → `text-xs` 사용 (text-sm 기준)
- 각 행에 `hover:bg-gray-50 transition-colors` 적용

**의존성**: TASK-04 완료 후

---

### TASK-06: 프론트엔드 TeamRnrSearchBar + TeamRnrSimpleGrid + TeamRnrDetailAccordion

**목적**: 조직원 R&R 현황 페이지에서 사용할 전용 컴포넌트 3종 구현

**신규 파일 1**: `client/src/domains/rnr/components/TeamRnrSearchBar.tsx`

```typescript
interface TeamRnrSearchBarProps {
  filterOptions: TeamRrFilterOptions | null;
  isLoading: boolean;
  onSearch: (params: { dept_code?: string; position_code?: string; emp_name?: string }) => void;
}
```

레이아웃:
- 부서 `<Select>` (width: ~200px)
- 직책명 `<Select>` (width: ~160px)
- 성명 `<Input>` (width: ~200px, placeholder: "성명 입력")
- 가로 배치, `gap-3 flex items-center flex-wrap`

**신규 파일 2**: `client/src/domains/rnr/components/TeamRnrSimpleGrid.tsx`

```typescript
interface TeamRnrSimpleGridProps {
  items: TeamRrEmployeeItem[];
  year: string;
}
```

데이터 변환: `items`를 flatten하여 `{emp_name, rr_title, periods}` 행 목록으로 변환.

컬럼 구성:
| 컬럼 | 내용 | 비율 |
|------|------|------|
| 팀원명 | `emp_name` | 15% |
| R&R명 | `rr.title` | 35% |
| 수행 일정 | `<TimelineBar periods={rr.periods} year={year} />` | 50% |

- 팀원의 첫 번째 행에만 이름 표시, 이후 같은 직원 행은 빈칸 (rowspan 효과를 배경색으로 구분)
- 또는 모든 행에 이름 표시 (단순 구현)

**신규 파일 3**: `client/src/domains/rnr/components/TeamRnrDetailAccordion.tsx`

```typescript
interface TeamRnrDetailAccordionProps {
  items: TeamRrEmployeeItem[];
  year: string;
}
```

아코디언 행 구조:
- **헤더 (항상 보임)**: `▶/▼ [팀원명] · [부서명] · [직책명] · R&R [N]건`
- **펼침 내용**: 각 R&R 아이템 (R&R명 + `<TimelineBar />`)
- 초기 상태: 모두 닫힘 (기본값)
- 클릭 시 토글 (useState로 열린 emp_no 추적)

스타일 가이드:
- 아코디언 헤더: `p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors`
- 아코디언 내용: `px-6 pb-4 space-y-3 border-t border-gray-100`
- R&R 아이템: `flex flex-col gap-1` (R&R명 + 타임라인)

**수정 파일**
- `client/src/domains/rnr/components/index.ts` — 3종 컴포넌트 export 추가

**의존성**: TASK-05 완료 후 (ToggleTabs, TimelineBar 재사용)

---

### TASK-07: 프론트엔드 조직원 R&R 현황 페이지 + 라우팅 연결

**목적**: 전체 페이지 조합과 App.tsx 라우팅 등록

**신규 파일**
- `client/src/domains/rnr/pages/TeamRnrStatusPage.tsx`

```typescript
const CURRENT_YEAR = String(new Date().getFullYear());

export const TeamRnrStatusPage: React.FC = () => {
  // useRnrStore에서 팀 R&R 상태 구독
  // 초기 진입 시 fetchTeamFilterOptions() + fetchTeamRrList({year}) 자동 호출
  // 조회조건 변경 시 fetchTeamRrList(params) 재호출
  // toggleView state: 'simple' | 'detail'
}
```

페이지 구성:
1. `<Breadcrumb items={[{ label: 'R&R 관리' }, { label: '조직원 R&R 현황' }]} />`
2. 페이지 헤더 (제목 + 조회 기준 연도 + 총 직원 수)
3. `<TeamRnrSearchBar>` (조회조건)
4. `<ToggleTabs>` (간단히/자세히)
5. 뷰 분기:
   - `'simple'` → `<TeamRnrSimpleGrid items={teamRrList} year={currentYear} />`
   - `'detail'` → `<TeamRnrDetailAccordion items={teamRrList} year={currentYear} />`
6. 로딩 상태 처리 (Loader2 스피너)
7. 빈 상태 처리 (`<EmptyState>`)

**수정 파일**
- `client/src/domains/rnr/index.ts` — `TeamRnrStatusPage` export 추가
- `client/src/App.tsx`
  ```tsx
  import { MyRnrPage, TeamRnrStatusPage } from './domains/rnr';
  // ...
  <Route path="/goals/teamRnr" element={<TeamRnrStatusPage />} />
  ```

**주의사항**
- 페이지 진입 시 자동 조회 (useEffect)
- 조회조건 변경 시 즉시 재조회 (debounce 불필요, 버튼 검색 방식도 가능)
- Empty state: `Users` 아이콘, "조건에 맞는 팀원 R&R이 없습니다" 메시지

**의존성**: TASK-05, TASK-06 완료 후

---

### TASK-08: 프론트엔드 나의 R&R 관리 페이지 토글뷰 적용

**목적**: 기존 `MyRnrPage.tsx`에 '간단히'/'자세히' 토글뷰 추가

**수정 파일**
- `client/src/domains/rnr/pages/MyRnrPage.tsx`

**변경 내용**

```typescript
// 추가할 상태
const [viewMode, setViewMode] = useState<'simple' | 'detail'>('simple');

// 헤더 영역에 토글탭 추가
<div className="flex items-center justify-between">
  <div>제목 + 총 N건</div>
  <div className="flex items-center gap-3">
    <ToggleTabs
      options={[{ key: 'simple', label: '간단히' }, { key: 'detail', label: '자세히' }]}
      value={viewMode}
      onChange={(key) => setViewMode(key as 'simple' | 'detail')}
    />
    <Button variant="primary" ...>새 R&R 등록</Button>
  </div>
</div>

// 뷰 분기 (기존 <RrListSection> 조건부 렌더링으로 교체)
{viewMode === 'simple' ? (
  <MyRnrSimpleGrid items={myRrList} year={CURRENT_YEAR} />
) : (
  <RrListSection items={myRrList} isLoading={isLoading.myRrList} ... />
)}
```

**주의사항**
- 로딩 중일 때는 두 뷰 모두 Loader2 스피너 표시
- 빈 상태: `MyRnrSimpleGrid`에서도 `<EmptyState>` 처리 필요 (내부 또는 페이지에서)
- `CURRENT_YEAR`는 기존 상수 그대로 사용
- 기존 수정/삭제/등록 기능은 '자세히' 뷰에서만 제공 (간단히는 읽기 전용)

**의존성**: TASK-05 완료 후 (ToggleTabs, MyRnrSimpleGrid 컴포넌트)

---

## 8. Task 의존성 그래프

```
TASK-01 (BE 스키마 + Repository)
    │
    └─→ TASK-02 (BE Service + Router)
                │
TASK-03 (메뉴/권한 마이그레이션) ← 병렬 가능
                │
                └─→ TASK-04 (FE 타입 + API + Store)
                            │
                            └─→ TASK-05 (ToggleTabs + MyRnrSimpleGrid)
                                        │
                                        ├─→ TASK-06 (TeamRnrSearchBar + Grid + Accordion)
                                        │              │
                                        │              └─→ TASK-07 (TeamRnrStatusPage + 라우팅)
                                        │
                                        └─→ TASK-08 (MyRnrPage 토글뷰 수정)
```

> TASK-01, TASK-03은 병렬 진행 가능
> TASK-07, TASK-08은 병렬 진행 가능 (TASK-05, TASK-06 완료 후)

---

## 9. 공통 규칙 체크리스트 (각 Task 시작 전 확인)

### Backend
- [ ] Service에서 직접 DB 접근 없음 (Repository 위임)
- [ ] 모든 함수/메서드에 타입 힌트 필수 (파라미터 + 반환값)
- [ ] 커스텀 예외 사용 (`server.app.shared.exceptions`)
- [ ] UTC 기준 시간 처리 (`datetime.utcnow()`)
- [ ] 리스트 API 응답: `{ items: [...], total: N }` 구조
- [ ] 로깅: `from server.app.core.logging import get_logger` 사용
- [ ] DB 마이그레이션 작업 전 기존 데이터 grep 확인 필수

### Frontend
- [ ] `apiClient` 사용 (axios 직접 import 금지)
- [ ] 인라인 스타일 금지 (Tailwind CSS만 사용)
- [ ] Tailwind v4 opacity: `bg-[#4950DC]/10` 형태 (`bg-opacity-*` 금지)
- [ ] 브라우저 기본 다이얼로그 금지
- [ ] `any` 타입 금지
- [ ] `text-[10px]` 사용 금지 (최소 `text-xs`)

### Git
- [ ] 커밋 메시지 한글 작성 (50자 이내 제목 + 본문)
- [ ] 세션 URL 포함: `https://claude.ai/code/session_xxxxx`
- [ ] 브랜치: `claude/add-team-rnr-status-vKetx`

---

## 10. 작업 전 필수 확인 사항 (AI 에이전트용)

### TASK-01 시작 전
1. `server/app/domain/rnr/schemas/__init__.py` 전체 내용 확인
2. `server/app/domain/rnr/repositories/__init__.py` 전체 내용 확인
3. `server/app/domain/hr/models/department.py` — `CMDepartment` 필드 확인 (upper_dept_code)
4. `server/app/domain/hr/models/employee.py` — `HRMgnt` 필드 확인 (position_code)

### TASK-03 시작 전
```bash
grep -r "M002_3\|teamRnr\|조직원 R&R 현황" alembic/versions/
grep -r "M002_3\|teamRnr" migration/
```

### TASK-04 시작 전
1. `client/src/domains/rnr/types.ts` 전체 내용 확인
2. `client/src/domains/rnr/api.ts` 전체 내용 확인
3. `client/src/domains/rnr/store.ts` 전체 내용 확인

### TASK-05~08 시작 전
1. `client/src/domains/rnr/components/TimelineBar.tsx` 확인 (재사용)
2. `client/src/domains/rnr/components/RrCard.tsx` 확인
3. `client/src/core/ui/` 디렉토리에서 사용 가능한 공통 컴포넌트 확인
   - `Select`, `Input`, `Button`, `EmptyState`, `Breadcrumb`
4. `client/src/domains/rnr/pages/MyRnrPage.tsx` 전체 내용 확인 (TASK-08)
