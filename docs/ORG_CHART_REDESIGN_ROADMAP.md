# 조직도 관리 화면 개선 로드맵

> 작성일: 2026-02-23
> 대상 화면: `/hr/org-chart`
> 브랜치: `claude/org-chart-roadmap-Env2p`

---

## 1. 개요 및 목표

### 개선 목표

현재의 조직도 화면을 **단일 화면**으로 전면 개편한다.
페이지 이동 없이 좌/우 2-패널 레이아웃으로 구성하며, 좌측에서 부서를 선택하면
우측에 해당 부서의 상세 정보와 소속 구성원이 즉시 표시된다.

### 주요 변경 사항 요약

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| 레이아웃 | 2/3 트리 + 1/3 간단 패널 + "상세보기" 버튼(페이지 이동) | 1/2 트리 + 1/2 상세 패널 (단일 화면) |
| 트리 토글 아이콘 | `ChevronRight` / `ChevronDown` | `+` / `-` |
| 트리 Inline Style | `style={{ marginLeft: ... }}` **(규칙 위반)** | Tailwind CSS 클래스 |
| 모두 펼치기/접기 | 없음 | 트리 헤더에 버튼 추가 |
| 우측 상세 패널 | 부서명, 코드, 부서장, 직원수, 레벨 (트리 노드 데이터만 활용) | `DepartmentInfo` API 호출 → 부서코드, 부서명, **상위부서명**, 부서장, 사용여부 |
| 소속 구성원 | 없음 (별도 페이지) | 우측 패널 하단에 인라인 표시 (사번, 성명, 직책명, 재직여부) |
| 직책 표시 | `position_code` | `position_name` |
| 백엔드 부서 상세 API | `upper_dept_name` 없음 | `upper_dept_name` 포함하도록 확장 |

---

## 2. 현재 상태 분석

### 2-1. 프론트엔드 현황

#### OrgChartPage.tsx
- `grid-cols-3`으로 좌측 2칸 (트리), 우측 1칸 (간단 패널) 구성
- 우측 패널은 OrgTreeNode 데이터(`dept_name`, `dept_code`, `dept_head_name`, `employee_count`, `disp_lvl`)만 표시
- "부서 상세보기" 버튼 클릭 시 `/hr/departments/{dept_code}` 페이지로 이동 → **요구사항과 불일치**
- 부서 클릭 시 `fetchDepartmentById`, `fetchDepartmentEmployees` 미호출

#### OrgTreeNode.tsx (`components/OrgTreeNode.tsx`)
- **`style={{ marginLeft: ... }}` 인라인 스타일 사용 → 프로젝트 규칙 위반**
- 토글 아이콘: `ChevronRight` / `ChevronDown` → `+` / `-` 로 변경 필요
- 레벨 배지(`L1`, `L2`, `L3`)가 항목마다 표시되어 시각적으로 복잡함

#### OrgTreeView.tsx (`components/OrgTreeView.tsx`)
- 단순 재귀 렌더링만 수행
- 모든 노드의 expanded 상태를 외부에서 제어하는 메커니즘 없음

#### DepartmentEmployeeList.tsx (`components/DepartmentEmployeeList.tsx`)
- 직책 열에 `position_code` 표시 → `position_name` 으로 변경 필요

### 2-2. 백엔드 현황

#### 핵심 문제: 상위부서명 API 미제공

| 엔드포인트 | 스키마 | 문제 |
|-----------|--------|------|
| `GET /v1/hr/departments/{dept_code}` | `DepartmentDetailResponse` | `upper_dept_name`, `dept_head_name` 없음 |
| `GET /v1/hr/departments/{dept_code}/info` | `DepartmentInfo` | `upper_dept_name` 없음, `dept_head_name` 있음 |

→ **우측 상세 패널의 "상위부서명" 표시를 위해 백엔드 확장 필요**

#### 현재 DepartmentInfo 스키마 (`schemas/department.py`)
```python
class DepartmentInfo(DepartmentBase):
    dept_head_emp_no: Optional[str]
    dept_head_name: Optional[str]       # 있음
    employee_count: int                 # 있음
    in_date: datetime
    up_date: Optional[datetime]
    # upper_dept_name 없음 ← 추가 필요
    # dept_head_position 없음 ← 추가 필요 (선택)
    # main_employee_count 없음 ← 추가 필요 (선택)
    # concurrent_employee_count 없음 ← 추가 필요 (선택)
```

