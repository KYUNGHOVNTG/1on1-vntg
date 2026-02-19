# 동기화 관리 (Sync Management)

> **메뉴 경로**: HR 관리 > 동기화 관리  
> **최종 수정**: 2026-02-19  
> **담당 테이블**: `HR_MGNT`, `HR_MGNT_CONCUR`, `CM_DEPARTMENT`, `CM_DEPARTMENT_TREE`, `HR_SYNC_HISTORY`

---

## 1. 개요

동기화 관리 메뉴는 **외부 HR 시스템(Oracle ERP 등)의 데이터를 1on1 면담 시스템으로 가져오는 기능**을 제공합니다.  
직원 기본정보, 겸직 정보, 부서 정보를 일괄 동기화하고, 모든 동기화 작업의 이력을 관리합니다.

### 1.1 대상 테이블 관계

```
외부 HR 시스템
    │
    ├── 직원 정보 동기화 ──▶ HR_MGNT (직원 기본정보)
    │                   └──▶ HR_MGNT_CONCUR (겸직 정보)
    │
    └── 부서 정보 동기화 ──▶ CM_DEPARTMENT (부서 기본정보)
                        └──▶ CM_DEPARTMENT_TREE (조직도 트리)

모든 동기화 결과 ──▶ HR_SYNC_HISTORY (이력 기록)
```

---

## 2. 동기화 방식: UPSERT

### 핵심 원칙

**사번(`emp_no`)과 부서코드(`dept_code`)는 PK이므로 DELETE되지 않습니다.**  
동기화는 항상 **UPSERT(Insert or Update)** 방식으로 동작하여, 기존 데이터가 사라지는 일 없이 변경분만 반영됩니다.

| 시나리오 | 동작 |
|---|---|
| 신규 직원 추가 | INSERT |
| 기존 직원 정보 변경 | UPDATE |
| 이미 동기화된 직원 재동기화 | UPDATE (변경 없으면 최신 값으로 덮어씀) |
| 다음날 외부 시스템에 직원 1명 추가 후 재동기화 | 새 직원만 INSERT, 기존 직원은 UPDATE |

> ⚠️ **주의**: 현재 구현은 소프트 삭제(on_work_yn='N')를 지원하지만, 동기화 시 외부 시스템에서 퇴직 처리(`on_work_yn: 'N'`)한 직원 정보를 포함해야 정상 반영됩니다. 외부 시스템에서 제외된 직원은 자동 퇴직 처리되지 않습니다.

---

## 3. 직원 정보 동기화

### 3.1 엔드포인트

```
POST /api/v1/hr/sync/employees
```

### 3.2 요청 스키마 (`EmployeeSyncRequest`)

```json
[
  {
    "emp_no": "E004",
    "user_id": "user004",
    "name_kor": "최개발",
    "dept_code": "D002",
    "position_code": "P004",
    "on_work_yn": "Y",
    "concurrent_positions": [
      { "dept_code": "D002", "is_main": "Y", "position_code": "P004" },
      { "dept_code": "D003", "is_main": "N", "position_code": "P005" }
    ]
  }
]
```

| 필드 | 설명 | 필수 |
|---|---|---|
| `emp_no` | 사번 (PK, 불변 키값) | O |
| `user_id` | 시스템 로그인 ID | O |
| `name_kor` | 한글 성명 | O |
| `dept_code` | 주소속 부서 코드 | O |
| `position_code` | 직책 코드 | O |
| `on_work_yn` | 재직 여부 (Y/N) | O |
| `concurrent_positions` | 겸직 정보 목록 (전달 시 Full Replace) | X (기본: 빈 배열) |

### 3.3 주소속 정보 처리 흐름 (`HR_MGNT`)

```python
# 사번으로 기존 직원 조회
existing = db.execute(select(HRMgnt).where(HRMgnt.emp_no == emp_req.emp_no))

if existing:
    # UPDATE: 이름, 부서, 직책, 재직여부만 갱신 (emp_no 변경 없음)
    existing.name_kor = emp_req.name_kor
    ...
else:
    # INSERT: 신규 직원 등록
    db.add(HRMgnt(emp_no=emp_req.emp_no, ...))
```

