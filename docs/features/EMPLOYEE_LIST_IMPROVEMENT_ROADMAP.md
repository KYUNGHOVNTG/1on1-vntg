# 직원 관리 화면 개선 로드맵

> **작성일**: 2026-02-19  
> **관련 파일**: `EmployeeListPage.tsx`, `service.py`, `employee_db_repository.py`, `types.ts`

---

## 개요 및 현황 분석

### 현재 문제점

| # | 분류 | 문제 | 위치 |
|---|---|---|---|
| 1 | UI/조회조건 | 재직여부 select가 브라우저 기본 디자인 | `EmployeeListPage.tsx` |
| 2 | UI/조회조건 | 직책 조회조건이 코드 직접 입력 (텍스트박스) | `EmployeeListPage.tsx` |
| 3 | UI/조회조건 | 부서 조회조건이 코드 직접 입력 (텍스트박스) | `EmployeeListPage.tsx` |
| 4 | UI/목록 | 명수 뱃지 배경색과 글자색이 같아 안 보임 | `EmployeeListPage.tsx` |
| 5 | 데이터/목록 | 부서코드만 표시 (부서명 미표시) | `EmployeeListPage.tsx`, `service.py` |
| 6 | 데이터/목록 | 직책코드만 표시 (직책명 미표시) | `EmployeeListPage.tsx`, `service.py` |
| 7 | 데이터/목록 | 겸직자 미반영: 겸직 2개면 3ROW여야 하나 1ROW만 조회됨 | `service.py`, `employee_db_repository.py` |
| 8 | 데이터/목록 | 겸직 ROW에 겸직 라벨 미표시 | `EmployeeListPage.tsx` |
| 9 | 데이터/동기화 | 겸직 목데이터가 실제 조회 데이터 구조(CONCUR 기반)와 불일치 | `SyncManagementPage.tsx`, `service.py` |

---

## 데이터 구조 분석 (Q3 선행 답변)

### 현재 동기화 방식과 조회 요건의 정합성

**요구 실제 데이터 구조:**
```
HR_MGNT (직원 기본정보 - 항상 1ROW)
  emp_no: E004, dept_code: D002, position_code: P004

HR_MGNT_CONCUR (겸직 정보 - 0~N ROW)
  E004 / D002 / is_main=Y / P004  ← 주소속
  E004 / D003 / is_main=N / P005  ← 겸직
```

**조회 시 기대 결과 (3ROW):**
```
ROW 1: E004 / 최개발 / D002(개발팀) / P004(팀장)  / Y [본직]
ROW 2: E004 / 최개발 / D002(개발팀) / P004(팀장)  / Y [본직] → CONCUR is_main=Y 기반
ROW 3: E004 / 최개발 / D003(디자인팀)/ P005(팀원) / Y [겸직] → CONCUR is_main=N 기반
```

> ⚠️ **현재 동기화**: `concurrent_positions`가 전달되면 `HR_MGNT_CONCUR`에 저장되도록 이미 수정됨.  
> 단, **조회 API가 아직 CONCUR 기반의 펼쳐진 ROW를 반환하지 않기 때문에** 목록이 1ROW로만 표시됩니다.

---

## TASK 분리 (순서대로 작업 요청)

---

### ✅ TASK 1: 직원 목록 명수 뱃지 가시성 수정 (즉시 적용, UI만)

**작업 범위**: `EmployeeListPage.tsx`만 수정  
**예상 소요**: 5분  

**수정 내용:**
- 현재: `bg-[#4950DC] bg-opacity-10 text-[#4950DC]` → 배경색 투명도를 낮춰도 색이 비슷해 텍스트가 안 보임
- 변경: 배경 흰색 + 테두리 + 진한 텍스트 색상으로 교체 (e.g. `bg-white border border-[#4950DC] text-[#4950DC]`)

**변경 전:**
```tsx
<span className="px-2.5 py-0.5 bg-[#4950DC] bg-opacity-10 text-[#4950DC] ...">
  {total}명
</span>
```

---

### ✅ TASK 2: 조회조건 - 재직여부 공통 Select 컴포넌트 적용

**작업 범위**: `EmployeeListPage.tsx`  
**예상 소요**: 15분  