#### 부서별 직원 목록 API (정상)
- `GET /v1/hr/departments/{dept_code}/employees` → `DepartmentEmployeesResponse { items, total }`
- `EmployeeDetailResponse`에 `position_name` 필드 **이미 존재** ✓

---

## 3. 목표 화면 구조

```
┌─────────────────────────────────────────────────────────┐
│  조직도 관리                                              │
├──────────────────────────┬──────────────────────────────┤
│  조직도 관리             │  상세정보                     │
│  ┌ [모두 펼치기] [접기] ┐│  ┌──────────────────────────┐│
│  │                      ││  │ 부서코드: D001            ││
│  │ [+] 전사             ││  │ 부서명: 개발본부           ││
│  │   [-] 개발본부 ●     ││  │ 상위부서명: 전사           ││
│  │     [+] 서버팀       ││  │ 부서장: 홍길동             ││
│  │     [+] 프론트팀     ││  │ 사용여부: 사용 중          ││
│  │ [+] 경영지원본부     ││  └──────────────────────────┘│
│  │                      ││  ┌──────────────────────────┐│
│  └──────────────────────┘│  │ 소속 구성원 (5명)         ││
│                          ││  │ 사번  성명  직책  재직    ││
│                          ││  │ E001  김개발  팀장  재직  ││
│                          ││  │ E002  이서버  팀원  재직  ││
│                          ││  └──────────────────────────┘│
└──────────────────────────┴──────────────────────────────┘
```

---

## 4. 아키텍처 결정 사항

### 4-1. 모두 펼치기/접기 구현 방식
- `OrgChartPage`에서 `expandAll: boolean | undefined` 상태 관리
- `OrgTreeView` → `OrgTreeNode`로 prop 전달
- 각 노드는 `expandAll` prop이 변경될 때 `useEffect`로 자신의 `isExpanded` 상태 동기화
- "모두 펼치기" → `expandAll = true`, "모두 접기" → `expandAll = false`, 개별 토글 후 → `undefined` (외부 제어 해제)

### 4-2. 부서 클릭 시 데이터 로딩
- 부서 클릭 → `fetchDepartmentById` (DepartmentInfo: 부서 기본정보 + 부서장명 + 상위부서명) + `fetchDepartmentEmployees` 동시 호출 (Promise.all)
- 기존 `OrgTreeNode` 데이터(트리 노드)는 트리 렌더링에만 사용
- 우측 패널은 Store의 `selectedDepartment`, `departmentEmployees` 상태로 렌더링

### 4-3. 백엔드 API 활용 전략
- 기존 `GET /v1/hr/departments/{dept_code}/info` 엔드포인트에 `upper_dept_name` 추가 확장
- 프론트엔드 `getDepartmentById()` 함수가 `/info` 엔드포인트를 호출하도록 변경
- `DepartmentDetail` 프론트엔드 타입도 실제 응답과 일치하도록 정비

---

## 5. 영향 범위

| 영역 | 파일 | 변경 종류 |
|------|------|----------|
| **Backend** | `server/app/domain/hr/schemas/department.py` | `DepartmentInfo` 스키마에 `upper_dept_name` 추가 |
| **Backend** | `server/app/domain/hr/service.py` | `get_department_info()` - 상위부서 JOIN 추가 |
| **Backend** | `server/app/domain/hr/repositories/department_db_repository.py` | `find_by_dept_code()` 또는 별도 메서드에 상위부서 JOIN |
| **Frontend** | `client/src/domains/hr/types.ts` | `DepartmentDetail` 타입 정비 |
| **Frontend** | `client/src/domains/hr/api.ts` | `getDepartmentById()` → `/info` 엔드포인트로 변경 |
| **Frontend** | `client/src/domains/hr/components/OrgTreeNode.tsx` | inline style 제거, +/- 토글, 위계 표현 개선 |
| **Frontend** | `client/src/domains/hr/components/OrgTreeView.tsx` | expandAll/collapseAll prop 추가 |
| **Frontend** | `client/src/domains/hr/components/DepartmentEmployeeList.tsx` | position_name 표시 |
| **Frontend** | `client/src/domains/hr/pages/OrgChartPage.tsx` | 레이아웃 전면 개편, 우측 상세 패널 구현 |

