# 관리자 역할(Role) 기반 메뉴 권한 분리 로드맵

## 개요

현재 메뉴 권한은 **직책(Position)** 기반으로만 부여되고 있습니다.
이 작업은 **역할(Role)** 기반으로 관리자 메뉴를 분리하여,
일반 사용자와 관리자가 서로 다른 메뉴를 볼 수 있도록 합니다.

### 핵심 원칙
- **로그인 방식 변경 없음** — 동일한 Google OAuth 로그인 유지
- **기존 직책별 권한 유지** — `cm_position_menu` 테이블 그대로 활용
- **역할 기반 분기 추가** — `role_code`로 관리자 메뉴 별도 부여

---

## 현재 상태 (AS-IS)

### DB 구조
```
cm_user.role_code     → ROLE 코드 (CD001=HR, CD002=GENERAL)
cm_user.position_code → POSITION 코드 (P001~P005)

cm_position_menu      → 직책별 메뉴 매핑 (position_code + menu_code)
cm_user_menu          → 개인별 예외 메뉴 (user_id + menu_code)
cm_menu               → 메뉴 정의 (계층 구조)
```

### ROLE 코드 (cm_codedetail WHERE code_type='ROLE')
| 코드 | 이름 | 설명 |
|------|------|------|
| CD001 | HR | HR 담당자 |
| CD002 | GENERAL | 일반 사용자 |

### POSITION 코드 (cm_codedetail WHERE code_type='POSITION')
| 코드 | 이름 | 메뉴 접근 |
|------|------|----------|
| P001 | 대표이사(CEO) | 전체 메뉴 + 시스템 관리 |
| P002 | 총괄(Director) | 전체 메뉴 + 시스템 관리 |
| P003 | 센터장/실장(Manager) | 전체 메뉴 + 시스템 관리 |
| P004 | 팀장(Team Lead) | M001, M002, M003 (시스템 관리 제외) |
| P005 | 팀원(Team Member) | M001, M002 일부 |

### 현재 메뉴 구조
```
M001  대시보드           (menu_level=1)
M002  목표 관리          (menu_level=1)
  ├─ M002_1 목표 설정
  ├─ M002_2 목표 진행 현황
  └─ M002_3 목표 평가
M003  1on1 면담          (menu_level=1)
  ├─ M003_1 면담 예약
  ├─ M003_2 면담 이력
  └─ M003_3 면담 통계
M004  시스템 관리         (menu_level=1)  ← 현재는 직책으로 통제
  ├─ M004_1 사용자 관리
  │   ├─ M004_1_1 직원 조회
  │   └─ M004_1_2 직원 등록
  ├─ M004_2 코드 관리
  │   ├─ M004_2_1 공통코드 조회
  │   └─ M004_2_2 공통코드 등록
  ├─ M004_3 메뉴 관리
  └─ M004_4 권한 관리
```

### 현재 문제점
1. 시스템 관리 메뉴(M004)가 직책(P001~P003)으로 통제되고 있어, ROLE 구분과 무관함
2. role_code가 JWT에 포함되지만 메뉴 조회에는 사용되지 않음
3. 관리자 전용 메뉴를 명확히 분류할 기준이 없음

---

## 목표 상태 (TO-BE)

