# 🤖 AI 개발자 체크리스트

> **1on1-vntg 프로젝트에서 AI 에이전트가 코드 작성 시 반드시 확인해야 할 체크리스트**

## 📖 관련 문서

- **[README.md](../README.md)**: 프로젝트 개요 및 빠른 시작
- **[.cursorrules](../.cursorrules)**: 코딩 규칙 전체
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 아키텍처 상세 설명
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: 개발 가이드

---

## 🎯 작업 시작 전 (Pre-Development Checklist)

### 1. 문서 확인

- [ ] `.cursorrules` 파일을 읽고 프로젝트 규칙 이해
- [ ] `README.md`에서 프로젝트 구조 파악
- [ ] 작업 대상 도메인이 `server/app/domain/` 또는 `client/src/domains/`에 존재하는지 확인
- [ ] 유사한 기존 코드를 참고할 수 있는지 탐색

### 2. 요구사항 분석

- [ ] 사용자의 요청을 명확히 이해했는가?
- [ ] 변경 범위가 어디까지인가? (단일 파일 / 도메인 전체 / 전역)
- [ ] 기존 아키텍처를 위반하지 않는가?
- [ ] DB 스키마 변경이 필요한가? → migration SQL 작성 필요

### 3. 영향 범위 평가

- [ ] 다른 도메인에 영향을 주는가?
- [ ] 기존 API 호출 코드가 깨지지 않는가?
- [ ] 타입 변경으로 인한 TypeScript/Pydantic 에러 가능성 확인
- [ ] 아키텍처 변경이 필요한 경우 → **사용자에게 먼저 제안하고 승인 받기**

---

## 💻 코드 작성 중 (During Development Checklist)

### Backend (Python + FastAPI)

#### 파일 생성/수정

- [ ] **도메인 구조 준수**
  - [ ] `server/app/domain/{domain_name}/` 폴더 구조 유지
  - [ ] `models/`, `schemas/`, `repositories/`, `calculators/`, `formatters/`, `service.py` 분리
- [ ] **클래스 기반 설계**
  - [ ] 비즈니스 로직은 반드시 클래스로 작성 (절차지향 함수 금지)
  - [ ] `BaseService`, `BaseRepository`, `BaseCalculator`, `BaseFormatter` 상속
- [ ] **타입 안전성**
  - [ ] 모든 함수/메서드에 타입 힌트 명시 (`def foo(x: int) -> str:`)
  - [ ] Pydantic v2 스키마 사용 (`BaseModel` 상속)
  - [ ] Generic 타입 파라미터 명시 (`BaseService[TRequest, TResponse]`)

#### 계층 분리 확인

- [ ] **Router**: HTTP 요청/응답만 처리, 비즈니스 로직 금지
- [ ] **Service**: Repository/Calculator/Formatter 조율만, DB 직접 접근 금지
- [ ] **Repository**: DB/API/파일 접근, Side Effect 허용
- [ ] **Calculator**: 순수 계산 로직, Side Effect 절대 금지
- [ ] **Formatter**: 내부 데이터 → API 응답 변환

#### DB 작업

- [ ] **Migration SQL 작성** (테이블/컬럼 변경 시)
  - [ ] `/migration/YYYYMMDD_작업명.sql` 파일 생성
  - [ ] 기존 migration 파일 수정 금지 (Append-only)
- [ ] **SQLAlchemy 모델 동기화**
  - [ ] DB 변경 시 `models/` 파일도 함께 수정
- [ ] **비동기 쿼리 사용**
  - [ ] `await db.execute(select(...))` 패턴 사용
  - [ ] `async/await` 누락 없는지 확인

#### 예외 처리

- [ ] **커스텀 예외 사용**
  - [ ] `Exception` 대신 `NotFoundException`, `BusinessLogicException` 등 사용
  - [ ] `from server.app.shared.exceptions import ...`

#### Supabase PostgreSQL

- [ ] **표준 SQL만 사용**
  - [ ] Supabase Auth, Storage, Realtime 절대 사용 금지
  - [ ] `sqlalchemy` 쿼리로 표준 PostgreSQL 작업만 수행

### Frontend (React + TypeScript)