---

## 6. Task 목록

> AI가 한 번에 작업하기 좋은 단위로 분리하였습니다.
> **순서대로 진행**하세요 (TASK 1 완료 후 TASK 2 진행 등).

---

### TASK 1: [Backend] 부서 상세 API 스키마 확장 - `upper_dept_name` 추가

**목적**: 우측 상세 패널에서 "상위부서명"을 표시하기 위해 백엔드 API 응답에 `upper_dept_name` 추가

**작업 파일**
- `server/app/domain/hr/schemas/department.py`
- `server/app/domain/hr/repositories/department_db_repository.py`
- `server/app/domain/hr/service.py`

**세부 작업**

1. `schemas/department.py`의 `DepartmentInfo` 스키마에 필드 추가:
   ```python
   upper_dept_name: Optional[str] = Field(None, description="상위 부서명")
   dept_head_position: Optional[str] = Field(None, description="부서장 직책명")
   main_employee_count: int = Field(default=0, description="주소속 직원 수")
   concurrent_employee_count: int = Field(default=0, description="겸직 직원 수")
   ```

2. `repositories/department_db_repository.py`의 부서 상세 조회 메서드에 상위부서 LEFT JOIN 추가:
   - `cm_department` self-JOIN으로 `upper_dept_name` 조회
   - 부서장 직책 조회 (`hr_mgnt` JOIN → `position_code` → `cm_codedetail` JOIN으로 `position_name`)

3. `service.py`의 `get_department_info()` 메서드에서 주소속/겸직 직원 수 분리 계산:
   - Repository에서 `main_count`, `concurrent_count` 분리 조회 또는 Service 레이어에서 계산

**완료 조건**
- `GET /v1/hr/departments/{dept_code}/info` 응답에 `upper_dept_name`, `dept_head_position`, `main_employee_count`, `concurrent_employee_count` 포함
- Python 타입 힌트 명시
- 기존 `DepartmentDetailResponse` (`/departments/{dept_code}`) 변경 없음

---

### TASK 2: [Frontend] 타입 정비 및 API 연결 교체

**목적**: 프론트엔드 타입을 백엔드 실제 응답과 일치시키고, 올바른 엔드포인트를 호출하도록 수정

**작업 파일**
- `client/src/domains/hr/types.ts`
- `client/src/domains/hr/api.ts`

**세부 작업**

1. `types.ts`의 `DepartmentDetail` 인터페이스 정비:
   ```typescript
   export interface DepartmentDetail {
     dept_code: string;
     dept_name: string;
     upper_dept_code: string | null;
     upper_dept_name: string | null;       // 추가 (TASK 1에서 백엔드 추가)
     dept_head_emp_no: string | null;
     dept_head_name: string | null;
     dept_head_position: string | null;    // 추가
     use_yn: 'Y' | 'N';
     employee_count: number;
     main_employee_count: number;          // 추가
     concurrent_employee_count: number;   // 추가
   }
   ```

2. `api.ts`의 `getDepartmentById()` 함수가 `/v1/hr/departments/{deptCode}/info` 를 호출하도록 변경:
   ```typescript
   export async function getDepartmentById(deptCode: string): Promise<DepartmentDetail> {
     const response = await apiClient.get<DepartmentDetail>(`/v1/hr/departments/${deptCode}/info`);
     return response.data;
   }
   ```

**완료 조건**
- TypeScript 컴파일 에러 없음
- 기존 Store의 `fetchDepartmentById` 동작에 영향 없음

---

### TASK 3: [Frontend] OrgTreeNode 컴포넌트 개선

**목적**: 인라인 스타일 제거, +/- 토글, 위계 시각적 표현 개선

**작업 파일**
- `client/src/domains/hr/components/OrgTreeNode.tsx`

**세부 작업**