### 3.4 겸직 정보 처리 흐름 (`HR_MGNT_CONCUR`)

겸직 정보는 **Full Replace 방식**으로 처리됩니다:

```
concurrent_positions가 전달된 경우:
  1. hr_mgnt PK flush (FK 제약 보장)
  2. 해당 사번의 기존 겸직 레코드 전체 DELETE
  3. 전달받은 겸직 정보 전체 INSERT
  
concurrent_positions가 빈 배열인 경우:
  → 겸직 정보 변경 없음 (기존 레코드 유지)
```

> **Full Replace를 사용하는 이유**: 겸직 복합 PK(`emp_no + dept_code`)의 특성상, 기존 겸직 부서가 변경되거나 삭제되는 경우를 개별 UPSERT로 처리하기 복잡하기 때문입니다.

### 3.5 목데이터 기준 (개발/테스트용)

| 사번 | 이름 | 주소속 | 겸직 |
|---|---|---|---|
| E001~E003 | 경영지원팀 직원 | D001 | 없음 |
| E004 | 최개발 | D002 | D003 (디자인팀) |
| E005 | 정프론트 | D002 | 없음 |
| E006 | 강백엔드 | D002 | D004 (마케팅팀) |
| E007 | 조풀스택 | D002 | 없음 |
| E008 | 윤데이터 | D002 | D005 (영업팀) |
| E009~E010 | 개발팀 직원 | D002 | 없음 |
| E011~E014 | 디자인팀 직원 | D003 | 없음 |
| E015~E017 | 마케팅팀 직원 | D004 | 없음 |
| E018~E020 | 영업팀 직원 | D005 | 없음 |

---

## 4. 부서 정보 동기화

### 4.1 엔드포인트

```
POST /api/v1/hr/sync/departments
```

### 4.2 요청 스키마 (`DepartmentSyncRequest`)

```json
[
  {
    "dept_code": "D001",
    "dept_name": "경영지원팀",
    "upper_dept_code": null,
    "dept_head_emp_no": "E002",
    "use_yn": "Y"
  }
]
```

| 필드 | 설명 | 필수 |
|---|---|---|
| `dept_code` | 부서 코드 (PK) | O |
| `dept_name` | 부서명 | O |
| `upper_dept_code` | 상위 부서 코드 (null = 최상위 부서) | X |
| `dept_head_emp_no` | 부서장 사번 | X |
| `use_yn` | 사용 여부 (Y/N) | O |

### 4.3 처리 흐름

부서 동기화는 **2개 테이블을 함께 갱신**합니다:

```
Step 1. CM_DEPARTMENT UPSERT
  └─ dept_code 기준으로 존재 여부 확인 → INSERT or UPDATE

Step 2. 부서장 이름 조회 (HR_MGNT.name_kor)
  └─ dept_head_emp_no로 부서장 성명 조회

Step 3. CM_DEPARTMENT_TREE UPSERT (조직도 트리용)
  └─ std_year(현재 연도) + dept_code 기준으로 UPSERT
  └─ disp_lvl: upper_dept_code=null → 1(최상위), 아니면 → 2
```

### 4.4 조직도 자동 생성

부서 동기화 시 `CM_DEPARTMENT_TREE` 레코드가 자동으로 생성/갱신됩니다.  
별도로 조직도 동기화를 실행할 필요가 없습니다.

| 구분 | 테이블 | 용도 |
|---|---|---|
| 부서 기본정보 | `CM_DEPARTMENT` | 공통 부서 마스터 |
| 조직도 트리 | `CM_DEPARTMENT_TREE` | 연도별 계층 구조 렌더링 |

---

## 5. 동기화 이력 관리

### 5.1 엔드포인트

```
GET /api/v1/hr/sync/history?sync_type=employees&limit=50
```

### 5.2 이력 테이블 (`HR_SYNC_HISTORY`)

| 컬럼 | 설명 |
|---|---|
| `sync_id` | 이력 ID (PK, Auto Increment) |
| `sync_type` | `employees` / `departments` |
| `sync_status` | `success` / `partial` / `failure` / `in_progress` |
| `total_count` | 처리 대상 전체 건수 |
| `success_count` | 성공 건수 |
| `failure_count` | 실패 건수 |
| `error_message` | 오류 내용 (실패 시 사번/부서코드별 오류 메시지) |
| `sync_start_time` | 동기화 시작 시각 |
| `sync_end_time` | 동기화 종료 시각 |
| `in_user` | 실행자 (현재: `system` 고정) |