#### 파일 생성/수정

- [ ] **도메인 구조 준수**
  - [ ] `client/src/domains/{domain_name}/` 폴더 구조 유지
  - [ ] `api.ts`, `store.ts`, `types.ts`, `components/`, `pages/` 분리
- [ ] **컴포넌트 분리**
  - [ ] 100줄 이상 컴포넌트는 기능 단위로 분리
  - [ ] UI 로직과 비즈니스 로직 분리
- [ ] **타입 안전성**
  - [ ] `any` 타입 사용 금지 (불가피한 경우 `unknown` + 타입 가드)
  - [ ] Props는 interface로 정의
  - [ ] API 응답 타입 정의 (`types.ts`)

#### Tailwind CSS 사용

- [ ] **인라인 스타일 절대 금지**
  - [ ] `style={{ ... }}` 대신 Tailwind 클래스 사용
- [ ] **디자인 시스템(1on1-Mirror) 준수**
  - [ ] 색상: `#4950DC` (Primary), `#2E81B1` (Secondary), `#14B287` (Accent)
  - [ ] 폰트: 본문 `text-sm`, 테이블 `text-sm` 또는 `text-[13px]`, 보조 `text-xs`
  - [ ] **`text-[10px]` 절대 사용 금지**
  - [ ] Border Radius: 버튼 `rounded-xl`, 카드 `rounded-2xl`
- [ ] **조건부 클래스**
  - [ ] `cn()` 유틸리티 사용

#### API 통신

- [ ] **apiClient 싱글톤 사용**
  - [ ] `axios` 직접 import 금지
  - [ ] `import { apiClient } from '@/core/api/client'`
- [ ] **타입 정의**
  - [ ] API 함수 반환 타입 명시 (`Promise<User[]>`)

#### 상태 관리

- [ ] **Zustand 스토어 사용**
  - [ ] 전역 상태: `core/store/` (Auth, Theme)
  - [ ] 도메인 상태: `domains/{domain}/store.ts`

#### 알림/메시지

- [ ] **브라우저 기본 함수 절대 금지**
  - [ ] `alert()`, `confirm()` 대신 Toast, Modal 사용
- [ ] **상황별 적절한 컴포넌트 선택**
  - [ ] 입력 오류 → `InlineMessage`
  - [ ] 단순 성공 → `toast.success()`
  - [ ] 되돌리기 → `snackbar.show()`
  - [ ] 중요 확인 → `ConfirmModal`
  - [ ] 데이터 없음 → `EmptyState`

---

## ✅ 코드 작성 완료 후 (Post-Development Checklist)

### 1. 코드 품질 검증

#### Backend

- [ ] **타입 체크**
  ```bash
  mypy server/
  ```
- [ ] **린팅**
  ```bash
  ruff check server/
  ```
- [ ] **포맷팅**
  ```bash
  black server/
  isort server/
  ```

#### Frontend

- [ ] **타입 체크**
  ```bash
  cd client && npm run type-check
  ```
- [ ] **린팅**
  ```bash
  cd client && npm run lint
  ```

### 2. 기능 테스트

- [ ] **로컬 실행 확인**
  - [ ] 백엔드: `python -m server.main` 정상 실행
  - [ ] 프론트엔드: `npm run dev` 정상 실행
  - [ ] 브라우저에서 변경 사항 동작 확인
- [ ] **API 문서 확인**
  - [ ] http://localhost:8000/docs 에서 새 API 확인
  - [ ] Request/Response 스키마 검증
- [ ] **에러 케이스 테스트**
  - [ ] 잘못된 입력 시 적절한 에러 메시지 표시
  - [ ] 네트워크 에러 시 처리 확인

### 3. 문서 업데이트 (필요시)

- [ ] **README 업데이트** (주요 기능 추가 시)
- [ ] **ARCHITECTURE 업데이트** (아키텍처 변경 시)
- [ ] **DEVELOPMENT_GUIDE 업데이트** (새로운 패턴 도입 시)
- [ ] **도메인별 README 추가** (새 도메인 생성 시)

### 4. Git Commit

- [ ] **변경 파일 확인**
  ```bash
  git status
  git diff
  ```