**수정 내용:**
- 브라우저 기본 `<select>`를 공통 Select 컴포넌트로 교체
- 공통 컴포넌트가 없을 경우 직접 styled select 구현 (프로젝트 디자인 시스템 준수)

```tsx
// 변경 전: 브라우저 기본 select
<select className="h-10 w-full ...">

// 변경 후: 공통 Select 스타일 적용
<select className="h-10 w-full px-3 border border-gray-200 rounded-xl text-sm
  focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none
  bg-white appearance-none cursor-pointer ...">
```

---

### ✅ TASK 3: 조회조건 - 직책 Select (공통코드 테이블 연동)

**작업 범위**: Backend(`common` domain API 추가 또는 활용) + Frontend  
**예상 소요**: 30분  

**수정 내용:**
- `GET /api/v1/common/codes?code_type=POSITION` API를 통해 `cm_codedetail` 테이블에서 직책 목록 조회
- 기존 텍스트 입력 → `<select>`로 교체 (직책코드 value, 직책명 label)

**API 흐름:**
```
cm_codedetail WHERE code_type = 'POSITION' AND use_yn = 'Y'
→ [{ code: 'P001', code_name: '대표' }, { code: 'P002', code_name: '이사' }, ...]
→ <select> option으로 렌더링
```

**UI 변경:**
```tsx
// 변경 전: 텍스트 입력
<input placeholder="직책 코드" value={positionCode} ... />

// 변경 후: Select
<select value={positionCode} onChange={...}>
  <option value="">전체</option>
  <option value="P001">대표</option>
  ...
</select>
```

---

### ✅ TASK 4: 조회조건 - 부서 Select (cm_department 테이블 연동)

**작업 범위**: Frontend (`api.ts` 기존 getDepartments 활용)  
**예상 소요**: 20분  

**수정 내용:**
- 기존 `getDepartments()` API 활용 (이미 구현됨)
- 기존 텍스트 입력 → `<select>`로 교체 (부서코드 value, 부서명 label)

**UI 변경:**
```tsx
// 변경 전: 텍스트 입력
<input placeholder="부서 코드" value={deptCode} ... />

// 변경 후: Select (useEffect로 마운트 시 loadDepartments)
<select value={deptCode} onChange={...}>
  <option value="">전체</option>
  <option value="D001">경영지원팀</option>
  ...
</select>
```

---

### ✅ TASK 5: Backend - 직원 목록 조회 시 부서명·직책명 조인 반환

**작업 범위**: `service.py`, `employee_db_repository.py`, `schemas/employee.py`, `types.ts`  
**예상 소요**: 30분  
**완료**: 2026-02-19

**구현 내용:**
- `employee_db_repository.py` `find_all()`: `cm_department` LEFT JOIN → `dept_name`, `cm_codedetail(POSITION)` LEFT JOIN → `position_name`  
  - 반환 타입: `List[HRMgnt]` → `List[Dict[str, Any]]`
- `service.py` `get_employee_list()`: dict 기반으로 `EmployeeDetailResponse` 생성 시 `dept_name`, `position_name` 포함
- `types.ts` `Employee` 인터페이스: `dept_name?`, `position_name?` 옵셔널 필드 추가
- `EmployeeListPage.tsx`: 테이블 헤더 `부서 코드` → `부서명`, `직책 코드` → `직책명` / 표시값 `dept_name ?? dept_code`, `position_name ?? position_code`

---

### ✅ TASK 6: Backend - 겸직 전개 조회 쿼리 구현 (핵심 작업)

**작업 범위**: `service.py`, `employee_db_repository.py`, `schemas/employee.py`, `router.py`  
**예상 소요**: 60분  

**수정 내용 (상세):**

**① 새 응답 스키마 추가 (`schemas/employee.py`)**
```python
class EmployeeRowResponse(BaseModel):
    """직원 목록 1ROW (겸직 전개 포함)"""
    emp_no: str
    name_kor: str
    dept_code: str
    dept_name: Optional[str]
    position_code: str
    position_name: Optional[str]
    on_work_yn: str
    is_concurrent: bool       # 겸직 ROW 여부 (True면 겸직 라벨 표시)
    is_main: str              # Y: 본직, N: 겸직
```

**② Repository 조회 쿼리 수정 (`employee_db_repository.py`)**

