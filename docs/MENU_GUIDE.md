# 메뉴 권한 시스템 사용 가이드

> **1on1-vntg 프로젝트의 동적 메뉴 및 권한 시스템 가이드**

## 📖 관련 문서

- **[README.md](../README.md)**: 프로젝트 개요 및 빠른 시작
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 아키텍처 상세 설명
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: 도메인 추가 및 개발 가이드

---

## 📋 개요

사용자가 구글 로그인 후, 사용자의 직책(position_code)에 따라 접근 가능한 메뉴를 동적으로 조회하고 Sidebar에 렌더링하는 기능입니다.

## 🏗️ 아키텍처

### 백엔드 (FastAPI)
```
server/app/domain/menu/
├── models.py          # Menu, PositionMenu, UserMenu ORM 모델
├── schemas/           # Pydantic 스키마 (Request/Response)
├── repositories/      # 데이터 조회 로직
├── service.py         # 비즈니스 로직 (권한 조합, 계층 구조 생성)
└── endpoints/menu.py  # API 엔드포인트 (/v1/menus/...)
```

### 프론트엔드 (React + TypeScript)
```
client/src/
├── domains/menu/              # 메뉴 도메인
│   ├── types.ts               # TypeScript 타입 정의
│   ├── api.ts                 # API 호출 함수
│   ├── store.ts               # Zustand 상태 관리
│   └── index.ts               # Export 통합
├── core/
│   ├── store/useAuthStore.ts  # 인증 상태 (user.position_code 포함)
│   └── layout/Sidebar.tsx     # 사이드바 (동적 메뉴 렌더링)
```

## 🔄 동작 흐름

### 1. 사용자 로그인
```typescript
// useAuthStore에서 사용자 정보 설정
const user = {
  id: "user123",
  email: "user@example.com",
  name: "홍길동",
  position_code: "P001"  // 직책 코드 (필수)
};
```

### 2. 메뉴 자동 조회
```typescript
// Sidebar.tsx에서 useEffect로 자동 호출
useEffect(() => {
  if (isAuthenticated && user?.id && user?.position_code) {
    fetchUserMenus(user.id, user.position_code);
  }
}, [isAuthenticated, user?.id, user?.position_code]);
```

### 3. API 호출
```
GET /api/v1/menus/user/{user_id}?position_code=P001
```

**응답 예시:**
```json
{
  "menus": [
    {
      "menu_code": "M001",
      "menu_name": "대시보드",
      "menu_level": 1,
      "menu_url": "/dashboard",
      "sort_seq": 1,
      "children": []
    },
    {
      "menu_code": "M002",
      "menu_name": "R&R 관리",
      "menu_level": 1,
      "menu_url": "/r-and-r",
      "sort_seq": 2,
      "children": [
        {
          "menu_code": "M005",
          "menu_name": "목표 설정",
          "menu_level": 2,
          "menu_url": "/r-and-r/goals",
          "sort_seq": 1,
          "children": []
        }
      ]
    }
  ],
  "total_count": 3
}
```

### 4. Sidebar 렌더링
- 메뉴 아이콘은 `MENU_ICON_MAP`에서 자동 매핑
- 계층 구조 메뉴는 재귀적으로 렌더링
- 시스템 관리(M004)는 별도 섹션에 표시

## 📊 데이터베이스 구조

### cm_menu (메뉴 정의)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| menu_code | VARCHAR(10) | 메뉴 코드 (PK) |
| menu_name | VARCHAR(100) | 메뉴명 |
| up_menu_code | VARCHAR(10) | 상위 메뉴 코드 (FK) |
| menu_level | INT | 메뉴 깊이 (1, 2, 3...) |
| menu_url | VARCHAR(200) | 라우팅 경로 |
| sort_seq | INT | 정렬순서 |
| use_yn | CHAR(1) | 사용여부 (Y/N) |

### cm_position_menu (직책별 메뉴 권한)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| position_code | VARCHAR(10) | 직책 코드 (PK) |
| menu_code | VARCHAR(10) | 메뉴 코드 (PK) |

### cm_user_menu (개인별 예외 권한)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | VARCHAR(50) | 사용자 ID (PK) |
| menu_code | VARCHAR(10) | 메뉴 코드 (PK) |

## 🔧 사용 방법

### 1. 새로운 메뉴 추가

#### 백엔드 (데이터베이스)
```sql
-- migration/20260120_add_new_menu.sql
INSERT INTO cm_menu (menu_code, menu_name, menu_level, menu_url, sort_seq, use_yn)
VALUES ('M006', '새 메뉴', 1, '/new-menu', 5, 'Y');
```

#### 프론트엔드 (아이콘 매핑)
```typescript
// Sidebar.tsx
const MENU_ICON_MAP: Record<string, LucideIcon> = {
  M001: Layout,
  M002: ListTodo,
  M003: Users,
  M004: Settings,
  M006: FileText,  // 새로 추가
};
```

### 2. 직책별 메뉴 권한 부여
```sql
-- P001 직책에 M006 메뉴 권한 부여
INSERT INTO cm_position_menu (position_code, menu_code)
VALUES ('P001', 'M006');
```

### 3. 개인별 예외 권한 부여
```sql
-- user123에게 M006 메뉴 특별 권한 부여
INSERT INTO cm_user_menu (user_id, menu_code)
VALUES ('user123', 'M006');
```

## 🧪 테스트

### 백엔드 API 테스트
```bash
# 사용자 메뉴 조회
curl -X GET "http://localhost:8000/api/v1/menus/user/user123?position_code=P001"

# 전체 메뉴 계층 조회
curl -X GET "http://localhost:8000/api/v1/menus/hierarchy"

# 특정 메뉴만 조회
curl -X GET "http://localhost:8000/api/v1/menus/hierarchy?menu_codes=M001,M002"
```

### 프론트엔드 테스트
```typescript
import { useAuthStore } from '@/core/store/useAuthStore';

// 테스트 사용자 로그인
const { setUser } = useAuthStore();
setUser({
  id: 'test_user',
  email: 'test@example.com',
  name: '테스트 사용자',
  position_code: 'P001',
});
```

## ⚙️ 설정

### 환경 변수
```env
# .env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🐛 트러블슈팅

### 메뉴가 표시되지 않음
1. `user.position_code`가 설정되어 있는지 확인
2. 백엔드 로그 확인: `메뉴 조회 중 오류`
3. 네트워크 탭에서 API 응답 확인

### 메뉴가 계층 구조로 표시되지 않음
- `up_menu_code`와 `menu_level`이 올바르게 설정되어 있는지 확인
- 데이터베이스에서 `cm_menu` 테이블 확인

### 아이콘이 표시되지 않음
- `MENU_ICON_MAP`에 해당 `menu_code`가 등록되어 있는지 확인
- `lucide-react`에서 해당 아이콘을 import 했는지 확인

## 📝 TODO

- [ ] React Router 연동 (menu_url 클릭 시 페이지 이동)
- [ ] 현재 활성 메뉴 표시 (URL 기반 active 상태)
- [ ] 메뉴 즐겨찾기 기능
- [ ] 메뉴 검색 기능
- [ ] 메뉴 권한 관리 UI

## 📚 참고 자료

- [FastAPI 문서](http://localhost:8000/docs) - API 스펙 확인
- [.cursorrules](./.cursorrules) - 프로젝트 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 설계 문서