### 메뉴 권한 체계
```
┌─────────────────────────────────────────────────────┐
│                     로그인 (OAuth)                    │
│                         │                            │
│              JWT: role_code + position_code           │
│                         │                            │
│            ┌────────────┴────────────┐               │
│            │                         │               │
│     role_code = R001             role_code = R002    │
│     (시스템 관리자)               (일반 사용자)        │
│            │                         │               │
│    ┌───────┴───────┐          ┌──────┴──────┐       │
│    │               │          │              │       │
│  COMMON 메뉴    ADMIN 메뉴   COMMON 메뉴    (없음)   │
│  (직책별 권한)  (전체 접근)   (직책별 권한)            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### ROLE 코드 변경
| 코드 | 이름 (변경) | 설명 |
|------|------------|------|
| R001 | 시스템 관리자 | 관리자 메뉴 + 일반 메뉴 (직책별) |
| R002 | 일반 사용자 | 일반 메뉴만 (직책별) |

> **참고**: cm_codedetail의 ROLE 코드도 CD001/CD002 → R001/R002로 변경 권장
> (현재 코드가 CD001=HR인데, 의미가 명확하도록 R001=시스템 관리자로 변경)

---

## 구현 Phase

### Phase 1: DB 구조 변경

#### 1-1. cm_menu 테이블에 menu_type 컬럼 추가
```sql
ALTER TABLE cm_menu
ADD COLUMN menu_type VARCHAR(10) NOT NULL DEFAULT 'COMMON';

COMMENT ON COLUMN cm_menu.menu_type IS '메뉴 타입 (COMMON: 일반, ADMIN: 관리자 전용)';
```

#### 1-2. 기존 시스템 관리 메뉴를 ADMIN으로 업데이트
```sql
UPDATE cm_menu SET menu_type = 'ADMIN'
WHERE menu_code IN ('M004', 'M004_1', 'M004_2', 'M004_3', 'M004_4',
                    'M004_1_1', 'M004_1_2', 'M004_2_1', 'M004_2_2');
```

#### 1-3. ROLE 공통코드 업데이트
```sql
-- 기존 ROLE 코드를 의미있는 코드로 업데이트
UPDATE cm_codedetail
SET code = 'R001', code_name = '시스템 관리자', rmk = '시스템 관리자 (관리 메뉴 접근 가능)'
WHERE code_type = 'ROLE' AND code = 'CD001';

UPDATE cm_codedetail
SET code = 'R002', code_name = '일반 사용자', rmk = '일반 사용자'
WHERE code_type = 'ROLE' AND code = 'CD002';
```

#### 1-4. cm_position_menu에서 ADMIN 메뉴 제거 (선택사항)
```sql
-- 관리자 메뉴는 role 기반으로 전환되므로, position 기반 매핑은 제거
-- (하위호환을 위해 일단 유지하고, Phase 완료 후 정리)
```

#### 변경 파일
- `migration/20260209_add_menu_type_column.sql` (새로 생성)
- `server/app/domain/menu/models.py` — Menu 모델에 `menu_type` 필드 추가

---

### Phase 2: 백엔드 메뉴 조회 로직 변경

#### 2-1. MenuRepository.get_menus_by_user() 수정
```python
async def get_menus_by_user(
    self,
    user_id: str,
    position_code: str,
    role_code: str  # 새로 추가
) -> List[Menu]:
    # 1. COMMON 메뉴: 직책별 + 개인별 예외 (기존 로직 유지)
    common_menus = (직책별 cm_position_menu UNION 개인별 cm_user_menu)
                   .WHERE(menu_type = 'COMMON')

    # 2. ADMIN 메뉴: role_code가 'R001'이면 전체 ADMIN 메뉴 추가
    if role_code == 'R001':
        admin_menus = SELECT * FROM cm_menu WHERE menu_type = 'ADMIN'
        all_menu_codes = common_menus UNION admin_menus
    else:
        all_menu_codes = common_menus

    # 3. 메뉴 정보 조회 및 반환
    return get_menu_objects(all_menu_codes)
```

#### 변경 파일
- `server/app/domain/menu/repositories/__init__.py` — `role_code` 파라미터 추가, 분기 로직
- `server/app/domain/menu/service.py` — `role_code` 전달
- `server/app/domain/menu/schemas/__init__.py` — `UserMenuRequest`에 `role_code` 추가

---

### Phase 3: API 수정

#### 3-1. 메뉴 조회 API에 role_code 파라미터 추가
```python
@router.get("/user/{user_id}")
async def get_user_menus(
    user_id: str,
    position_code: str = Query(...),
    role_code: str = Query(...),  # 새로 추가
    ...
)
```

#### 변경 파일
- `server/app/api/v1/endpoints/menu.py` — `role_code` 쿼리 파라미터 추가

---

### Phase 4: 프론트엔드 수정

#### 4-1. useAuthStore에 role_code 추가
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  position_code: string;
  role_code: string;  // 새로 추가
}
```