- [ ] **커밋 메시지 작성**
  - [ ] 형식: `feat:`, `fix:`, `refactor:`, `docs:` 등
  - [ ] 예시: `feat: auth 도메인에 Google OAuth 통합 추가`
- [ ] **스테이징 및 커밋**
  ```bash
  git add -A
  git commit -m "커밋 메시지"
  ```

---

## 🚨 치명적 실수 방지 (Critical Mistakes to Avoid)

### 절대 하지 말아야 할 것들

1. **❌ 폴더 구조 파괴**
   - `core/`, `shared/`, `domain/`, `domains/` 구조 변경 금지

2. **❌ 절차지향 함수**
   - 백엔드 비즈니스 로직을 함수로 작성 금지

3. **❌ 직접 DB 접근**
   - Service에서 `db.execute()` 직접 호출 금지

4. **❌ 직접 axios 호출**
   - 프론트엔드에서 `axios` 직접 import 금지

5. **❌ 인라인 스타일**
   - `style={{ ... }}` 사용 금지

6. **❌ Supabase 전용 기능**
   - Auth, Storage, Realtime 절대 사용 금지

7. **❌ 타입 생략**
   - Python, TypeScript 모두 타입 힌트 필수

8. **❌ migration 없이 DB 변경**
   - 테이블/컬럼 변경 시 SQL 파일 필수

---

## 🎓 학습 자료

### 처음 시작하는 AI 개발자

1. **프로젝트 이해** (1순위)
   - [ ] [README.md](../README.md) 읽기
   - [ ] [ARCHITECTURE.md](./ARCHITECTURE.md) 읽기
   - [ ] [.cursorrules](../.cursorrules) 읽기

2. **예제 코드 탐색** (2순위)
   - [ ] `server/app/domain/auth/` 도메인 구조 파악
   - [ ] `client/src/domains/dashboard/` 구조 파악
   - [ ] 비슷한 기능 찾아서 패턴 학습

3. **실전 연습** (3순위)
   - [ ] 간단한 도메인 추가 (예: Todo)
   - [ ] 기존 기능 수정
   - [ ] 체크리스트 따라가며 작업

### 막혔을 때

1. **검색 순서**
   - [ ] `.cursorrules`에서 키워드 검색
   - [ ] `docs/` 폴더 문서 검색
   - [ ] 유사한 예제 코드 찾기

2. **질문하기**
   - 사용자에게 명확히 상황 설명
   - 현재 시도한 방법 공유
   - 여러 대안 제시

---

## 📋 빠른 참조 (Quick Reference)

### 도메인별 핵심 규칙

| 도메인 | 핵심 규칙 |
|--------|----------|
| **auth** | JWT 15분, Refresh 7일, state 파라미터 CSRF 방지 |
| **menu** | 최대 3depth, position_code 기반 권한, 백엔드 검증 필수 |
| **common** | code_type으로 그룹핑, 하드코딩 금지, use_yn으로 삭제 |
| **dashboard** | 위젯별 API 분리, DB 집계 활용, 차트 30일 제한 |
| **user** | bcrypt 해싱, Response에서 비밀번호 제외, soft delete |

### 파일 배치 규칙

```
# 백엔드 도메인
server/app/domain/{domain}/
├── service.py           # BaseService 상속
├── models/              # SQLAlchemy 모델
├── schemas/             # Pydantic 스키마
├── repositories/        # 데이터 조회
├── calculators/         # 순수 로직
└── formatters/          # 응답 변환

# 프론트엔드 도메인
client/src/domains/{domain}/
├── api.ts               # API 함수
├── store.ts             # Zustand 스토어
├── types.ts             # TypeScript 타입
├── components/          # 도메인 컴포넌트
└── pages/               # 도메인 페이지
```

---

## ✨ 마무리

이 체크리스트를 따르면:
- ✅ 아키텍처 일관성 유지
- ✅ 버그 발생 확률 감소
- ✅ 코드 리뷰 통과율 향상
- ✅ 유지보수성 극대화

**작업 전 → 작업 중 → 작업 후** 체크리스트를 순서대로 확인하세요! 🚀

---

**Happy Vibe Coding! 🎉**
