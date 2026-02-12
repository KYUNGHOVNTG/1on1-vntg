# 인사/조직 정보 시스템 개발 로드맵

## 📋 프로젝트 개요

### 목적
외부 오라클 시스템(HR 관리 시스템)과 연동하여 인사/조직 데이터를 동기화하고, 1on1 시스템 내에서 추가적인 관리 기능을 제공하는 **HR 도메인**을 구축합니다.

### 핵심 요구사항
- **확장성 최우선**: Mock 데이터 → 외부 API 연동으로 전환이 용이한 구조
- **단계적 구현**: 1단계(조회) → 2단계(CRUD) → 3단계(외부 연동)
- **계층화된 아키텍처**: Repository 패턴으로 데이터 소스 변경에 유연하게 대응

---

## 🗄️ 테이블 구조

| 테이블명 | 역할 | 핵심 컬럼 |
|---------|------|----------|
| **CM_USER** | 계정 정보 | USER_ID(PK), EMAIL, ROLE_CODE, POSITION_CODE |
| **HR_MGNT** | 인사 정보 (주소속) | EMP_NO(PK), USER_ID(FK), NAME_KOR, DEPT_CODE(FK), POSITION_CODE, ON_WORK_YN |
| **HR_MGNT_CONCUR** | 겸직 정보 | EMP_NO(FK), DEPT_CODE(FK), IS_MAIN(Y/N), POSITION_CODE |
| **CM_DEPARTMENT** | 부서 정보 | DEPT_CODE(PK), DEPT_NAME, UPPER_DEPT_CODE, DEPT_HEAD_EMP_NO |
| **CM_DEPARTMENT_TREE** | 조직도 뷰 | STD_YEAR, DEPT_CODE(FK), UPPER_DEPT_CODE, DISP_LVL, DEPT_HEAD_EMP_NO |

---

## 🛠️ 핵심 설계 전략

### 1. 도메인 구조: `hr` 도메인 통합
```
server/app/domain/hr/
├── __init__.py
├── service.py                     # HR 통합 서비스
├── models/                        # SQLAlchemy 모델
│   ├── user.py                    # CM_USER
│   ├── employee.py                # HR_MGNT
│   ├── concurrent_position.py     # HR_MGNT_CONCUR
│   └── department.py              # CM_DEPARTMENT, CM_DEPARTMENT_TREE
├── schemas/                       # Pydantic 스키마
│   ├── employee.py                # 직원 프로필 (주소속+겸직 통합)
│   └── department.py              # 부서 정보
├── repositories/                  # 데이터 접근 계층
│   ├── employee_repository.py     # 직원 정보 조회
│   ├── department_repository.py   # 부서 정보 조회
│   └── mock/                      # Mock 구현체
│       ├── employee_mock.json     # 직원 Mock 데이터
│       └── department_mock.json   # 부서 Mock 데이터
├── calculators/                   # 비즈니스 로직
│   └── org_tree_calculator.py     # 조직도 트리 변환 로직
└── formatters/                    # 응답 포맷팅
    └── employee_formatter.py      # 겸직 정보 병합
```

### 2. 데이터 통합 전략
- **직원 프로필**: `HR_MGNT` (주소속) + `HR_MGNT_CONCUR` (겸직) → 단일 `EmployeeProfile` 객체
- **조직도 트리**: `CM_DEPARTMENT_TREE` (리스트) → `OrgTreeCalculator` → JSON 트리 구조

### 3. Mock 데이터 전환 전략
```python
# 인터페이스 정의
class IEmployeeRepository(ABC):
    @abstractmethod
    async def find_all(self) -> List[Employee]:
        pass

# Mock 구현 (1단계)
class EmployeeMockRepository(IEmployeeRepository):
    async def find_all(self) -> List[Employee]:
        with open("server/app/domain/hr/repositories/mock/employee_mock.json") as f:
            return parse_obj_as(List[Employee], json.load(f))

# Real 구현 (향후)
class EmployeeApiRepository(IEmployeeRepository):
    async def find_all(self) -> List[Employee]:
        response = await external_api_client.get("/oracle/hr/employees")
        return parse_obj_as(List[Employee], response.json())
```