1. **인라인 스타일 제거** (프로젝트 규칙 위반 수정):
   ```tsx
   // ❌ 현재 (규칙 위반)
   style={{ marginLeft: `${level * 24}px` }}

   // ✅ 변경 후 (Tailwind CSS)
   // level prop에 따라 cn()으로 조건부 클래스 적용
   // level 0: pl-0, level 1: pl-6, level 2: pl-12, level 3: pl-18
   ```

2. **토글 버튼 변경**:
   ```tsx
   // ❌ 현재
   <ChevronDown /> / <ChevronRight />

   // ✅ 변경 후
   <Minus className="w-3 h-3" /> // 열린 상태
   <Plus className="w-3 h-3" />  // 닫힌 상태
   // 버튼 스타일: w-5 h-5 border border-gray-300 rounded flex items-center justify-center
   ```

3. **위계 시각적 표현 개선**:
   - `level > 0`인 경우 부모와 연결하는 세로선/들여쓰기 가이드 표시
   - 레벨 배지(`L1`, `L2`) 제거 (들여쓰기로 위계 표현)
   - 하위 레벨 배경색을 미세하게 다르게 처리 (선택 사항)

4. **`expandAll` prop 수용** (TASK 4를 위한 준비):
   ```tsx
   interface OrgTreeNodeProps {
     node: OrgTreeNode;
     level: number;
     selectedNode: OrgTreeNode | null;
     onNodeClick: (node: OrgTreeNode) => void;
     expandAll?: boolean; // undefined: 개별 제어, true: 전체 펼침, false: 전체 접기
   }
   ```
   - `expandAll` prop이 변경될 때 `useEffect`로 `isExpanded` 동기화
   - `hasChildren` 있는 노드만 영향 받음

**완료 조건**
- 인라인 스타일 완전 제거 (ESLint/코드 검토로 확인)
- +/- 버튼 정상 동작
- 위계 시각적으로 명확히 구분
- `expandAll` prop 정상 동작

---

### TASK 4: [Frontend] OrgTreeView 모두 펼치기/접기 기능 추가

**목적**: 트리 전체를 한 번에 펼치거나 접는 기능 구현

**작업 파일**
- `client/src/domains/hr/components/OrgTreeView.tsx`

**세부 작업**

1. `OrgTreeView` props에 `expandAll` 추가:
   ```tsx
   interface OrgTreeViewProps {
     nodes: OrgTreeNode[];
     selectedNode: OrgTreeNode | null;
     onNodeClick: (node: OrgTreeNode) => void;
     expandAll?: boolean; // OrgChartPage에서 제어
   }
   ```

2. `expandAll` prop을 각 `OrgTreeNodeComponent`에 전달

**완료 조건**
- `expandAll=true` 전달 시 모든 노드 펼쳐짐
- `expandAll=false` 전달 시 모든 노드 접힘
- 개별 노드 토글 후에는 외부 제어와 독립적으로 동작

---

### TASK 5: [Frontend] OrgChartPage 단일 화면 전면 리팩토링

**목적**: 단일 화면(좌: 조직도 관리 / 우: 상세정보)으로 전면 개편

**작업 파일**
- `client/src/domains/hr/pages/OrgChartPage.tsx`

**세부 작업**

1. **레이아웃 재구성**:
   ```tsx
   // ❌ 현재: grid-cols-3 (트리 2칸 + 패널 1칸)
   // ✅ 변경: grid-cols-2 (트리 1칸 + 상세 1칸) 또는 flex 50/50
   ```

2. **Store에서 필요한 상태/액션 구독**:
   ```tsx
   const {
     orgTree, loading, error, fetchOrgTree,
     selectedDepartment, fetchDepartmentById,
     departmentEmployees, departmentEmployeesTotal,
     fetchDepartmentEmployees,
     loading: { department: loadingDept, departmentEmployees: loadingEmps },
   } = useHRStore();
   ```

3. **부서 클릭 핸들러 변경**:
   ```tsx
   const handleNodeClick = async (node: OrgTreeNode) => {
     setSelectedNode(node);
     // 동시 호출
     await Promise.all([
       fetchDepartmentById(node.dept_code),
       fetchDepartmentEmployees(node.dept_code),
     ]);
   };
   ```