### 5.3 상태값 의미

| sync_status | 의미 |
|---|---|
| `in_progress` | 동기화 진행 중 (중단 감지 용도) |
| `success` | 전체 성공 (failure_count = 0) |
| `partial` | 일부 성공 (success > 0, failure > 0) |
| `failure` | 전체 실패 (success_count = 0) |

---

## 6. 프론트엔드 구조

### 6.1 컴포넌트 구조

```
SyncManagementPage (페이지)
├── 직원 정보 동기화 카드 (handleSyncEmployees)
├── 부서 정보 동기화 카드 (handleSyncDepartments)
└── SyncHistoryTable (동기화 이력 테이블)
```

### 6.2 상태 관리 (Zustand - useHRStore)

| Action | 설명 |
|---|---|
| `syncEmployees(employees)` | POST /hr/sync/employees 호출 |
| `syncDepartments(departments)` | POST /hr/sync/departments 호출 |
| `fetchSyncHistory(syncType?, limit?)` | GET /hr/sync/history 호출 |

### 6.3 로딩 상태

```typescript
loading: {
  syncEmployees: boolean,    // 직원 동기화 버튼 비활성화 제어
  syncDepartments: boolean,  // 부서 동기화 버튼 비활성화 제어
  syncHistory: boolean,      // 이력 새로고침 스피너 제어
}
```

---

## 7. 실운영 전환 가이드

현재는 **목데이터 하드코딩** 방식으로 동작합니다. 실운영 전환 시 아래 사항을 수정합니다:

### 7.1 데이터 소스 변경

```
현재 (개발): SyncManagementPage.tsx의 mockEmployees, mockDepartments 하드코딩
실운영 전환: 외부 HR API 또는 파일(CSV/JSON)에서 동적으로 데이터 수신
```

### 7.2 전환 방법 (예시)

```typescript
// 현재 (Mock)
const mockEmployees = [ ... 하드코딩 ... ];
await syncEmployees(mockEmployees);

// 실운영 (외부 API 연동)
const externalData = await fetchFromHRSystem('/api/employees');
await syncEmployees(externalData);
```

### 7.3 자동 스케줄링

실운영에서는 수동 버튼 방식 외에, 야간 배치/스케줄러로 자동 동기화를 구현할 수 있습니다. 이때 `in_user` 필드를 배치 실행자 ID로 지정하면 이력 추적이 가능합니다.

---

## 8. 확장성 고려사항

| 항목 | 현재 | 향후 확장 |
|---|---|---|
| 데이터 소스 | 목데이터 하드코딩 | 외부 Oracle HR API |
| 동기화 방식 | 수동 버튼 | 야간 자동 배치 스케줄러 |
| 겸직 처리 | Full Replace (안전) | 동일 방식 유지 |
| 오류 처리 | 개별 오류 수집 후 partial 상태 | 오류 알림(Slack 등) 연동 |
| 실행자 | `system` 고정 | 로그인 사용자 ID로 전환 |

---

## 9. 관련 파일

| 파일 | 역할 |
|---|---|
| `client/src/domains/hr/pages/SyncManagementPage.tsx` | 동기화 UI 페이지 |
| `client/src/domains/hr/store.ts` | Zustand 상태 관리 |
| `client/src/domains/hr/api.ts` | API 호출 함수 |
| `server/app/domain/hr/service.py` | SyncService (핵심 비즈니스 로직) |
| `server/app/domain/hr/schemas/sync.py` | 요청/응답 스키마 |
| `server/app/domain/hr/router.py` | API 라우터 |
| `server/app/domain/hr/models/employee.py` | HRMgnt 모델 |
| `server/app/domain/hr/models/concurrent_position.py` | HRMgntConcur 모델 |
| `server/app/domain/hr/models/department.py` | CMDepartment, CMDepartmentTree 모델 |
| `server/app/domain/hr/models/sync_history.py` | HRSyncHistory 모델 |