### 4. 외부 API 제공 전략
- **연동 방식**: 오라클 시스템이 우리 API 호출 (Push)
- **동기화 방식**: 관리자가 화면에서 "동기화" 버튼 클릭 시 수동 실행
- **API 엔드포인트**:
  - `POST /api/v1/hr/sync/employees` - 직원 정보 동기화
  - `POST /api/v1/hr/sync/departments` - 부서 정보 동기화
  - `POST /api/v1/hr/sync/org-tree` - 조직도 동기화

---

## 📅 4주 개발 로드맵

### 1주차: 도메인 기반 구축 및 Mock 데이터 정의

#### 목표
실제 운영 데이터와 동일한 규격의 데이터 모델 및 Mock 인프라 구축

#### 작업 내용

**Backend**
- [ ] SQLAlchemy 모델 정의 (5개 테이블)
  - `CM_USER`, `HR_MGNT`, `HR_MGNT_CONCUR`, `CM_DEPARTMENT`, `CM_DEPARTMENT_TREE`
- [ ] Pydantic 스키마 정의
  - `EmployeeProfile` (주소속 + 겸직 통합)
  - `DepartmentInfo`, `OrgTreeNode`
- [ ] Repository 인터페이스 정의
  - `IEmployeeRepository`, `IDepartmentRepository`

**Mock 데이터**
- [ ] `employee_mock.json` 생성 (겸직자, 퇴직자 포함)
- [ ] `department_mock.json` 생성 (3-depth 계층 구조, 부서장 포함)
- [ ] Mock Repository 구현체 작성

**Alembic**
- [ ] 테이블 생성 마이그레이션 작성

#### 산출물
- `server/app/domain/hr/models/*.py` (5개 모델)
- `server/app/domain/hr/schemas/*.py` (3개 스키마)
- `server/app/domain/hr/repositories/*.py` (인터페이스 + Mock 구현체)
- `server/app/domain/hr/repositories/mock/*.json` (Mock 데이터)

---

### 2주차: 직원 관리 서비스 개발 (조회 기능)

#### 목표
주소속/겸직 정보가 통합된 직원 정보 조회 및 화면 구현

#### 작업 내용

**Backend**
- [ ] `HRService.get_employees()` - 직원 목록 조회
  - Repository에서 `HR_MGNT` + `HR_MGNT_CONCUR` 조인 데이터 조회
  - Formatter로 겸직 정보 병합
- [ ] `HRService.get_employee_by_id()` - 직원 상세 조회
- [ ] Router 엔드포인트 작성
  - `GET /api/v1/hr/employees` - 목록 조회 (필터링, 검색, 페이징)
  - `GET /api/v1/hr/employees/{emp_no}` - 상세 조회

**Frontend**
- [ ] API 클라이언트 작성 (`src/domains/hr/api.ts`)
- [ ] Zustand 스토어 작성 (`src/domains/hr/store.ts`)
- [ ] 직원 목록 페이지 (`src/domains/hr/pages/EmployeeListPage.tsx`)
  - 검색 기능 (성명, 사번, 부서)
  - 필터링 (재직 여부, 직책)
  - 겸직자 배지 표시 (메인 테이블에 "겸직" 배지)
- [ ] 직원 상세 페이지 (`src/domains/hr/pages/EmployeeDetailPage.tsx`)
  - 기본 정보 표시
  - 겸직 정보 팝오버 또는 배지 호버 시 표시

**메뉴 등록**
- [ ] 메뉴 코드 추가 (예: `M700` - 인사관리)
- [ ] 서브메뉴: `M710` - 직원 관리

#### 산출물
- `server/app/domain/hr/service.py` (직원 조회 로직)
- `server/app/api/v1/hr.py` (Router)
- `client/src/domains/hr/pages/EmployeeListPage.tsx`
- `client/src/domains/hr/pages/EmployeeDetailPage.tsx`

---

### 3주차: 조직 정보 서비스 개발 (조회 기능)

#### 목표
계층형 조직도 뷰 가공 및 부서 정보 연동

#### 작업 내용