조회 결과 예시:
```
E004 / 최개발 / D002 / 개발팀 / P004 / 팀장 / Y / is_concurrent=False / is_main=Y  ← HR_MGNT 기본 ROW
E004 / 최개발 / D002 / 개발팀 / P004 / 팀장 / Y / is_concurrent=True  / is_main=Y  ← CONCUR 주소속
E004 / 최개발 / D003 / 디자인팀/ P005 / 팀원  / Y / is_concurrent=True  / is_main=N  ← CONCUR 겸직
```

> ※ 요구사항 재확인 필요: "HR_MGNT 1ROW + CONCUR 2ROW = 총 3ROW" 기준인지,  
> 또는 "CONCUR 0ROW인 직원은 HR_MGNT 1ROW, CONCUR 2ROW인 직원은 CONCUR 2ROW" 기준인지  

**③ 기존 호환성 유지**  
- 기존 `/employees` 엔드포인트는 기존 모드 유지
- `expand_concurrent=true` 파라미터로 전개 모드 선택적 활성화 (또는 항상 전개)

---

### ✅ TASK 7: Frontend - 겸직 전개 목록 표시 및 겸직 라벨

**작업 범위**: `EmployeeListPage.tsx`, `types.ts`  
**예상 소요**: 30분  

**수정 내용:**

**① `types.ts` 타입 추가**
```typescript
export interface EmployeeRow {
  emp_no: string;
  name_kor: string;
  dept_code: string;
  dept_name?: string;
  position_code: string;
  position_name?: string;
  on_work_yn: 'Y' | 'N';
  is_concurrent: boolean;
  is_main: 'Y' | 'N';
}
```

**② 목록 테이블 컬럼 변경**
- `부서 코드` → `부서명`
- `직책 코드` → `직책명`
- 겸직 ROW에 배지 표시

**③ 겸직 라벨 표시 예시**
```tsx
<td>
  {employee.name_kor}
  {employee.is_concurrent && employee.is_main === 'N' && (
    <span className="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-xs">
      겸직
    </span>
  )}
</td>
```

---

### ✅ TASK 8: 동기화 목데이터 정합성 검증 및 수정 (필요 시)

**작업 범위**: `SyncManagementPage.tsx`, `service.py`의 `sync_employees()`  
**예상 소요**: 20분  

**검증 포인트:**
1. **현재 동기화 후 CONCUR 테이블 데이터가 올바르게 저장되는가?**
   - `HR_MGNT_CONCUR`: E004/(D002/Y/P004), (D003/N/P005)
   - `HR_MGNT_CONCUR`: E006/(D002/Y/P005), (D004/N/P005)
   - `HR_MGNT_CONCUR`: E008/(D002/Y/P005), (D005/N/P005)

2. **TASK 6에서 구현한 쿼리로 올바른 ROW 수가 반환되는가?**

**조치:**
- CONCUR 기반 전개 쿼리와 목데이터 사번 체계 일치 여부 확인 (EMP004 vs E004)
- 목데이터 재동기화 후 DB 확인

---

## 작업 순서 및 의존관계

```
TASK 1 (명수 뱃지)        ← 독립 / 즉시 가능
TASK 2 (재직여부 Select)  ← 독립 / 즉시 가능
TASK 3 (직책 Select)      ← Backend 공통코드 API 확인 필요
TASK 4 (부서 Select)      ← 독립 / getDepartments API 기존 활용
TASK 5 (부서·직책명 Backend) ← TASK 6 전에 선행 작업
TASK 6 (겸직 전개 Backend)  ← 핵심 / TASK 5 이후
TASK 7 (겸직 Frontend)    ← TASK 6 완료 후
TASK 8 (목데이터 검증)    ← TASK 6, 7 완료 후 최종 검증
```

| TASK | 범위 | 예상 시간 | 의존 |
|---|---|---|---|
| 1 | Frontend Only | 5분 | 없음 |
| 2 | Frontend Only | 15분 | 없음 |
| 3 | Backend + Frontend | 30분 | 없음 |
| 4 | Frontend Only | 20분 | 없음 |
| 5 | Backend | 30분 | 없음 |
| 6 | Backend (핵심) | 60분 | TASK 5 권장 |
| 7 | Frontend | 30분 | TASK 6 |
| 8 | 검증 + 수정 | 20분 | TASK 6, 7 |

**총 예상 소요**: 약 3.5시간 (단계적 진행)
