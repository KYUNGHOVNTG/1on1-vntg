# 신인사평가 시스템 — 1시간 완전 정복 가이드

> 대상: 경영진/조직장 설득 + 기술조직(CTO/개발실) 질문 대응
> 배경: Spring + JSP + MyBatis + Oracle 경험자 기준으로 작성

---

## 목차

1. [전체 구조 한눈에 보기](#1-전체-구조-한눈에-보기)
2. [스프링 경험자를 위한 기술스택 비교](#2-스프링-경험자를-위한-기술스택-비교)
3. [이미 완성된 것들 (= 안 만들어도 되는 것들)](#3-이미-완성된-것들)
4. [핵심 강점 — 왜 이 템플릿인가](#4-핵심-강점)
5. [1인 단기 개발이 가능한 진짜 이유](#5-1인-단기-개발이-가능한-진짜-이유)
6. [기술조직 태클 Q&A](#6-기술조직-태클-qa)
7. [신인사평가 구현 로드맵](#7-신인사평가-구현-로드맵)

---

## 1. 전체 구조 한눈에 보기

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     브라우저 (사용자)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│            Frontend  (React 19 + TypeScript)                  │
│                                                               │
│  core/                        domains/                        │
│  ├── api/client.ts            ├── auth/      (로그인)         │
│  ├── layout/                  ├── hr/        (직원/조직도)    │
│  │   ├── Header               ├── menu/      (메뉴관리)       │
│  │   ├── Sidebar              ├── permission/(권한관리)       │
│  │   └── MainLayout          ├── common/    (공통코드)       │
│  ├── store/ (전역상태)        ├── dashboard/ (대시보드)       │
│  └── ui/   (공통컴포넌트)     └── [평가도메인 여기에 추가]    │
│      Button, Input, Modal,                                    │
│      Toast, Badge, Card...                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (JSON)
┌───────────────────────▼─────────────────────────────────────┐
│            Backend  (FastAPI + Python 3.12)                   │
│                                                               │
│  core/               domain/                                  │
│  ├── database.py     ├── auth/     (JWT 인증)                │
│  ├── security.py     ├── hr/       (직원/부서/동기화)        │
│  ├── middleware.py   ├── menu/     (메뉴권한)                │
│  ├── scheduler.py    ├── permission/(권한)                   │
│  └── dependencies.py ├── common/  (공통코드)                 │
│                       └── [평가도메인 여기에 추가]           │
│                                                               │
│  각 도메인 구조:                                              │
│  domain/{name}/                                               │
│  ├── router.py    ← HTTP 요청 처리                           │
│  ├── service.py   ← 비즈니스 흐름 제어                       │
│  ├── models/      ← DB 테이블 정의                           │
│  ├── schemas/     ← 요청/응답 DTO                            │
│  └── repositories/← DB 조회 전담                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ SQL (비동기)
┌───────────────────────▼─────────────────────────────────────┐
│              PostgreSQL (Supabase 인프라)                     │
│                                                               │
│  핵심 테이블:                                                 │
│  cm_user           사용자                                     │
│  cm_menu           메뉴 (3depth)                             │
│  cm_position_menu  직책별 메뉴 권한                          │
│  cm_codemaster     공통코드 유형                             │
│  cm_codedetail     공통코드 값                               │
│  cm_department     부서                                       │
│  cm_department_tree 조직도                                   │
│  hr_mgnt           직원 인사정보                             │
│  hr_mgnt_concur    겸직 정보                                 │
│  hr_sync_history   동기화 이력                               │
│  auth_refresh_token JWT Refresh Token                        │
└─────────────────────────────────────────────────────────────┘
```

### 폴더 구조 요약

```
1on1-vntg/
├── server/                  ← 백엔드 (FastAPI)
│   └── app/
│       ├── core/            공통 인프라 (DB연결, JWT, 미들웨어)
│       ├── domain/          도메인별 비즈니스 로직
│       ├── shared/          공통 베이스 클래스 (BaseRepository 등)
│       └── examples/        새 도메인 추가용 템플릿 (복사해서 사용)
│
├── client/                  ← 프론트엔드 (React 19)
│   └── src/
│       ├── core/            공통 인프라 (API클라이언트, 레이아웃, UI컴포넌트)
│       └── domains/         도메인별 화면 및 상태
│
├── alembic/                 ← DB 마이그레이션 버전 관리
├── migration/               ← 초기 데이터 SQL
└── docs/                    ← 개발 문서
```

---

## 2. 스프링 경험자를 위한 기술스택 비교

| 역할 | Spring + Oracle (구) | 이 프로젝트 (신) | 핵심 차이점 |
|------|---------------------|-----------------|------------|
| **웹 프레임워크** | Spring Boot | FastAPI | Python, 비동기, 자동 Swagger |
| **화면** | JSP/Thymeleaf | React 19 + TypeScript | SPA, 타입 안전, 컴포넌트 |
| **DB** | Oracle | PostgreSQL | 오픈소스, 클라우드 |
| **ORM/쿼리** | MyBatis (XML mapper) | SQLAlchemy 2.0 | Python 코드로 쿼리, ORM |
| **DTO/검증** | @Valid, BindingResult | Pydantic v2 | 자동 검증, JSON 직렬화 |
| **DB 버전관리** | Liquibase / 직접 SQL | Alembic | Python으로 마이그레이션 |
| **인증** | Spring Security | JWT 직접 구현 | Access 15분 + Refresh 7일 |
| **DI (의존성주입)** | @Autowired | 생성자 주입 | Python 스타일 |
| **Controller** | @RestController | @router.get/post | FastAPI 데코레이터 |
| **Service** | @Service | class Service | 동일한 역할 |
| **Repository/DAO** | @Repository + Mapper XML | Repository 클래스 | Python 코드로 쿼리 |
| **전역 상태** | 세션/Redux 없음 | Zustand | 프론트 전역 상태 관리 |
| **스타일** | CSS/Bootstrap | Tailwind CSS 4 | 유틸리티 클래스 |
| **API 문서** | Swagger 별도 설정 | 자동 생성 (/docs) | FastAPI 내장 |
| **비동기** | @Async 옵션 | 전체 async/await | 기본이 비동기 |

### Spring → FastAPI 코드 비교

**Controller → Router**
```python
# Spring
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    @GetMapping("/{empNo}")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable String empNo) { ... }
}

# FastAPI (이 프로젝트)
@router.get("/employees/{emp_no}", response_model=EmployeeDetailResponse)
async def get_employee(emp_no: str, db: AsyncSession = Depends(get_db)):
    service = EmployeeService(db)
    return await service.get_employee_detail(emp_no)
```

**MyBatis XML → SQLAlchemy**
```python
# MyBatis (구)
# <select id="findByEmpNo" resultType="Employee">
#   SELECT * FROM hr_mgnt WHERE emp_no = #{empNo}
# </select>

# SQLAlchemy (이 프로젝트)
result = await db.execute(
    select(HRMgnt).where(HRMgnt.emp_no == emp_no)
)
employee = result.scalar_one_or_none()
```

**@Entity → SQLAlchemy Model**
```python
# JPA Entity (구)
# @Entity @Table(name="hr_mgnt")
# public class Employee { @Id String empNo; ... }

# SQLAlchemy Model (이 프로젝트)
class HRMgnt(Base):
    __tablename__ = "hr_mgnt"
    emp_no: Mapped[str] = mapped_column(String(20), primary_key=True)
    name_kor: Mapped[str] = mapped_column(String(100))
    dept_code: Mapped[Optional[str]] = mapped_column(String(20))
```

---

## 3. 이미 완성된 것들

> "처음부터 만드는 게 아닙니다" — 이게 단기 개발의 핵심

### ✅ 인프라 (건드릴 필요 없음)

| 항목 | 상태 | 설명 |
|------|------|------|
| JWT 인증 | 완성 | Access Token 15분, Refresh Token 7일, Idle Timeout 15분 |
| Google OAuth | 완성 | 소셜 로그인 |
| 레이아웃 | 완성 | Header(사용자정보/알림) + Sidebar(메뉴) + 본문 |
| 메뉴 시스템 | 완성 | 3depth 계층 메뉴, DB 기반 동적 구성 |
| 직책별 메뉴 권한 | 완성 | 어드민에서 직책별 메뉴 ON/OFF |
| 공통코드 관리 | 완성 | code_type / code_value 구조, 어드민 UI |
| 에러 처리 | 완성 | 전역 에러 바운더리, API 에러 자동 핸들링 |
| 로딩 처리 | 완성 | 전역 LoadingOverlay |

### ✅ HR 마스터 데이터 연동 (완성)

| 항목 | 상태 | 설명 |
|------|------|------|
| 직원 목록/상세 | 완성 | 검색, 필터, 페이징 |
| 부서 목록/상세 | 완성 | 상위부서, 부서장, 인원수 |
| 조직도 트리 | 완성 | 계층형 트리 시각화 |
| 겸직 관리 | 완성 | 직원 겸직 정보 다중 소속 |
| HR 동기화 API | 완성 | 외부 인사시스템(오라클)에서 데이터 수신, Bulk Insert/Update |
| 동기화 이력 | 완성 | 동기화 결과 이력 조회 |

### ✅ 공통 UI 컴포넌트 라이브러리 (완성)

```
이미 만들어진 컴포넌트들 (재사용만 하면 됨):

Button       버튼 (Primary/Secondary/Danger)
Input        텍스트 입력
Textarea     여러줄 입력
Select       드롭다운
Checkbox     체크박스
Toggle       토글 스위치
Modal        다이얼로그 / ConfirmModal
Toast        성공/실패 알림 (우측 하단)
Snackbar     취소 가능한 알림
Banner       상단 전역 공지
Badge        상태 뱃지
Card         카드 레이아웃
Avatar       프로필 이미지
EmptyState   데이터 없음 화면
ProgressBar  진행 표시
NotificationCenter  알림 센터
InlineMessage 폼 인라인 오류 메시지
```

### ✅ 새 도메인 추가용 템플릿 (완성)

`server/app/examples/sample_domain/` — 복사해서 바로 시작
`client/src/domains/sample/` — 복사해서 바로 시작

---

## 4. 핵심 강점

### 강점 1: AI(Claude) 협업에 최적화된 구조

코드 구조가 **명확하고 패턴화**되어 있어서 AI에게 "평가 도메인 추가해줘"라고 하면:
- 어떤 파일을 어디에 만들어야 하는지 명확
- 기존 패턴(HR 도메인)을 그대로 따라 생성
- 설계 고민 없이 구현에 집중

```
"hr 도메인 참고해서 evaluation 도메인(평가계획, 평가항목, 평가결과) 추가해줘"
→ AI가 router.py, service.py, models/, schemas/, repositories/ 전부 생성
```

### 강점 2: 자동 API 문서 (Swagger)

FastAPI는 코드를 작성하면 **자동으로 Swagger UI** 생성.
→ `http://localhost:8000/docs` 접속하면 모든 API를 바로 테스트 가능
→ 프론트-백 협의 문서 별도 작성 불필요

### 강점 3: 타입 안전성 이중 보호

```
프론트엔드: TypeScript → 컴파일 타임에 타입 오류 잡음
백엔드: Pydantic v2 → 런타임에 요청/응답 자동 검증
```
→ 잘못된 데이터가 들어와도 자동으로 400 에러 반환, 오류 메시지 자동 생성

### 강점 4: 비동기(Async) 기반 고성능

```python
# 모든 DB 조회가 비동기 (await)
employees, total = await self.employee_repo.find_all(...)
```
→ DB 쿼리 대기 중에도 다른 요청 처리 가능
→ Spring의 Thread-per-Request 대비 적은 서버 자원으로 더 많은 동시 사용자 처리

### 강점 5: DB 마이그레이션 자동화 (Alembic)

```bash
# 모델(코드) 수정하면 마이그레이션 자동 생성
alembic revision --autogenerate -m "평가결과 테이블 추가"
alembic upgrade head
```
→ MyBatis처럼 SQL 직접 관리 불필요
→ Git으로 DB 변경 이력 추적 가능

### 강점 6: 이미 구현된 외부 시스템 연동

기존 **오라클 인사시스템** → 이 시스템으로 데이터 동기화 API **완성**:
```
POST /api/v1/hr/sync/employees    ← 직원 데이터 Bulk 수신
POST /api/v1/hr/sync/departments  ← 부서 데이터 Bulk 수신
GET  /api/v1/hr/sync/history      ← 동기화 이력 확인
```

---

## 5. 1인 단기 개발이 가능한 진짜 이유

### 이유 1: 기반 인프라가 이미 완성

개발 시간의 30-40%를 차지하는 **공통 기능이 전부 구현 완료**:

| 구분 | 일반 신규 개발 | 이 템플릿 |
|------|--------------|---------|
| 인증/인가 | 처음부터 구현 | ✅ 완성 |
| 레이아웃/메뉴 | 처음부터 구현 | ✅ 완성 |
| 권한 관리 | 처음부터 구현 | ✅ 완성 |
| 공통코드 | 처음부터 구현 | ✅ 완성 |
| HR 마스터 연동 | 처음부터 구현 | ✅ 완성 |
| UI 컴포넌트 | Bootstrap 커스텀 | ✅ 20개+ 완성 |
| DB 마이그레이션 | 직접 SQL 관리 | ✅ Alembic 자동화 |
| 오류 처리 | 처음부터 구현 | ✅ 완성 |

**남은 작업 = 평가 비즈니스 로직만**

### 이유 2: AI 바이브코딩 — "틀"이 있어서 AI가 정확하게 작동

바이브코딩이 실패하는 이유는 **AI가 구조를 모르기 때문**.
이 프로젝트는 패턴이 명확하고 AI(Claude)가 전체 구조를 학습한 상태로 협업:

```
개발자: "평가계획(EvaluationPlan) 도메인 추가해줘.
         - 평가 연도, 평가명, 시작일, 종료일, 상태(준비/진행중/완료)
         - 목록 조회(페이징), 상세 조회, 생성, 수정 기능"

AI: hr 도메인 패턴 참고해서 즉시 생성
    ✅ server/app/domain/evaluation/models/plan.py
    ✅ server/app/domain/evaluation/schemas/plan.py
    ✅ server/app/domain/evaluation/repositories/plan_db_repository.py
    ✅ server/app/domain/evaluation/service.py
    ✅ server/app/domain/evaluation/router.py
    ✅ client/src/domains/evaluation/types.ts
    ✅ client/src/domains/evaluation/api.ts
    ✅ client/src/domains/evaluation/store.ts
    ✅ client/src/domains/evaluation/pages/EvaluationPlanPage.tsx
```

### 이유 3: 표준화된 개발 패턴 = 의사결정 시간 제거

"이거 어떻게 짜야 하지?" 고민 없음. 정답이 이미 있음:

```
새 기능 추가 순서 (매번 동일):
1. models/ → DB 테이블 정의
2. alembic revision → 마이그레이션 생성
3. schemas/ → 요청/응답 DTO
4. repositories/ → DB 조회 로직
5. service.py → 흐름 제어
6. router.py → API 엔드포인트
7. client types.ts → 프론트 타입
8. client api.ts → API 호출 함수
9. client store.ts → 상태 관리
10. client pages/ → 화면 컴포넌트
```

### 이유 4: 실시간 API 문서로 프론트-백 병렬 작업

백엔드 완성 즉시 Swagger에서 확인 가능:
```
http://localhost:8000/docs → 모든 API 자동 문서화
```
→ 별도 API 문서 작성 시간 제로
→ 프론트와 협의 없이 즉시 연동 가능

### 이유 5: Supabase로 DB 인프라 운영 부담 제거

PostgreSQL 서버 세팅, 백업, 모니터링을 Supabase가 담당.
개발에만 집중 가능.

---

## 6. 기술조직 태클 Q&A

### Q1: "FastAPI가 검증된 프레임워크야? 들어본 적 없는데"

**A:** 글로벌 검증 완료.
- **Netflix, Uber, Microsoft, Expedia** 등 채택
- Python 웹 프레임워크 중 **GitHub Star 1위** (Django, Flask 추월)
- TechEmpower 벤치마크에서 **Spring Boot 대비 2-3배 높은 처리량**
- 한국: 카카오, 네이버, 라인 등 대형 IT 기업 채택 사례 다수
- FastAPI 공식 문서: https://fastapi.tiangolo.com

### Q2: "타입 안전성은? Python이라 동적 타입이잖아"

**A:** 이중 타입 보호.
```
1. 백엔드 Pydantic v2:
   - 요청 데이터가 들어오면 자동 검증
   - 잘못된 타입이면 즉시 400 에러 + 명확한 에러 메시지
   - 응답 DTO도 정의된 타입만 반환 가능

2. 프론트엔드 TypeScript:
   - 컴파일 타임에 타입 오류 잡음
   - IDE에서 자동완성, 타입 체크
   - any 타입 사용 금지 (프로젝트 규칙)

3. mypy (백엔드 정적 분석):
   - CI에서 Python 타입 오류 사전 검출
```

### Q3: "보안은 어떻게 되어 있어?"

**A:** 다층 보안 구현.

| 위협 | 대응 방법 |
|------|---------|
| 비인가 접근 | JWT Access Token (15분 만료) |
| 토큰 탈취 | Refresh Token Rotation (1회용) |
| 세션 방치 | Idle Timeout 15분 자동 만료 |
| SQL Injection | SQLAlchemy ORM (파라미터 바인딩) |
| 비밀번호 노출 | bcrypt 해싱 (saltround 적용) |
| XSS | React 기본 이스케이프 + 응답에 비밀번호 필드 없음 |
| CSRF | JWT 기반 (쿠키 미사용) |
| CORS | 허용 도메인 화이트리스트 설정 |
| IP 추적 | 로그인 IP/디바이스 정보 기록 |

### Q4: "기존 오라클 인사시스템이랑 어떻게 연동해?"

**A:** HR 동기화 API가 이미 완성.

```
[기존 오라클 인사시스템]
        │
        │ API 호출 (또는 배치)
        ▼
POST /api/v1/hr/sync/employees     ← 직원 데이터 전송
POST /api/v1/hr/sync/departments   ← 부서 데이터 전송
        │
        ▼
[이 시스템 PostgreSQL에 Upsert]
        │
        ▼
[평가 시스템에서 직원/부서 데이터 활용]
```

동기화 방식: **Push 방식** (오라클에서 이 시스템으로 데이터 전송)
스케줄러: APScheduler 내장 (주기적 자동 동기화 설정 가능)
이력 관리: 동기화 결과 자동 기록 (성공/실패 건수, 에러 메시지)

### Q5: "1인 개발이면 유지보수가 걱정된다. 나중에 다른 개발자가 이해할 수 있어?"

**A:** 명확한 아키텍처로 온보딩 용이.

```
1. 레이어드 아키텍처: Router → Service → Repository
   → 어느 파일에 뭐가 있는지 예측 가능

2. 도메인 구조: 평가 관련 코드는 전부 domain/evaluation/
   → 기능별로 코드가 모여 있음

3. 타입 정의: 모든 함수에 타입 힌트 필수
   → 코드만 봐도 입출력 구조 파악 가능

4. AI 온보딩: Claude가 이 프로젝트 구조를 학습
   → 새 개발자가 AI와 협업하면 즉시 기여 가능

5. 자동 API 문서: Swagger로 전체 API 구조 파악 즉시
```

### Q6: "스케일아웃(서버 증설) 되어?"

**A:** 무상태(Stateless) 설계로 수평 확장 가능.

```
- JWT: 서버에 세션 저장 안 함 → 어느 서버에서도 검증 가능
- Refresh Token: DB에 저장 (Redis로 전환 가능)
- DB: 비동기 연결 풀 (asyncpg) → 커넥션 효율적 관리
- 확장: Nginx Load Balancer + FastAPI 인스턴스 추가

현실적으로: 인사평가 시스템은 동시 사용자 수백 명 수준
→ 단일 서버로 충분, 필요시 확장 경로 명확
```

### Q7: "PostgreSQL이야, Supabase야? 나중에 Oracle로 바꿀 수 있어?"

**A:** 순수 PostgreSQL로 사용, 이관 가능.

```
Supabase = PostgreSQL 호스팅 서비스
           (AWS가 EC2를 호스팅하는 것과 같은 개념)

사용 기능: PostgreSQL DB 접속만
미사용 기능: Supabase Auth, Storage, Realtime, Edge Functions
             (= 벤더 종속 기능 전혀 없음)

이관 경로:
- 순수 PostgreSQL 서버로 → 설정 파일(.env) DB 주소만 변경
- Oracle로 → SQLAlchemy dialect 변경 + 쿼리 일부 수정
  (프로젝트에 Oracle 전용 문법 없음)
```

### Q8: "테스트는?"

**A:** 백엔드 테스트 프레임워크 구성 완료.

```bash
# 테스트 실행
pytest tests/ -v

# 커버리지 측정
pytest tests/ --cov=server/app --cov-report=html
```

```
테스트 전략:
1. Mock Repository: DB 없이 Service 단위 테스트
   (HR 도메인에 Mock Repository 구현 완성)

2. 통합 테스트: pytest-asyncio로 실제 DB 대상 테스트

3. API 테스트: FastAPI TestClient + httpx
```

### Q9: "개발 일정이 너무 빡빡한 거 아니야? 검증해봤어?"

**A:** 이미 구현된 기능 목록으로 검증.

```
✅ 완성된 것 (추가 개발 0):
   - 인증/인가/세션 관리
   - 메뉴/권한 시스템
   - 조직도/부서/직원 마스터
   - 공통코드 관리
   - 전체 UI 컴포넌트 라이브러리

📌 평가 시스템 핵심 개발 필요:
   - 평가 계획 (Plan)
   - 평가 항목 (Item)
   - 평가 대상자 관리 (Target)
   - 평가 진행 (Evaluation)
   - 결과 집계/리포트 (Result)

   각 도메인 = 기존 HR 도메인 참조해서 AI가 기본 구조 즉시 생성
   → 개발자는 비즈니스 로직 검토/수정에 집중
```

### Q10: "React 19가 최신인데 안정적이야?"

**A:** 안정 버전, 기업 도입 활발.

```
React 19: 2024년 12월 정식 출시 (LTS 아님, 하지만 안정 버전)
- Meta (Facebook), Vercel, Netflix 등 즉시 적용
- React 18 대비: Server Components, Actions 개선
- 이 프로젝트 활용: React 19 SPA (CSR) 방식 → 복잡한 신기능 미사용
  기존 React 18 개발 경험 그대로 적용 가능
```

---

## 7. 신인사평가 구현 로드맵

### 필요한 도메인 구조 (예시)

```
server/app/domain/evaluation/
├── models/
│   ├── plan.py          ← 평가 계획
│   ├── item.py          ← 평가 항목
│   ├── target.py        ← 평가 대상자
│   ├── result.py        ← 평가 결과
│   └── __init__.py
├── schemas/             ← 요청/응답 DTO
├── repositories/        ← DB 조회
├── calculators/         ← 점수 계산 로직
├── service.py           ← 흐름 제어
└── router.py            ← API 엔드포인트

client/src/domains/evaluation/
├── types.ts             ← TypeScript 타입
├── api.ts               ← API 호출 함수
├── store.ts             ← 상태 관리 (Zustand)
├── pages/
│   ├── EvaluationPlanPage.tsx
│   ├── EvaluationItemPage.tsx
│   └── EvaluationResultPage.tsx
└── components/          ← 화면 컴포넌트
```

### 데이터 흐름

```
[오라클 HR 시스템]
    │ 직원/부서 데이터 동기화 (이미 완성)
    ▼
[hr_mgnt 직원 테이블]  ←→  [cm_department 부서 테이블]
    │
    │ 평가 대상자 구성
    ▼
[evaluation_plan 평가 계획]
    │
    ▼
[evaluation_target 평가 대상자]
    │
    ▼
[evaluation_result 평가 결과]
    │
    ▼
[집계/리포트]
```

### 기존 기능 재활용 포인트

| 신규 기능 | 재활용 기반 |
|---------|----------|
| 평가자/피평가자 선택 | HR 직원 API (`/hr/employees`) |
| 부서별 평가 현황 | HR 부서 API (`/hr/departments`) |
| 조직도 기반 평가 경로 | 조직도 API (`/hr/org-tree`) |
| 평가 상태 코드 | 공통코드 API (`/code`) |
| 평가 화면 권한 | 기존 메뉴/권한 시스템 |
| 모든 UI 컴포넌트 | `@/core/ui/*` 재사용 |

---

## 부록: 빠른 참조

### 핵심 명령어

```bash
# 백엔드 시작
uvicorn server.app.main:app --reload --port 8000

# 프론트엔드 시작
cd client && npm run dev

# API 문서
http://localhost:8000/docs

# DB 마이그레이션
alembic upgrade head

# 린트
black server/ --line-length 100
cd client && npm run lint
```

### 핵심 URL

```
/ 또는 /dashboard      대시보드
/hr/employees          직원 목록
/hr/org-chart          조직도
/menu                  메뉴 관리 (어드민)
/permission            권한 관리 (어드민)
/code                  공통코드 관리 (어드민)
/system/components     UI 컴포넌트 쇼케이스
```

### 디자인 색상 (외워두기)

```
Primary (주 색상):    #4950DC  (보라빛 파랑)
Secondary:            #2E81B1  (파랑)
Accent/Success:       #14B287  (초록)
배경:                 흰색 / #F9FAFB (연회색)
텍스트:               #111827 (진회색) / #6B7280 (중간회색)
```

---

*이 문서는 경영진 설득 및 기술조직 대응을 위해 작성되었습니다.*
*프로젝트 상세: `/home/user/1on1-vntg`*