**Backend**
- [ ] `OrgTreeCalculator.build_tree()` - 리스트 → 트리 변환
  - `CM_DEPARTMENT_TREE`의 플랫 데이터를 계층형 JSON으로 변환
  - `DISP_LVL` 기준 정렬
- [ ] `HRService.get_org_tree()` - 조직도 조회
- [ ] `HRService.get_department_info()` - 부서 상세 조회
  - 부서장 정보 포함
  - 소속 직원 수 집계
- [ ] Router 엔드포인트 작성
  - `GET /api/v1/hr/org-tree` - 조직도 트리
  - `GET /api/v1/hr/departments/{dept_code}` - 부서 상세
  - `GET /api/v1/hr/departments/{dept_code}/employees` - 부서별 직원 목록

**Frontend**
- [ ] 조직도 페이지 (`src/domains/hr/pages/OrgChartPage.tsx`)
  - 트리 UI 컴포넌트 (재귀형 또는 라이브러리 활용)
  - 부서 클릭 시 부서 상세 정보 표시
  - 부서장 정보, 소속 직원 수 표시
- [ ] 부서 상세 페이지 (`src/domains/hr/pages/DepartmentDetailPage.tsx`)
  - 부서 기본 정보
  - 소속 직원 리스트 (겸직자 포함)

**메뉴 등록**
- [ ] 서브메뉴: `M720` - 조직도 관리

#### 산출물
- `server/app/domain/hr/calculators/org_tree_calculator.py`
- `client/src/domains/hr/pages/OrgChartPage.tsx`
- `client/src/domains/hr/components/OrgTreeView.tsx`

---

### 4주차: 외부 연동 인터페이스 준비 및 검증

#### 목표
Mock → Real API 전환 준비 완료 및 전체 시스템 안정화

#### 작업 내용

**Backend - 외부 API 엔드포인트 작성**
- [ ] `POST /api/v1/hr/sync/employees` - 직원 정보 Bulk Insert/Update
  - Request Body: `List[EmployeeSyncRequest]`
  - 오라클 시스템에서 호출하여 데이터 Push
- [ ] `POST /api/v1/hr/sync/departments` - 부서 정보 동기화
- [ ] 동기화 이력 테이블 설계 (`HR_SYNC_HISTORY`)
  - 동기화 일시, 성공/실패 건수, 에러 로그

**Frontend - 관리자 동기화 UI**
- [ ] 동기화 버튼 추가 (`src/domains/hr/pages/SyncManagementPage.tsx`)
  - "직원 정보 동기화", "부서 정보 동기화" 버튼
  - 동기화 이력 조회
  - 성공/실패 건수 표시

**검증 및 최적화**
- [ ] Mock Repository ↔ Real Repository 교체 테스트
  - Service 코드 수정 없이 Repository만 교체 가능한지 확인
- [ ] 전체 화면 Flow 테스트
  - 직원 목록 → 상세 → 조직도 → 부서 상세 → 직원 목록
- [ ] 성능 테스트
  - 1000명 이상 직원 데이터 조회 성능
  - 조직도 트리 변환 속도

**문서화**
- [ ] API 명세서 작성 (Swagger)
- [ ] 외부 연동 가이드 작성 (오라클 팀 전달용)

#### 산출물
- `server/app/api/v1/hr.py` (동기화 엔드포인트)
- `client/src/domains/hr/pages/SyncManagementPage.tsx`
- `docs/api/HR_API_SPEC.md` (외부 연동 가이드)

---

## 🚀 향후 확장 계획 (5주차 이후)

### Phase 2: CRUD 기능 구현
- **직원 정보 수정**: 부서 이동, 직책 변경
- **겸직 추가/삭제**: 겸직 정보 관리
- **부서 정보 수정**: 부서명, 부서장 변경
- **조직도 재편성**: 상위 부서 변경, 순서 조정

### Phase 3: 실시간 연동
- **예약 배치**: 매일 자정 자동 동기화
- **Webhook 지원**: 오라클 시스템 변경 시 실시간 Push
- **충돌 해결**: 양쪽 시스템에서 수정된 데이터 병합 정책