4. **모두 펼치기/접기 상태 추가**:
   ```tsx
   const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
   // "모두 펼치기" → setExpandAll(true)
   // "모두 접기"   → setExpandAll(false)
   // 개별 토글 후  → setExpandAll(undefined) (노드에서 자체 관리)
   ```

5. **좌측 패널 - 트리 헤더**:
   - 헤더: "조직도 관리" 제목
   - 버튼: "모두 펼치기" / "모두 접기" (Secondary Button 스타일)
   - `OrgTreeView`에 `expandAll` prop 전달

6. **우측 패널 - 상세정보**:
   - 부서 미선택 상태: EmptyState 표시 ("부서를 선택하면 상세 정보를 확인할 수 있습니다")
   - 로딩 상태: Spinner
   - 부서 선택 상태:
     - 상단: `DepartmentInfoCard` (부서코드, 부서명, 상위부서명, 부서장, 사용여부)
     - 하단: `DepartmentEmployeeList` (사번, 성명, 직책명, 재직여부)
   - "부서 상세보기" 버튼 및 `navigate()` 코드 **완전 제거**

7. **`useNavigate` 및 관련 import 제거** (`navigate` 미사용)

**완료 조건**
- 단일 화면에서 조직도 조회 + 상세 정보 + 소속 구성원 확인 가능
- 페이지 이동 없음
- 모두 펼치기/접기 버튼 정상 동작
- 선택된 부서 포인트 컬러(`#4950DC`) 강조

---

### TASK 6: [Frontend] DepartmentEmployeeList position_name 표시 수정

**목적**: 직책 열에 코드(`P001`) 대신 이름(`팀장`)을 표시

**작업 파일**
- `client/src/domains/hr/components/DepartmentEmployeeList.tsx`

**세부 작업**

```tsx
// ❌ 현재
<td className="px-6 py-4 text-sm text-gray-600">
  {employee.position_code}
</td>

// ✅ 변경 후
<td className="px-6 py-4 text-sm text-gray-600">
  {employee.position_name ?? employee.position_code}
</td>
```

**완료 조건**
- 직책 열에 `position_name` 우선 표시, 없으면 `position_code` fallback

---

## 7. 작업 순서 및 의존 관계

```
TASK 1 (Backend: API 확장)
  ↓
TASK 2 (Frontend: 타입 + API 함수 정비)
  ↓
TASK 3 (Frontend: OrgTreeNode 개선)
  ↓
TASK 4 (Frontend: OrgTreeView + 펼치기/접기)
  ↓
TASK 5 (Frontend: OrgChartPage 리팩토링)  ─── TASK 6 (Frontend: position_name, 독립 진행 가능)
```

- **TASK 1 → TASK 2**: 백엔드 스키마 확장 후 프론트엔드 타입 맞춤
- **TASK 2 → TASK 5**: API 함수 변경 후 페이지 로직 연결
- **TASK 3 → TASK 4 → TASK 5**: 컴포넌트 레벨에서 위로 올라가는 순서
- **TASK 6**: 독립적으로 진행 가능 (TASK 5와 병렬 또는 이후)

---

## 8. 체크리스트 (전체 완료 기준)

- [ ] `GET /v1/hr/departments/{dept_code}/info` 응답에 `upper_dept_name` 포함
- [ ] OrgTreeNode에 인라인 스타일 없음 (Tailwind CSS만 사용)
- [ ] 트리 토글 버튼이 `+` / `-` 로 표시
- [ ] 모두 펼치기 / 모두 접기 버튼 정상 동작
- [ ] 조직도에서 부서 클릭 시 우측 패널에 상세 정보 표시 (페이지 이동 없음)
- [ ] 우측 상세 패널에 부서코드, 부서명, 상위부서명, 부서장, 사용여부 표시
- [ ] 우측 하단에 소속 구성원 표 (사번, 성명, 직책명, 재직여부) 표시
- [ ] 직책 열에 `position_name` 표시
- [ ] `useNavigate` / `navigate()` 코드 OrgChartPage에서 제거
- [ ] ESLint, TypeScript 빌드 에러 없음
