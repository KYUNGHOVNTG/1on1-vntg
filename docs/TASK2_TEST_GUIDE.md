# TASK 2 테스트 가이드

TASK 2에서 구현한 직원 관리 기능을 테스트하는 가이드입니다.

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [Backend API 테스트](#backend-api-테스트)
3. [Frontend 기능 테스트](#frontend-기능-테스트)
4. [통합 테스트 시나리오](#통합-테스트-시나리오)
5. [문제 해결](#문제-해결)

---

## 🔧 사전 준비

### 1. 데이터베이스 마이그레이션 실행

```bash
# Alembic 마이그레이션 실행 (HR 테이블 생성)
python -m alembic upgrade head
```

**예상 결과**:
- ✅ `cm_department` 테이블 생성
- ✅ `hr_mgnt` 테이블 생성
- ✅ `hr_mgnt_concur` 테이블 생성
- ✅ `cm_department_tree` 테이블 생성

### 2. Mock 데이터 확인

Mock 데이터 파일 위치:
```
server/app/domain/hr/repositories/mock/
├── user_mock.json                    # 사용자 20명
├── employee_mock.json                # 직원 20명
├── concurrent_position_mock.json     # 겸직 정보 (5명)
├── department_mock.json              # 부서 15개
└── org_tree_mock.json                # 조직도 (2026년)
```

### 3. Backend 서버 실행

```bash
# 프로젝트 루트에서
uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000
```

**확인**:
- 서버가 `http://localhost:8000`에서 실행 중
- Swagger 문서 접근 가능: `http://localhost:8000/docs`

### 4. Frontend 개발 서버 실행

```bash
cd client
npm run dev
```

**확인**:
- 개발 서버가 `http://localhost:5173`에서 실행 중

---

## 🧪 Backend API 테스트

### Swagger UI로 테스트하기

1. **Swagger 문서 열기**
   ```
   http://localhost:8000/docs
   ```

2. **HR API 섹션 찾기**
   - 왼쪽 사이드바에서 `hr` 태그 클릭

### 테스트 케이스

#### 1. 직원 목록 조회 (`GET /api/v1/hr/employees`)

**기본 조회**:
```bash
curl -X GET "http://localhost:8000/api/v1/hr/employees?page=1&size=20"
```

**예상 응답**:
```json
{
  "items": [
    {
      "emp_no": "EMP001",
      "user_id": "user001",
      "name_kor": "김철수",
      "dept_code": "DEPT001",
      "position_code": "POS001",
      "on_work_yn": "Y"
    },
    ...
  ],
  "total": 20,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

**검색 테스트**:
```bash
# 이름으로 검색
curl -X GET "http://localhost:8000/api/v1/hr/employees?search=김철수"

# 재직자만 조회
curl -X GET "http://localhost:8000/api/v1/hr/employees?on_work_yn=Y"

# 퇴직자만 조회
curl -X GET "http://localhost:8000/api/v1/hr/employees?on_work_yn=N"

# 부서별 조회
curl -X GET "http://localhost:8000/api/v1/hr/employees?dept_code=DEPT001"
```

#### 2. 직원 상세 조회 (`GET /api/v1/hr/employees/{emp_no}`)

```bash
curl -X GET "http://localhost:8000/api/v1/hr/employees/EMP001"
```

**예상 응답**:
```json
{
  "emp_no": "EMP001",
  "user_id": "user001",
  "name_kor": "김철수",
  "dept_code": "DEPT001",
  "position_code": "POS001",
  "on_work_yn": "Y"
}
```

**404 테스트**:
```bash
# 존재하지 않는 사번
curl -X GET "http://localhost:8000/api/v1/hr/employees/INVALID"
```

#### 3. 겸직 정보 조회 (`GET /api/v1/hr/employees/{emp_no}/concurrent-positions`)

```bash
# 겸직자 조회 (EMP004: 인사팀장 + 채용파트 겸직)
curl -X GET "http://localhost:8000/api/v1/hr/employees/EMP004/concurrent-positions"
```

**예상 응답**:
```json
[
  {
    "emp_no": "EMP004",
    "dept_code": "DEPT011",
    "is_main": "Y",
    "position_code": "POS002"
  },
  {
    "emp_no": "EMP004",
    "dept_code": "DEPT111",
    "is_main": "N",
    "position_code": "POS003"
  }
]
```

#### 4. 부서 목록 조회 (`GET /api/v1/hr/departments`)

```bash
# 전체 부서 조회
curl -X GET "http://localhost:8000/api/v1/hr/departments"

# 최상위 부서만 조회
curl -X GET "http://localhost:8000/api/v1/hr/departments?upper_dept_code="

# 특정 부서의 하위 부서 조회
curl -X GET "http://localhost:8000/api/v1/hr/departments?upper_dept_code=DEPT001"
```

#### 5. 부서 상세 조회 (`GET /api/v1/hr/departments/{dept_code}`)

```bash
curl -X GET "http://localhost:8000/api/v1/hr/departments/DEPT001"
```

**예상 응답**:
```json
{
  "dept_code": "DEPT001",
  "dept_name": "경영본부",
  "upper_dept_code": null,
  "dept_head_emp_no": "EMP001",
  "use_yn": "Y"
}
```

---

## 🎨 Frontend 기능 테스트

### 1. 직원 목록 페이지 접근

1. 브라우저에서 `http://localhost:5173` 접속
2. 로그인 (필요 시)
3. URL 직접 입력: `http://localhost:5173/hr/employees`

**확인 사항**:
- ✅ 페이지가 정상적으로 로드됨
- ✅ 헤더에 "직원 관리" 제목 표시
- ✅ 검색/필터 영역 표시
- ✅ 직원 목록 테이블 표시
- ✅ "20명" 총 인원 표시

### 2. 검색 기능 테스트

**이름 검색**:
1. 검색 입력란에 "김철수" 입력
2. "검색" 버튼 클릭

**예상 결과**:
- ✅ 검색 결과가 필터링되어 표시
- ✅ 총 인원 수가 업데이트됨

**사번 검색**:
1. 검색 입력란에 "EMP001" 입력
2. "검색" 버튼 클릭

### 3. 필터 기능 테스트

**재직 여부 필터**:
1. "재직 여부" 드롭다운에서 "퇴직" 선택
2. 자동으로 목록이 필터링됨

**예상 결과**:
- ✅ 퇴직자 3명만 표시 (EMP018, EMP019, EMP020)
- ✅ 재직 여부 배지가 "퇴직"으로 표시

**초기화 기능**:
1. "초기화" 버튼 클릭

**예상 결과**:
- ✅ 모든 필터가 초기값으로 리셋
- ✅ 전체 직원 목록 표시

### 4. 직원 상세 모달 테스트

**모달 열기**:
1. 직원 목록에서 임의의 행 클릭 (예: "김철수")

**예상 결과**:
- ✅ 모달이 화면 중앙에 표시
- ✅ 모달 헤더에 "직원 상세 정보" 제목
- ✅ 기본 정보 섹션 표시 (사번, 성명, 사용자 ID, 부서, 직책, 재직 여부)

**겸직 정보 확인**:
1. 겸직자 클릭 (예: "정지훈" - EMP004)

**예상 결과**:
- ✅ "겸직 정보" 섹션 표시
- ✅ 주소속 부서에 "주소속" 배지 표시
- ✅ 겸직 부서 정보 표시

**모달 닫기**:
1. "닫기" 버튼 클릭 또는 배경 클릭

**예상 결과**:
- ✅ 모달이 닫힘
- ✅ 직원 목록 페이지로 돌아감

### 5. 페이징 테스트

**다음 페이지**:
1. 목록 하단의 "다음" 버튼 클릭

**예상 결과**:
- ✅ 페이지 번호가 2로 변경
- ✅ 다음 20개 항목 표시

**특정 페이지**:
1. 페이지 번호 버튼 (1, 2, 3...) 클릭

**예상 결과**:
- ✅ 선택한 페이지로 이동
- ✅ 현재 페이지 버튼 강조 표시 (파란색 배경)

---

## 🔄 통합 테스트 시나리오

### 시나리오 1: 신규 직원 조회

1. **Backend**: 직원 목록 API 호출
2. **Frontend**: 목록 페이지에서 조회
3. **검증**: 20명 전원 표시 확인

### 시나리오 2: 겸직자 확인

1. **Backend**: EMP004 겸직 정보 API 호출
2. **Frontend**: "정지훈" 행 클릭
3. **검증**:
   - 기본 정보: DEPT011 (인사팀)
   - 겸직 정보: DEPT011 (주소속) + DEPT111 (겸직)

### 시나리오 3: 퇴직자 필터링

1. **Frontend**: 재직 여부 "퇴직" 선택
2. **Backend**: `on_work_yn=N` 파라미터로 API 호출
3. **검증**: 3명만 표시 (EMP018, EMP019, EMP020)

### 시나리오 4: 검색 → 상세 조회

1. **Frontend**: 검색란에 "강동원" 입력
2. **Backend**: `search=강동원` 파라미터로 API 호출
3. **Frontend**: 검색 결과 클릭
4. **Backend**: EMP006 상세 API 호출
5. **검증**:
   - 성명: 강동원
   - 부서: DEPT021 (개발1팀)
   - 겸직: DEPT211 (프론트엔드파트)

---

## 🐛 문제 해결

### Backend 문제

**증상**: API 호출 시 500 에러
- **원인**: 마이그레이션 미실행
- **해결**: `alembic upgrade head` 실행

**증상**: 직원 목록이 비어있음
- **원인**: Mock 데이터 미로드
- **해결**: `EmployeeMockRepository` 대신 `EmployeeDBRepository` 사용 중인지 확인

**증상**: CORS 에러
- **원인**: Frontend와 Backend 도메인 불일치
- **해결**: `server/app/core/config.py`에서 `ALLOWED_ORIGINS` 확인

### Frontend 문제

**증상**: 페이지가 404
- **원인**: 라우터 미등록
- **해결**: `App.tsx`에서 Route 추가 확인

**증상**: API 호출 실패 (Network Error)
- **원인**: Backend 서버 미실행
- **해결**: `http://localhost:8000` 접속 확인

**증상**: 모달이 열리지 않음
- **원인**: 상태 관리 오류
- **해결**: 브라우저 콘솔 에러 확인

---

## ✅ 테스트 체크리스트

### Backend API
- [ ] 직원 목록 조회 (기본)
- [ ] 직원 목록 조회 (검색)
- [ ] 직원 목록 조회 (필터: 재직/퇴직)
- [ ] 직원 목록 조회 (필터: 부서)
- [ ] 직원 목록 조회 (페이징)
- [ ] 직원 상세 조회
- [ ] 직원 상세 조회 (404 에러)
- [ ] 겸직 정보 조회
- [ ] 부서 목록 조회
- [ ] 부서 상세 조회

### Frontend UI
- [ ] 직원 목록 페이지 로드
- [ ] 검색 기능 (이름)
- [ ] 검색 기능 (사번)
- [ ] 필터 기능 (재직 여부)
- [ ] 필터 기능 (부서)
- [ ] 초기화 버튼
- [ ] 직원 상세 모달 열기
- [ ] 직원 상세 모달 닫기
- [ ] 겸직 정보 표시
- [ ] 페이징 (다음/이전)
- [ ] 페이징 (특정 페이지)

### 통합 테스트
- [ ] 신규 직원 조회 시나리오
- [ ] 겸직자 확인 시나리오
- [ ] 퇴직자 필터링 시나리오
- [ ] 검색 → 상세 조회 시나리오

---

## 📚 추가 리소스

- **Swagger 문서**: `http://localhost:8000/docs`
- **Backend 로그**: 콘솔 출력 확인
- **Frontend 개발자 도구**: 브라우저 F12
- **Network 탭**: API 호출 내역 확인

---

**테스트 완료 후 다음 단계**: TASK 3 진행 🚀