### Phase 4: 고급 기능
- **조직도 히스토리**: 연도별 조직 변경 이력 조회
- **직원 이력 관리**: 부서 이동 이력, 직책 변경 이력
- **통계 대시보드**: 부서별 인원 현황, 직책별 분포

---

## 📌 주요 체크포인트

### 아키텍처 준수
- [ ] Router → Service → Repository/Calculator/Formatter 흐름 준수
- [ ] Service에서 직접 DB 접근 금지 (Repository로 위임)
- [ ] Calculator는 순수 함수로 구현 (Side Effect 금지)

### 타입 안전성
- [ ] 모든 함수에 타입 힌트 명시 (Python)
- [ ] `any` 타입 사용 금지 (TypeScript)
- [ ] Pydantic 스키마로 Request/Response 검증

### DB 마이그레이션
- [ ] 모든 스키마 변경은 Alembic 마이그레이션으로 관리
- [ ] `downgrade()` 함수 필수 구현

### 디자인 시스템
- [ ] 인라인 스타일 금지 (Tailwind 유틸리티 클래스 사용)
- [ ] `alert()` 금지 → Toast/Modal 사용
- [ ] 1on1-Mirror 색상 팔레트 준수

---

## 🎯 핵심 성공 지표

1. **확장성**: Mock Repository → Real Repository 전환 시 Service 코드 수정 없음
2. **타입 안전성**: `mypy` 통과율 100%, TypeScript 컴파일 에러 0건
3. **성능**: 1000명 직원 목록 조회 2초 이내, 조직도 트리 변환 1초 이내
4. **문서화**: 외부 연동 가이드 작성 완료, API 명세서 100% 커버

---

## 📝 상세 TASK 정의 (Sonnet 4.5 최적화)

> 각 TASK는 Sonnet 4.5가 한 번에 처리하기 적절한 크기로 구성되었습니다.
> Backend와 Frontend를 분리하되, 관련 파일들을 그룹화하여 효율적으로 작업할 수 있습니다.

---

### 1주차 TASK

#### TASK 1-1: HR 도메인 기본 구조 + SQLAlchemy 모델
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `server/app/domain/hr/` 폴더 구조 생성
- [ ] `server/app/domain/hr/models/user.py` - `CMUser` 모델 (CM_USER 테이블)
- [ ] `server/app/domain/hr/models/employee.py` - `HRMgnt` 모델 (HR_MGNT 테이블)
- [ ] `server/app/domain/hr/models/concurrent_position.py` - `HRMgntConcur` 모델 (HR_MGNT_CONCUR 테이블)
- [ ] `server/app/domain/hr/models/department.py` - `CMDepartment`, `CMDepartmentTree` 모델
- [ ] `server/app/domain/hr/models/__init__.py` - 모델 export

**산출물**: 6개 파일 (5개 모델 + 1개 __init__)

**검증**:
- [ ] 모든 모델에 타입 힌트 완료
- [ ] 테이블명, 컬럼명 정확히 매핑
- [ ] Foreign Key 관계 정의 완료

---

#### TASK 1-2: Pydantic 스키마 + Repository 인터페이스
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `server/app/domain/hr/schemas/employee.py` - `EmployeeProfile`, `ConcurrentPosition`, `EmployeeListResponse`
- [ ] `server/app/domain/hr/schemas/department.py` - `DepartmentInfo`, `OrgTreeNode`, `DepartmentListResponse`
- [ ] `server/app/domain/hr/schemas/__init__.py` - 스키마 export
- [ ] `server/app/domain/hr/repositories/employee_repository.py` - `IEmployeeRepository` (인터페이스)
- [ ] `server/app/domain/hr/repositories/department_repository.py` - `IDepartmentRepository` (인터페이스)
- [ ] `server/app/domain/hr/repositories/__init__.py` - Repository export

**산출물**: 6개 파일

**검증**:
- [ ] Pydantic v2 문법 사용 (ConfigDict 등)
- [ ] 모든 필드에 타입 힌트 및 description 추가
- [ ] Repository는 ABC 상속하여 추상 메서드 정의

---

