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
| **HR_MGNT** | 인사 정보 (주소속) | EMP_NO(PK), USER_ID(FK), NAME_KOR, DEPT_CODE, POSITION_CODE, ON_WORK_YN |
| **HR_MGNT_CONCUR** | 겸직 정보 | EMP_NO(FK), DEPT_CODE, IS_MAIN(Y/N), POSITION_CODE |
| **CM_DEPARTMENT** | 부서 정보 | DEPT_CODE(PK), DEPT_NAME, UPPER_DEPT_CODE, DEPT_HEAD_EMP_NO |
| **CM_DEPARTMENT_TREE** | 조직도 뷰 | STD_YEAR, DEPT_CODE, UPPER_DEPT_CODE, DISP_LVL, DEPT_HEAD_EMP_NO |

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

**작성일**: 2026-02-12
**작성자**: Claude (AI Assistant)
**문서 버전**: 1.0
