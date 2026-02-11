# 메뉴 관리(Menu Management) 개발 로드맵

이 문서는 1on1-vntg 프로젝트의 메뉴 관리 시스템 개발을 위한 상세 계획 및 작업 분할을 정의합니다. `.antigravityrules`의 아키텍처 원칙과 코딩 규칙을 엄격히 준수합니다.

## 1. 개발 목표
- 시스템 메뉴의 계층 구조(최대 2레벨) 관리 기능 구현
- 메뉴의 CRUD(생성, 조회, 수정, 삭제) 기능 제공
- 직관적인 Master-Detail 레이아웃을 통한 사용자 경험 최적화

## 2. 주요 사양 및 정책
### 2.1 계층 구조
- **1레벨(대메뉴)**: 시스템의 주요 카테고리 기획
- **2레벨(소메뉴)**: 실제 라우팅 및 기능이 매핑되는 단위
- *비고*: 현재 시스템 확장성을 고려하여 2레벨로 제한하되 코드상으로는 유연하게 처리

### 2.2 메뉴 필드 구성
- `menu_code`: 메뉴 식별 코드 (자동 생성 또는 관리자 입력)
- `menu_name`: 메뉴 표시 이름
- `up_menu_code`: 상위 메뉴 코드 (1레벨은 NULL)
- `menu_level`: 메뉴 깊이 (1 또는 2)
- `menu_url`: 프론트엔드 라우팅 경로 (사용자 직접 입력 권장)
- `menu_type`: 메뉴 타입 (`COMMON`, `ADMIN`)
- `use_yn`: 사용 여부 (`Y`, `N`)
- `sort_seq`: 동일 레벨 내 정렬 순서
- `rmk`: 비고

### 2.3 `MENU_URL` 전략
- 프론트엔드(`client`)에 이미 정의되었거나 정의될 예정인 라우트 경로를 사용자가 직접 입력합니다.
- 예: `/management/menus`, `/dashboard`

---

## 3. 작업 분할 (Task Breakdown)

### TASK 1: Backend - 메뉴 관리 CRUD API 구현
**목표**: 메뉴 데이터 보관 및 처리를 위한 비즈니스 로직과 엔드포인트 완성

1. **Schemas 정의** (`server/app/domain/menu/schemas/`)
   - `MenuCreateRequest`: 생성 요청 스키마
   - `MenuUpdateRequest`: 수정 요청 스키마
   - `MenuResponse`: 조회를 위한 상세 응답 스키마
2. **Repository 확장** (`server/app/domain/menu/repositories/`)
   - `create`: 새 메뉴 레코드 생성
   - `update`: 기존 메뉴 정보 수정
   - `delete`: 메뉴 삭제 (하위 메뉴 존재 시 삭제 방지 로직 포함)
3. **Service 구현** (`server/app/domain/menu/service.py`)
   - `create_menu`: 레벨 제한(1, 2레벨) 및 비즈니스 유효성 검사
   - `update_menu`: 변경 사항 반영 및 캐시/권한 갱신 고려
   - `delete_menu`: 안전한 삭제 프로세스 처리
4. **Router 연결** (`server/app/api/v1/endpoints/menu.py`)
   - `POST /api/v1/menus`
   - `PUT /api/v1/menus/{menu_code}`
   - `DELETE /api/v1/menus/{menu_code}`

---

### TASK 2: Frontend - 메뉴 관리 레이아웃 및 조회 UI
**목표**: 관리자 페이지 구축 및 실시간 데이터 연동

1. **API Client 및 타입 정의** (`client/src/domains/menu/`)
   - `api.ts`: axios 기반 CRUD 함수 작성
   - `types.ts`: TypeScript 인터페이스 정의
2. **페이지 레이아웃 구현** (`client/src/domains/menu/pages/MenuManagementPage.tsx`)
   - **Master 섹션 (왼쪽)**: 1레벨 메뉴 리스트 (선택 기능 포함)
   - **Detail 섹션 (오른쪽)**:
     - 선택된 1레벨 메뉴의 정보 요약
     - 하위(2레벨) 메뉴 목록 테이블 렌더링
3. **상태 관리**: 선택된 메뉴 및 로딩 상태 처리

---

### TASK 3: Frontend - 메뉴 관리 액션(CUD) 구현
**목표**: 실제 데이터 변경을 위한 사용자 인터랙션 완성

1. **MenuDialog 컴포넌트** (`client/src/domains/menu/components/MenuDialog.tsx`)
   - 등록 및 수정을 위한 공통 모달 UI
   - 폼 유효성 검사 (필수 항목 체크)
2. **액션 처리**
   - **등록**: 1레벨 및 2레벨 추가 분기 처리
   - **수정**: 선택된 행의 데이터를 다이얼로그로 전달
   - **삭제**: `.antigravityrules`에 따른 `ConfirmModal` 사용
3. **피드백 시스템**
   - `Toast`를 통한 처리 결과 안내
   - 처리 완료 후 목록 자동 새로고침(Re-fetch)

---

## 4. 향후 확장 계획
- 메뉴별 권한 설정 연동 (직책/사용자별 권한 관리 화면)
- 메뉴 아이콘 선택기 추가
- 드래그 앤 드롭을 이용한 순서 변경(sort_seq) 기능