#### TASK 1-3: Mock JSON 데이터 + Mock Repository 구현
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `server/app/domain/hr/repositories/mock/` 폴더 생성
- [ ] `employee_mock.json` - 직원 20명 (겸직자 5명, 퇴직자 3명 포함)
- [ ] `department_mock.json` - 부서 15개 (3-depth 계층, 부서장 정보 포함)
- [ ] `org_tree_mock.json` - 조직도 뷰 데이터
- [ ] `server/app/domain/hr/repositories/mock/employee_mock_repository.py` - Mock 구현체
- [ ] `server/app/domain/hr/repositories/mock/department_mock_repository.py` - Mock 구현체
- [ ] `server/app/domain/hr/repositories/mock/__init__.py` - Mock Repository export

**산출물**: 7개 파일 (3개 JSON + 3개 Python + 1개 __init__)

**검증**:
- [ ] Mock 데이터가 실제 테이블 스키마와 일치
- [ ] 겸직자의 경우 HR_MGNT_CONCUR에 2개 이상 레코드
- [ ] Mock Repository가 IRepository 인터페이스 구현

---

#### TASK 1-4: Alembic 마이그레이션 생성
**예상 소요**: 30분 - 1시간

**작업 내용**:
- [ ] 기존 마이그레이션 파일 확인 (`alembic/versions/`)
- [ ] `alembic revision --autogenerate -m "Add HR tables"` 실행
- [ ] 생성된 마이그레이션 파일 검토
  - CM_USER, HR_MGNT, HR_MGNT_CONCUR, CM_DEPARTMENT, CM_DEPARTMENT_TREE
  - Foreign Key 제약조건 확인
  - Index 추가 (EMP_NO, DEPT_CODE, USER_ID)
- [ ] `downgrade()` 함수 구현
- [ ] `alembic upgrade head` 실행하여 테스트

**산출물**: 1개 마이그레이션 파일

**검증**:
- [ ] `alembic upgrade head` 성공
- [ ] `alembic downgrade -1` 성공
- [ ] DB에 5개 테이블 생성 확인

---

### 2주차 TASK

#### TASK 2-1: 직원 Service + Formatter + Repository 구현
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] `server/app/domain/hr/formatters/employee_formatter.py` - 겸직 정보 병합 로직
- [ ] `server/app/domain/hr/formatters/__init__.py`
- [ ] `server/app/domain/hr/service.py` - `HRService` 클래스 생성
  - `get_employees()` - 목록 조회 (필터링, 검색, 페이징)
  - `get_employee_by_id()` - 상세 조회
  - Mock Repository 주입 (DI)
- [ ] `server/app/domain/hr/__init__.py` - Service export

**산출물**: 4개 파일

**검증**:
- [ ] Service는 Repository 인터페이스에만 의존 (구현체 무관)
- [ ] Formatter로 주소속 + 겸직 정보 병합
- [ ] 검색 기능 (성명, 사번, 부서)
- [ ] 필터링 (재직 여부, 직책)

---

#### TASK 2-2: 직원 Router + API 엔드포인트
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `server/app/api/v1/hr.py` - HR Router 생성
  - `GET /api/v1/hr/employees` - 목록 조회
  - `GET /api/v1/hr/employees/{emp_no}` - 상세 조회
  - Query Parameters: `search`, `on_work_yn`, `position_code`, `page`, `limit`
- [ ] `server/app/api/v1/__init__.py` - hr router 등록
- [ ] `server/app/main.py` - hr router include

**산출물**: 3개 파일 (1개 신규 + 2개 수정)

**검증**:
- [ ] Swagger UI에서 API 문서 확인
- [ ] 각 엔드포인트 200 응답 확인
- [ ] 에러 응답 정의 (404, 422 등)

---

#### TASK 2-3: Frontend - HR API 클라이언트 + Zustand Store
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `client/src/domains/hr/` 폴더 구조 생성
- [ ] `client/src/domains/hr/types.ts` - TypeScript 타입 정의
  - `Employee`, `ConcurrentPosition`, `EmployeeListResponse`
- [ ] `client/src/domains/hr/api.ts` - API 클라이언트 함수
  - `getEmployees()`, `getEmployeeById()`
- [ ] `client/src/domains/hr/store.ts` - Zustand 스토어
  - `employees`, `selectedEmployee`, `loading`, `error`
  - `fetchEmployees()`, `fetchEmployeeById()`, `setFilters()`
