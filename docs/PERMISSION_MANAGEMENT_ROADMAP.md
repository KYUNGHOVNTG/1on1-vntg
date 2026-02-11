# 권한 관리 개발 로드맵

## 📋 목차
1. [현재 권한 구조 분석](#1-현재-권한-구조-분석)
2. [개발 목표](#2-개발-목표)
3. [데이터베이스 구조](#3-데이터베이스-구조)
4. [권한 부여 로직](#4-권한-부여-로직)
5. [개발 범위](#5-개발-범위)
6. [작업 단계 (TASK)](#6-작업-단계-task)

---

## 1. 현재 권한 구조 분석

### 1.1 메뉴 타입 (menu_type)
현재 시스템은 메뉴를 2가지 타입으로 구분합니다:

- **COMMON**: 일반 사용자용 메뉴
- **ADMIN**: 관리자 전용 메뉴

### 1.2 권한 부여 방식
메뉴 접근 권한은 **2단계 계층 구조**로 관리됩니다:

#### ① 직책별 권한 (기본 권한)
- 테이블: `cm_position_menu`
- 직책 코드(position_code)별로 접근 가능한 메뉴 정의
- 예: HR(P001) 직책은 M001, M002 메뉴 접근 가능

#### ② 사용자별 권한 (예외 권한)
- 테이블: `cm_user_menu`
- 개별 사용자(user_id)에게 추가로 부여되는 메뉴 권한
- 직책별 권한과 **합산(UNION)**되어 최종 권한 결정
- 예: 일반 사용자(COMMON)여도 개인별로 ADMIN 메뉴 부여 가능

### 1.3 현재 메뉴 조회 로직
`MenuRepository.get_menus_by_user()` 메서드:

```python
최종 메뉴 = (직책별 COMMON 메뉴) ∪ (사용자별 COMMON 메뉴) ∪ (역할이 R001이면 전체 ADMIN 메뉴)
```

**문제점**:
- 현재는 역할(role_code)이 R001(시스템 관리자)이면 **모든 ADMIN 메뉴**를 자동 부여
- 직책별/사용자별로 **ADMIN 메뉴를 선택적으로 부여할 수 없음**
- 권한 관리 UI가 없어 직접 DB 조작 필요

---

## 2. 개발 목표

### 2.1 핵심 요구사항
1. **직책별 메뉴 권한 부여**: 직책 코드별로 COMMON/ADMIN 메뉴 모두 부여 가능
2. **사용자별 메뉴 권한 부여**: 개별 사용자에게 COMMON/ADMIN 메뉴 추가 부여 가능
3. **권한 관리 UI**: 관리자가 웹 화면에서 권한을 쉽게 설정할 수 있는 인터페이스

### 2.2 예시 시나리오
- **직책별**: "팀장(P002)" 직책에 "대시보드(M001, COMMON)" + "팀 관리(M010, ADMIN)" 메뉴 부여
- **사용자별**: "홍길동(user123)" 사용자에게 "시스템 설정(M020, ADMIN)" 메뉴 추가 부여
  → 홍길동은 직책 권한 + 개인 권한을 모두 가짐

---

## 3. 데이터베이스 구조

### 3.1 기존 테이블 (수정 불필요)

#### `cm_menu` (메뉴 정의)
```sql
menu_code       VARCHAR(10)  PK  -- 메뉴 코드
menu_name       VARCHAR(100)     -- 메뉴명
menu_type       VARCHAR(10)      -- COMMON | ADMIN
menu_level      INT              -- 1: 상위, 2: 하위
up_menu_code    VARCHAR(10)      -- 상위 메뉴 코드
menu_url        VARCHAR(200)     -- 프론트엔드 라우트
use_yn          CHAR(1)          -- 사용 여부
sort_seq        INT              -- 정렬 순서
```

#### `cm_position_menu` (직책별 메뉴 권한)
```sql
position_code   VARCHAR(10)  PK  -- 직책 코드 (CD101)
menu_code       VARCHAR(10)  PK  -- 메뉴 코드
in_user         VARCHAR(50)      -- 등록자
in_date         DATETIME         -- 등록일시
```

#### `cm_user_menu` (사용자별 메뉴 권한)
```sql
user_id         VARCHAR(50)  PK  -- 사용자 ID
menu_code       VARCHAR(10)  PK  -- 메뉴 코드
in_user         VARCHAR(50)      -- 등록자
in_date         DATETIME         -- 등록일시
```

### 3.2 참조 테이블

#### `cm_codedetail` (직책 코드)
```sql
code_type = 'POSITION'
code            -- P001, P002, ...
code_name       -- HR, 팀장, ...
```

#### `cm_user` (사용자 정보)
```sql
user_id         -- 사용자 ID
email           -- 이메일
position_code   -- 직책 코드
role_code       -- 역할 코드 (R001: 시스템 관리자, R002: 일반 사용자)
```

---

## 4. 권한 부여 로직

### 4.1 기존 로직 (수정 필요)
```python
# MenuRepository.get_menus_by_user()
if role_code == 'R001':  # 시스템 관리자
    # 모든 ADMIN 메뉴 자동 부여 (문제!)
    admin_menu_codes = [전체 ADMIN 메뉴]
```

### 4.2 개선된 로직 (목표)
```python
# 1. 직책별 권한 (COMMON + ADMIN 모두 포함)
position_menus = SELECT menu_code FROM cm_position_menu 
                 WHERE position_code = :position_code

# 2. 사용자별 권한 (COMMON + ADMIN 모두 포함)
user_menus = SELECT menu_code FROM cm_user_menu 
             WHERE user_id = :user_id

# 3. 최종 권한 = UNION
final_menus = position_menus ∪ user_menus

# 4. 메뉴 정보 조회
menus = SELECT * FROM cm_menu 
        WHERE menu_code IN final_menus AND use_yn = 'Y'
```

**변경 사항**:
- ❌ 삭제: `role_code == 'R001'` 조건에 따른 ADMIN 메뉴 자동 부여
- ✅ 추가: 직책별/사용자별 권한 테이블에 ADMIN 메뉴도 저장 가능하도록 허용

---

## 5. 개발 범위

### 5.1 Backend (FastAPI)

#### 5.1.1 API 엔드포인트
```
[직책별 권한 관리]
GET    /api/v1/permissions/positions              # 전체 직책 목록 조회
GET    /api/v1/permissions/positions/{code}/menus # 특정 직책의 메뉴 권한 조회
PUT    /api/v1/permissions/positions/{code}/menus # 직책별 메뉴 권한 일괄 수정

[사용자별 권한 관리]
GET    /api/v1/permissions/users                  # 전체 사용자 목록 조회
GET    /api/v1/permissions/users/{id}/menus       # 특정 사용자의 메뉴 권한 조회
PUT    /api/v1/permissions/users/{id}/menus       # 사용자별 메뉴 권한 일괄 수정

[공통]
GET    /api/v1/permissions/menus                  # 권한 부여 가능한 전체 메뉴 목록
```

#### 5.1.2 도메인 구조
```
server/app/domain/permission/
├── __init__.py
├── service.py              # PermissionService
├── schemas/
│   └── __init__.py         # Request/Response DTO
├── repositories/
│   └── __init__.py         # PositionMenuRepository, UserMenuRepository
└── router.py               # FastAPI 라우터
```

#### 5.1.3 주요 로직
- **PositionMenuRepository**: 직책별 메뉴 권한 CRUD
- **UserMenuRepository**: 사용자별 메뉴 권한 CRUD
- **PermissionService**: 권한 부여/조회 비즈니스 로직
- **MenuRepository 수정**: `get_menus_by_user()` 로직 개선

### 5.2 Frontend (React)

#### 5.2.1 페이지 구조
```
권한 관리 페이지 (PermissionManagementPage)
├── Tab 1: 직책별 메뉴 권한 부여
│   ├── 좌측: 직책 목록 (CodeDetail: POSITION)
│   └── 우측: 선택된 직책의 메뉴 권한 (체크박스 트리)
│
└── Tab 2: 사용자별 메뉴 권한 부여
    ├── 좌측: 사용자 목록 (cm_user)
    └── 우측: 선택된 사용자의 메뉴 권한 (체크박스 트리)
```

#### 5.2.2 컴포넌트 구조
```
client/src/domains/permission/
├── pages/
│   └── PermissionManagementPage.tsx  # 메인 페이지 (탭 구조)
├── components/
│   ├── PositionPermissionPanel.tsx   # 직책별 권한 패널
│   ├── UserPermissionPanel.tsx       # 사용자별 권한 패널
│   └── MenuTreeCheckbox.tsx          # 메뉴 트리 체크박스
├── api.ts                             # API 호출 함수
├── types.ts                           # TypeScript 타입
└── index.ts                           # 내보내기
```

#### 5.2.3 UI/UX 요구사항
- **디자인 시스템 준수**: `.antigravityrules` 가이드라인 따름
- **탭 구조**: 직책별/사용자별 권한을 탭으로 분리
- **체크박스 트리**: 계층 구조 메뉴를 트리 형태로 표시
  - 상위 메뉴 체크 시 하위 메뉴 자동 체크
  - COMMON/ADMIN 메뉴 구분 표시 (Badge)
- **일괄 저장**: 변경사항을 한 번에 저장 (PUT 요청)
- **Toast 알림**: 저장 성공/실패 피드백

---

## 6. 작업 단계 (TASK)

### TASK 1: Backend - Permission 도메인 기본 구조 생성
**목표**: Permission 도메인의 기본 파일 구조 및 Repository 생성

**작업 내용**:
1. `server/app/domain/permission/` 폴더 생성
2. `__init__.py`, `service.py`, `router.py` 생성
3. `schemas/__init__.py` 생성 (Request/Response DTO)
4. `repositories/__init__.py` 생성
   - `PositionMenuRepository`: 직책별 메뉴 권한 CRUD
   - `UserMenuRepository`: 사용자별 메뉴 권한 CRUD

**파일 목록**:
- `server/app/domain/permission/__init__.py`
- `server/app/domain/permission/schemas/__init__.py`
- `server/app/domain/permission/repositories/__init__.py`

**완료 조건**:
- Repository 클래스가 `BaseRepository` 상속
- 기본 CRUD 메서드 구현 (조회, 일괄 수정, 삭제)

---

### TASK 2: Backend - Permission Service 및 API 구현
**목표**: 권한 관리 비즈니스 로직 및 API 엔드포인트 구현

**작업 내용**:
1. `PermissionService` 구현
   - 직책별 메뉴 권한 조회/수정
   - 사용자별 메뉴 권한 조회/수정
2. `router.py` 구현 (6개 엔드포인트)
3. `main.py`에 라우터 등록

**API 엔드포인트**:
```python
# 직책별 권한
GET    /api/v1/permissions/positions              # 전체 직책 목록
GET    /api/v1/permissions/positions/{code}/menus # 직책의 메뉴 권한
PUT    /api/v1/permissions/positions/{code}/menus # 직책 메뉴 권한 수정

# 사용자별 권한
GET    /api/v1/permissions/users                  # 전체 사용자 목록
GET    /api/v1/permissions/users/{id}/menus       # 사용자의 메뉴 권한
PUT    /api/v1/permissions/users/{id}/menus       # 사용자 메뉴 권한 수정

# 공통
GET    /api/v1/permissions/menus                  # 전체 메뉴 목록
```

**완료 조건**:
- Postman/Thunder Client로 API 테스트 성공
- 권한 부여 후 DB에 정상 저장 확인

---

### TASK 3: Backend - MenuRepository 로직 개선
**목표**: 기존 메뉴 조회 로직에서 role_code 의존성 제거

**작업 내용**:
1. `MenuRepository.get_menus_by_user()` 메서드 수정
   - ❌ 삭제: `if role_code == 'R001'` 조건 제거
   - ✅ 수정: 직책별/사용자별 권한 테이블에서 COMMON + ADMIN 메뉴 모두 조회
2. 기존 로그인 로직 영향 확인 및 테스트

**변경 전**:
```python
if role_code == 'R001':
    admin_menu_codes = [전체 ADMIN 메뉴]
    menu_codes += admin_menu_codes
```

**변경 후**:
```python
# 직책별 + 사용자별 권한에서 COMMON/ADMIN 구분 없이 조회
position_menus = SELECT menu_code FROM cm_position_menu 
                 WHERE position_code = :position_code

user_menus = SELECT menu_code FROM cm_user_menu 
             WHERE user_id = :user_id

menu_codes = position_menus ∪ user_menus
```

**완료 조건**:
- 기존 로그인 사용자의 메뉴가 정상 표시됨
- ADMIN 메뉴는 권한 테이블에 명시적으로 등록된 경우에만 표시

---

### TASK 4: Frontend - Permission 도메인 기본 구조 생성
**목표**: Permission 도메인의 기본 파일 및 타입 정의

**작업 내용**:
1. `client/src/domains/permission/` 폴더 생성
2. `types.ts` 생성 (TypeScript 타입 정의)
3. `api.ts` 생성 (API 호출 함수)
4. `index.ts` 생성 (내보내기)

**타입 정의 예시**:
```typescript
// Position 관련
export interface Position {
  code: string;
  code_name: string;
}

export interface PositionMenuPermission {
  position_code: string;
  menu_codes: string[];
}

// User 관련
export interface UserBasic {
  user_id: string;
  email: string;
  position_code: string;
}

export interface UserMenuPermission {
  user_id: string;
  menu_codes: string[];
}

// Menu 관련
export interface MenuForPermission {
  menu_code: string;
  menu_name: string;
  menu_type: 'COMMON' | 'ADMIN';
  menu_level: number;
  up_menu_code: string | null;
  children?: MenuForPermission[];
}
```

**완료 조건**:
- API 함수가 정상 호출되고 타입이 올바르게 적용됨

---

### TASK 5: Frontend - 공통 컴포넌트 개발 (MenuTreeCheckbox)
**목표**: 메뉴 트리 체크박스 공통 컴포넌트 개발

**작업 내용**:
1. `MenuTreeCheckbox.tsx` 컴포넌트 생성
   - 계층 구조 메뉴를 트리 형태로 표시
   - 체크박스로 메뉴 선택/해제
   - 상위 메뉴 체크 시 하위 메뉴 자동 체크
   - COMMON/ADMIN 메뉴 구분 표시 (Badge)
2. 디자인 시스템 준수 (`.antigravityrules`)

**Props**:
```typescript
interface MenuTreeCheckboxProps {
  menus: MenuForPermission[];        // 전체 메뉴 목록
  selectedMenuCodes: string[];       // 선택된 메뉴 코드
  onChange: (codes: string[]) => void; // 선택 변경 콜백
}
```

**완료 조건**:
- 메뉴 트리가 계층 구조로 표시됨
- 체크박스 상태가 정상 동작함
- Badge로 COMMON/ADMIN 구분 표시

---

### TASK 6: Frontend - 직책별 권한 관리 패널 개발
**목표**: 직책별 메뉴 권한 부여 UI 개발

**작업 내용**:
1. `PositionPermissionPanel.tsx` 컴포넌트 생성
   - 좌측: 직책 목록 (CodeDetail: POSITION)
   - 우측: 선택된 직책의 메뉴 권한 (MenuTreeCheckbox)
   - 저장 버튼 (PUT 요청)
2. 디자인 시스템 준수

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  직책별 메뉴 권한 부여                     │
├──────────────┬──────────────────────────┤
│ 직책 목록     │  선택된 직책의 메뉴 권한    │
│              │                          │
│ □ HR         │  ☑ 대시보드 (COMMON)      │
│ ☑ 팀장       │  ☑ 보고서 (COMMON)        │
│ □ 일반 사원   │  ☑ 팀 관리 (ADMIN)        │
│              │  □ 시스템 설정 (ADMIN)    │
│              │                          │
│              │  [저장]                   │
└──────────────┴──────────────────────────┘
```

**완료 조건**:
- 직책 선택 시 해당 직책의 메뉴 권한이 표시됨
- 메뉴 체크박스 변경 후 저장 시 DB에 반영됨
- Toast로 성공/실패 피드백 표시

---

### TASK 7: Frontend - 사용자별 권한 관리 패널 개발
**목표**: 사용자별 메뉴 권한 부여 UI 개발

**작업 내용**:
1. `UserPermissionPanel.tsx` 컴포넌트 생성
   - 좌측: 사용자 목록 (cm_user)
   - 우측: 선택된 사용자의 메뉴 권한 (MenuTreeCheckbox)
   - 저장 버튼 (PUT 요청)
2. 디자인 시스템 준수

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  사용자별 메뉴 권한 부여                   │
├──────────────┬──────────────────────────┤
│ 사용자 목록   │  선택된 사용자의 메뉴 권한  │
│              │                          │
│ □ 홍길동     │  ☑ 대시보드 (COMMON)      │
│ ☑ 김철수     │  ☑ 보고서 (COMMON)        │
│ □ 이영희     │  ☑ 시스템 설정 (ADMIN)    │
│              │                          │
│              │  [저장]                   │
└──────────────┴──────────────────────────┘
```

**완료 조건**:
- 사용자 선택 시 해당 사용자의 메뉴 권한이 표시됨
- 메뉴 체크박스 변경 후 저장 시 DB에 반영됨
- Toast로 성공/실패 피드백 표시

---

### TASK 8: Frontend - 권한 관리 메인 페이지 개발
**목표**: 탭 구조의 권한 관리 메인 페이지 개발

**작업 내용**:
1. `PermissionManagementPage.tsx` 생성
   - Tab 1: 직책별 메뉴 권한 부여 (PositionPermissionPanel)
   - Tab 2: 사용자별 메뉴 권한 부여 (UserPermissionPanel)
2. 라우터에 페이지 등록
3. 사이드바 메뉴에 "권한 관리" 추가 (ADMIN 메뉴)

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  권한 관리                                │
├─────────────────────────────────────────┤
│  [직책별 권한] [사용자별 권한]             │
├─────────────────────────────────────────┤
│                                         │
│  (선택된 탭의 패널 표시)                  │
│                                         │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 탭 전환이 정상 동작함
- 각 탭에서 권한 부여가 정상 동작함
- 디자인 시스템 가이드라인 준수

---

### TASK 9: 통합 테스트 및 문서화
**목표**: 전체 기능 테스트 및 문서 업데이트

**작업 내용**:
1. **시나리오 테스트**:
   - 직책별 권한 부여 → 해당 직책 사용자 로그인 → 메뉴 확인
   - 사용자별 권한 부여 → 해당 사용자 로그인 → 메뉴 확인
   - ADMIN 메뉴 권한 부여 → 일반 사용자가 ADMIN 메뉴 접근 확인
2. **문서 업데이트**:
   - `PROJECT_HANDOVER.md`에 권한 관리 기능 추가
   - API 문서 업데이트
3. **코드 정리**:
   - 불필요한 주석 제거
   - 타입 힌트 확인
   - Lint 에러 수정

**완료 조건**:
- 모든 시나리오 테스트 통과
- 문서가 최신 상태로 업데이트됨
- Lint 에러 없음

---

## 7. 예상 소요 시간

| TASK | 작업 내용 | 예상 시간 |
|------|----------|----------|
| TASK 1 | Backend - Permission 도메인 기본 구조 | 1시간 |
| TASK 2 | Backend - Service 및 API 구현 | 2시간 |
| TASK 3 | Backend - MenuRepository 로직 개선 | 1시간 |
| TASK 4 | Frontend - Permission 도메인 기본 구조 | 30분 |
| TASK 5 | Frontend - MenuTreeCheckbox 컴포넌트 | 2시간 |
| TASK 6 | Frontend - 직책별 권한 관리 패널 | 2시간 |
| TASK 7 | Frontend - 사용자별 권한 관리 패널 | 2시간 |
| TASK 8 | Frontend - 메인 페이지 및 라우팅 | 1시간 |
| TASK 9 | 통합 테스트 및 문서화 | 1시간 |
| **합계** | | **약 12.5시간** |

---

## 8. 주의사항

### 8.1 데이터 무결성
- 메뉴 권한 부여 시 존재하지 않는 메뉴 코드 방지
- 직책/사용자가 삭제될 때 권한 테이블도 함께 삭제 (CASCADE)

### 8.2 성능 최적화
- 메뉴 조회 시 N+1 쿼리 방지 (`selectinload` 사용)
- 권한 부여 시 일괄 INSERT/DELETE (트랜잭션 처리)

### 8.3 보안
- 권한 관리 페이지는 ADMIN 메뉴로 설정
- 시스템 관리자만 접근 가능하도록 제한

### 8.4 사용자 경험
- 메뉴 트리에서 상위 메뉴 체크 시 하위 메뉴 자동 체크
- 저장 전 변경사항 확인 모달 표시
- 저장 성공/실패 Toast 알림

---

## 9. 참고 자료

- **기존 메뉴 관리 로드맵**: `docs/MENU_MANAGEMENT_ROADMAP.md`
- **디자인 시스템**: `.antigravityrules`
- **프로젝트 핸드오버**: `docs/common/PROJECT_HANDOVER.md`
- **데이터베이스 스키마**: `server/app/domain/menu/models.py`
- **기존 메뉴 조회 로직**: `server/app/domain/menu/repositories/__init__.py`