#### 4-2. 메뉴 API 호출에 role_code 전달
```typescript
// menu/api.ts
export async function getUserMenus(
    userId: string,
    positionCode: string,
    roleCode: string  // 새로 추가
)

// menu/store.ts
fetchUserMenus: async (userId, positionCode, roleCode) => { ... }
```

#### 4-3. Sidebar에서 role_code 전달
```typescript
// Sidebar.tsx
useEffect(() => {
  if (isAuthenticated && user?.id && user?.position_code && user?.role_code) {
    fetchUserMenus(user.id, user.position_code, user.role_code);
  }
}, [isAuthenticated, user?.id, user?.position_code, user?.role_code, fetchUserMenus]);
```

#### 4-4. 메뉴 타입별 응답에 menu_type 포함
```typescript
// types.ts
export interface Menu {
  // ... 기존 필드
  menu_type: 'COMMON' | 'ADMIN';  // 새로 추가
}
```

#### 4-5. Sidebar에서 관리자 메뉴 섹션 분리
- 기존: `menu.menu_code === 'M004'`로 하드코딩 분리
- 변경: `menu.menu_type === 'ADMIN'`으로 동적 분리

#### 4-6. LoginPage에서 role_code 저장
```typescript
setUser({
  id: response.user_id,
  email: response.email,
  name: response.name,
  position_code: response.position_code,
  role_code: response.role_code,  // 새로 추가
});
```

#### 변경 파일
- `client/src/core/store/useAuthStore.ts`
- `client/src/domains/menu/api.ts`
- `client/src/domains/menu/store.ts`
- `client/src/domains/menu/types.ts`
- `client/src/core/layout/Sidebar.tsx`
- `client/src/domains/auth/pages/LoginPage.tsx`

---

### Phase 5: 마이그레이션 SQL 및 시드 데이터

#### 변경 파일
- `migration/20260209_add_menu_type_column.sql` — DDL + 데이터 업데이트 통합

---

## 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| **DB / Migration** | |
| `migration/20260209_add_menu_type_column.sql` | cm_menu에 menu_type 컬럼 추가, 데이터 업데이트 |
| **Backend** | |
| `server/app/domain/menu/models.py` | Menu 모델에 menu_type 필드 추가 |
| `server/app/domain/menu/schemas/__init__.py` | UserMenuRequest에 role_code 추가, 응답에 menu_type 추가 |
| `server/app/domain/menu/repositories/__init__.py` | role 기반 메뉴 분기 로직 추가 |
| `server/app/domain/menu/service.py` | role_code 전달 |
| `server/app/api/v1/endpoints/menu.py` | role_code 쿼리 파라미터 추가 |
| **Frontend** | |
| `client/src/core/store/useAuthStore.ts` | User 인터페이스에 role_code 추가 |
| `client/src/domains/menu/types.ts` | Menu에 menu_type 추가 |
| `client/src/domains/menu/api.ts` | getUserMenus에 roleCode 파라미터 추가 |
| `client/src/domains/menu/store.ts` | fetchUserMenus에 roleCode 파라미터 추가 |
| `client/src/core/layout/Sidebar.tsx` | menu_type 기반 동적 메뉴 분리 |
| `client/src/domains/auth/pages/LoginPage.tsx` | role_code 저장 로직 추가 |

## 변경하지 않는 것
- Google OAuth 로그인 흐름
- cm_position_menu 테이블 구조
- cm_user_menu 테이블 구조
- JWT 토큰 생성 로직 (이미 role 정보 포함됨)
- 세션 관리 로직