- [ ] `client/src/domains/hr/index.ts` - export

**산출물**: 5개 파일

**검증**:
- [ ] apiClient 사용 (axios 직접 import 금지)
- [ ] 타입 안전성 (any 타입 사용 금지)
- [ ] 에러 처리 로직 포함

---

#### TASK 2-4: Frontend - 직원 목록 페이지
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] `client/src/domains/hr/pages/EmployeeListPage.tsx` - 메인 페이지
- [ ] `client/src/domains/hr/components/EmployeeSearchBar.tsx` - 검색 바
- [ ] `client/src/domains/hr/components/EmployeeTable.tsx` - 테이블
- [ ] `client/src/domains/hr/components/ConcurrentBadge.tsx` - 겸직 배지
- [ ] `client/src/domains/hr/components/index.ts` - 컴포넌트 export

**산출물**: 5개 파일

**검증**:
- [ ] 검색 기능 동작 (성명, 사번, 부서)
- [ ] 필터링 동작 (재직 여부, 직책)
- [ ] 겸직자에게 "겸직" 배지 표시
- [ ] 페이징 동작 확인
- [ ] Tailwind CSS 사용 (인라인 스타일 금지)
- [ ] 1on1-Mirror 디자인 시스템 준수

---

#### TASK 2-5: Frontend - 직원 상세 페이지
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `client/src/domains/hr/pages/EmployeeDetailPage.tsx` - 상세 페이지
- [ ] `client/src/domains/hr/components/EmployeeInfoCard.tsx` - 기본 정보 카드
- [ ] `client/src/domains/hr/components/ConcurrentPositionList.tsx` - 겸직 정보 리스트
- [ ] React Router 라우팅 설정 (`/hr/employees/:empNo`)

**산출물**: 3개 파일 (+ 라우팅 설정 1개)

**검증**:
- [ ] 직원 기본 정보 표시 (사번, 성명, 부서, 직책, 재직 여부)
- [ ] 겸직 정보 표시 (겸직 부서 + 직책 리스트)
- [ ] 목록으로 돌아가기 버튼 동작
- [ ] 디자인 시스템 준수

---

### 3주차 TASK

#### TASK 3-1: 조직도 Calculator + Service 구현
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] `server/app/domain/hr/calculators/org_tree_calculator.py` - 트리 변환 로직
  - `build_tree()` - 리스트 → 계층형 JSON 변환
  - `DISP_LVL` 기준 정렬
- [ ] `server/app/domain/hr/calculators/__init__.py`
- [ ] `server/app/domain/hr/service.py` 확장
  - `get_org_tree()` - 조직도 조회
  - `get_department_info()` - 부서 상세 조회
  - `get_department_employees()` - 부서별 직원 목록

**산출물**: 3개 파일 (2개 신규 + 1개 수정)

**검증**:
- [ ] Calculator는 순수 함수 (Side Effect 금지)
- [ ] 3-depth 계층 구조 정확히 변환
- [ ] 부서장 정보 포함
- [ ] 소속 직원 수 집계

---

#### TASK 3-2: 부서 Router + API 엔드포인트
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `server/app/api/v1/hr.py` 확장
  - `GET /api/v1/hr/org-tree` - 조직도 트리
  - `GET /api/v1/hr/departments/{dept_code}` - 부서 상세
  - `GET /api/v1/hr/departments/{dept_code}/employees` - 부서별 직원 목록

**산출물**: 1개 파일 (수정)

**검증**:
- [ ] Swagger UI에서 API 문서 확인
- [ ] 조직도 트리 구조 확인
- [ ] 부서 상세 정보 응답 확인

---

#### TASK 3-3: Frontend - 조직도 API 확장 + Store 업데이트
**예상 소요**: 1시간

**작업 내용**:
- [ ] `client/src/domains/hr/types.ts` 확장
  - `Department`, `OrgTreeNode`, `DepartmentDetail`
- [ ] `client/src/domains/hr/api.ts` 확장
  - `getOrgTree()`, `getDepartmentById()`, `getDepartmentEmployees()`
- [ ] `client/src/domains/hr/store.ts` 확장
  - `orgTree`, `selectedDepartment`, `departmentEmployees`
  - `fetchOrgTree()`, `fetchDepartmentById()`, `fetchDepartmentEmployees()`

**산출물**: 3개 파일 (수정)

**검증**:
- [ ] 타입 안전성 유지
- [ ] API 클라이언트 정상 동작

---

#### TASK 3-4: Frontend - 조직도 트리 뷰 컴포넌트
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] `client/src/domains/hr/pages/OrgChartPage.tsx` - 조직도 메인 페이지
- [ ] `client/src/domains/hr/components/OrgTreeView.tsx` - 재귀형 트리 컴포넌트
- [ ] `client/src/domains/hr/components/OrgTreeNode.tsx` - 트리 노드 컴포넌트
- [ ] React Router 라우팅 설정 (`/hr/org-chart`)

**산출물**: 3개 파일 (+ 라우팅 설정)

**검증**:
- [ ] 3-depth 계층 구조 시각화
- [ ] 부서 클릭 시 상세 정보 표시
- [ ] 부서장 정보, 소속 직원 수 표시
- [ ] 확장/축소 애니메이션
- [ ] 디자인 시스템 준수

---

#### TASK 3-5: Frontend - 부서 상세 페이지
**예상 소요**: 1-2시간

**작업 내용**:
- [ ] `client/src/domains/hr/pages/DepartmentDetailPage.tsx` - 부서 상세 페이지
- [ ] `client/src/domains/hr/components/DepartmentInfoCard.tsx` - 부서 정보 카드
- [ ] `client/src/domains/hr/components/DepartmentEmployeeList.tsx` - 소속 직원 리스트
- [ ] React Router 라우팅 설정 (`/hr/departments/:deptCode`)

**산출물**: 3개 파일 (+ 라우팅 설정)

**검증**:
- [ ] 부서 기본 정보 표시
- [ ] 부서장 정보 표시
- [ ] 소속 직원 리스트 (겸직자 포함)
- [ ] 조직도로 돌아가기 버튼
- [ ] 디자인 시스템 준수

---

### 4주차 TASK

#### TASK 4-1: 동기화 API + 이력 테이블 + 마이그레이션
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] `server/app/domain/hr/models/sync_history.py` - `HRSyncHistory` 모델
- [ ] `server/app/domain/hr/schemas/sync.py` - `EmployeeSyncRequest`, `DepartmentSyncRequest`, `SyncHistoryResponse`
- [ ] `server/app/domain/hr/service.py` 확장
  - `sync_employees()` - 직원 정보 Bulk Insert/Update
  - `sync_departments()` - 부서 정보 동기화
  - `get_sync_history()` - 동기화 이력 조회
- [ ] `server/app/api/v1/hr.py` 확장
  - `POST /api/v1/hr/sync/employees`
  - `POST /api/v1/hr/sync/departments`
  - `GET /api/v1/hr/sync/history`
- [ ] Alembic 마이그레이션 생성 (`HR_SYNC_HISTORY` 테이블)

**산출물**: 5개 파일 (4개 신규/수정 + 1개 마이그레이션)

**검증**:
- [ ] Bulk Insert/Update 로직 동작
- [ ] 동기화 이력 저장 확인
- [ ] 에러 로그 기록 확인

---

#### TASK 4-2: Frontend - 동기화 관리 페이지
**예상 소요**: 2시간

**작업 내용**:
- [ ] `client/src/domains/hr/types.ts` 확장 - `SyncHistory`, `SyncRequest`
- [ ] `client/src/domains/hr/api.ts` 확장 - `syncEmployees()`, `syncDepartments()`, `getSyncHistory()`
- [ ] `client/src/domains/hr/store.ts` 확장 - `syncHistory`, `fetchSyncHistory()`
- [ ] `client/src/domains/hr/pages/SyncManagementPage.tsx` - 동기화 관리 페이지
- [ ] `client/src/domains/hr/components/SyncButton.tsx` - 동기화 버튼 컴포넌트
- [ ] `client/src/domains/hr/components/SyncHistoryTable.tsx` - 이력 테이블
- [ ] React Router 라우팅 설정 (`/hr/sync`)

**산출물**: 7개 파일

**검증**:
- [ ] "직원 정보 동기화" 버튼 동작
- [ ] "부서 정보 동기화" 버튼 동작
- [ ] 동기화 이력 조회 및 표시
- [ ] 성공/실패 건수 표시
- [ ] Toast 알림 표시

---

#### TASK 4-3: 메뉴 등록 + 권한 설정
**예상 소요**: 1시간

**작업 내용**:
- [ ] Alembic 마이그레이션 생성 (메뉴 데이터)
  - `M700` - 인사관리 (Root)
  - `M710` - 직원 관리
  - `M720` - 조직도 관리
  - `M730` - 동기화 관리
- [ ] 메뉴 URL 매핑
  - `/hr/employees` → M710
  - `/hr/org-chart` → M720
  - `/hr/sync` → M730
- [ ] 권한 설정 (시스템 관리자만 접근)

**산출물**: 1개 마이그레이션 파일

**검증**:
- [ ] 메뉴 트리에 인사관리 메뉴 표시
- [ ] 각 메뉴 클릭 시 페이지 이동 확인
- [ ] 권한 없는 사용자 접근 차단 확인

---

#### TASK 4-4: 통합 테스트 + API 문서화
**예상 소요**: 2-3시간

**작업 내용**:
- [ ] Backend 통합 테스트 작성
  - `tests/domain/hr/test_service.py` - Service 테스트
  - `tests/api/v1/test_hr.py` - API 엔드포인트 테스트
- [ ] Frontend E2E Flow 테스트
  - 직원 목록 → 상세 → 조직도 → 부서 상세 → 직원 목록
- [ ] Mock Repository ↔ Real Repository 교체 테스트
- [ ] API 명세서 작성
  - `docs/api/HR_API_SPEC.md` - 외부 연동 가이드
  - Swagger UI 스크린샷 포함
- [ ] 성능 테스트
  - 1000명 직원 데이터 조회 성능
  - 조직도 트리 변환 속도

**산출물**: 4개 파일 (2개 테스트 + 1개 문서 + 1개 성능 리포트)

**검증**:
- [ ] 모든 테스트 통과
- [ ] API 문서 완성도 100%
- [ ] 성능 목표 달성 (직원 목록 2초 이내, 트리 변환 1초 이내)

---

## 📊 TASK 진행 현황

### 1주차 (4 TASK)
- [ ] TASK 1-1: HR 도메인 기본 구조 + SQLAlchemy 모델
- [ ] TASK 1-2: Pydantic 스키마 + Repository 인터페이스
- [ ] TASK 1-3: Mock JSON 데이터 + Mock Repository 구현
- [ ] TASK 1-4: Alembic 마이그레이션 생성

### 2주차 (5 TASK)
- [ ] TASK 2-1: 직원 Service + Formatter + Repository 구현
- [ ] TASK 2-2: 직원 Router + API 엔드포인트
- [ ] TASK 2-3: Frontend - HR API 클라이언트 + Zustand Store
- [ ] TASK 2-4: Frontend - 직원 목록 페이지
- [ ] TASK 2-5: Frontend - 직원 상세 페이지

### 3주차 (5 TASK)
- [ ] TASK 3-1: 조직도 Calculator + Service 구현
- [ ] TASK 3-2: 부서 Router + API 엔드포인트
- [ ] TASK 3-3: Frontend - 조직도 API 확장 + Store 업데이트
- [ ] TASK 3-4: Frontend - 조직도 트리 뷰 컴포넌트
- [ ] TASK 3-5: Frontend - 부서 상세 페이지

### 4주차 (4 TASK)
- [ ] TASK 4-1: 동기화 API + 이력 테이블 + 마이그레이션
- [ ] TASK 4-2: Frontend - 동기화 관리 페이지
- [ ] TASK 4-3: 메뉴 등록 + 권한 설정
- [ ] TASK 4-4: 통합 테스트 + API 문서화

---

**작성일**: 2026-02-12
**작성자**: Claude (AI Assistant)
**문서 버전**: 1.1 (상세 TASK 추가)
