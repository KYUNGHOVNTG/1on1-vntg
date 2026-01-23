# 📋 문서 정비 및 바이브코딩 환경 구축 로드맵

> **목적**: 프로젝트 문서 간 일관성 확보 및 AI 바이브코딩 환경 완성
> **작성일**: 2026-01-23
> **버전**: 2.0.0

---

## 🎯 전체 목표

1. **문서 일관성 100%** - 모든 MD 파일 간 정보 통일
2. **바이브코딩 규칙 완성** - AI 개발자가 길을 잃지 않는 명확한 가이드
3. **체계적 문서 구조** - docs/ 폴더로 목적별 문서 분리
4. **중복 제거** - 효율적인 문서 구조 확립

---

## 📊 현황 분석 요약

### ✅ 강점
- 아키텍처 설계가 명확하고 일관됨 (계층화 구조)
- 디자인 시스템(1on1-Mirror)이 상세히 정의됨
- AI 에이전트를 위한 .cursorrules가 잘 작성됨
- 기술 스택 버전 대부분 일치

### ⚠️ 개선 필요
- **긴급**: 프로젝트 이름 불일치 (1on1-vntg vs ai-worker-project vs vibe-web-starter)
- **중요**: 문서 구조 정리 필요 (루트에 문서 분산, docs/ 폴더 미사용)
- **중요**: 문서 중복 (도메인 추가, 아키텍처, 빠른 시작)
- **중요**: 보안 가이드 부족

---

## 🗺️ 새로운 문서 구조

```
1on1-vntg/
├── .cursorrules                    # AI 바이브코딩 규칙 (루트 유지)
├── README.md                       # 프로젝트 개요, 빠른 시작 (간소화)
├── docs/                           # 📁 모든 문서를 여기로 집중
│   ├── SETUP_GUIDE.md             # 구동 방법 (신규 분리)
│   ├── ARCHITECTURE.md            # 아키텍처 상세
│   ├── DEVELOPMENT_GUIDE.md       # 개발 가이드
│   ├── SECURITY.md                # 보안 구조 (신규)
│   ├── TEST_GUIDE.md              # 테스트 가이드 (이동)
│   ├── MENU_GUIDE.md              # 메뉴 권한 시스템 (이동)
│   └── PROJECT_HANDOVER.md        # AI 개발자 인수인계 (이동)
├── client/
│   └── README.md                  # 클라이언트 개발 가이드 (업데이트)
└── server/
    └── README.md                  # 서버 개발 가이드 (업데이트)
```

---

## 🗺️ 로드맵 (4단계)

```
Phase 1: 긴급 수정 (1-2시간)
  ↓
Phase 2: 문서 구조 재구성 (2-3시간)
  ↓
Phase 3: 보안 문서 추가 (1시간)
  ↓
Phase 4: 바이브코딩 최적화 (2-3시간)
```

---

## 📍 Phase 1: 긴급 수정 (필수)

> **목표**: 치명적 불일치 해결
> **소요**: 1-2시간
> **우선순위**: 🔴 최고

### Task 1.1: 프로젝트 이름 통일
- **문제**: 3가지 다른 이름 사용 중
  - `1on1-vntg` (실제)
  - `ai-worker-project` (README.md)
  - `vibe-web-starter` (PROJECT_HANDOVER.md)
- **작업**:
  - [ ] README.md의 모든 `ai-worker-project` → `1on1-vntg`
  - [ ] PROJECT_HANDOVER.md의 모든 `vibe-web-starter` → `1on1-vntg`
  - [ ] 모든 경로 예시를 `1on1-vntg/`로 통일
- **영향 파일**:
  - `/home/user/1on1-vntg/README.md`
  - `/home/user/1on1-vntg/PROJECT_HANDOVER.md`
  - `/home/user/1on1-vntg/DEVELOPMENT_GUIDE.md`
  - `/home/user/1on1-vntg/ARCHITECTURE.md`

### Task 1.2: Supabase 적극 권장 정책 확립
- **현재 정책**: Supabase를 PostgreSQL DB로 적극 활용
- **작업**:
  - [ ] .cursorrules 수정 - Supabase 전면 권장 명시:
    ```
    8. **SUPABASE 적극 활용**
       - ✅ Supabase를 개발 환경 PostgreSQL 데이터베이스로 적극 권장
       - ✅ Supabase의 모든 기능 활용 가능 (Auth, Storage, Realtime 등)
       - 장점: 빠른 개발, 무료 티어, 실시간 기능, 관리 편의성
       - 로컬 개발: Supabase 무료 계정 사용 권장
    ```
  - [ ] README.md 데이터베이스 섹션 강화:
    - Supabase 사용의 장점 강조
    - 빠른 시작 가이드 명확화
    - 환경 설정 예시 추가
- **영향 파일**:
  - `/home/user/1on1-vntg/.cursorrules`
  - `/home/user/1on1-vntg/README.md`
  - `/home/user/1on1-vntg/TEST_GUIDE.md`

### Task 1.3: 폴더 구조 예시 통일
- **작업**:
  - [ ] 모든 문서의 경로 예시를 실제 구조와 일치시킴
  - [ ] `ai-worker-project` → `1on1-vntg` 전역 치환
  - [ ] `vibe-web-starter` → `1on1-vntg` 전역 치환
- **영향 파일**:
  - README.md
  - PROJECT_HANDOVER.md
  - DEVELOPMENT_GUIDE.md
  - ARCHITECTURE.md

---

## 📍 Phase 2: 문서 구조 재구성 (중요)

> **목표**: docs/ 폴더 중심의 체계적 문서 구조 확립
> **소요**: 2-3시간
> **우선순위**: 🟡 높음

### Task 2.1: docs/ 폴더 생성 및 문서 이동
- **작업**:
  - [ ] `/home/user/1on1-vntg/docs/` 폴더 생성
  - [ ] 다음 파일들을 docs/ 폴더로 이동:
    - `ARCHITECTURE.md` → `docs/ARCHITECTURE.md`
    - `DEVELOPMENT_GUIDE.md` → `docs/DEVELOPMENT_GUIDE.md`
    - `PROJECT_HANDOVER.md` → `docs/PROJECT_HANDOVER.md`
    - `TEST_GUIDE.md` → `docs/TEST_GUIDE.md`
    - `MENU_GUIDE.md` → `docs/MENU_GUIDE.md`
  - [ ] `.cursorrules`는 루트에 유지
  - [ ] `README.md`는 루트에 유지 (간소화 예정)
- **결과**: 깔끔한 루트 디렉토리, 문서는 docs/에 집중

### Task 2.2: SETUP_GUIDE.md 신규 분리
- **현재**: README.md에 구동 방법이 포함됨 (너무 길음)
- **작업**:
  - [ ] `docs/SETUP_GUIDE.md` 신규 생성
  - [ ] README.md에서 구동 방법 섹션 추출:
    - 환경 설정
    - 데이터베이스 설정
    - 로컬 실행 방법
    - Docker Compose 사용법
    - 트러블슈팅
  - [ ] README.md에는 "빠른 시작" 요약만 남기고 상세 내용은 링크
- **신규 파일**: `/home/user/1on1-vntg/docs/SETUP_GUIDE.md`

### Task 2.3: README.md 슬림화
- **현재 문제**: 652줄, 너무 많은 정보
- **작업**:
  - [ ] 남길 내용만 유지:
    - 프로젝트 개요 (3-5줄)
    - 주요 기능
    - 기술 스택 요약
    - 빠른 시작 (5줄, 상세는 SETUP_GUIDE.md 링크)
    - 문서 네비게이션 (docs/ 폴더 안내)
  - [ ] 제거할 내용:
    - 아키텍처 상세 → `docs/ARCHITECTURE.md` 링크
    - 구동 방법 상세 → `docs/SETUP_GUIDE.md` 링크
    - 개발 가이드 → `docs/DEVELOPMENT_GUIDE.md` 링크
  - [ ] 목표 분량: 150-200줄
- **영향 파일**: `/home/user/1on1-vntg/README.md`

### Task 2.4: 문서 상호 참조 강화
- **작업**:
  - [ ] 모든 docs/ 폴더 내 문서 상단에 "관련 문서" 섹션 추가:
    ```markdown
    ## 📚 관련 문서
    - [프로젝트 개요](../README.md) - 빠른 시작 및 기술 스택
    - [구동 가이드](./SETUP_GUIDE.md) - 환경 설정 및 실행
    - [아키텍처](./ARCHITECTURE.md) - 상세 설계
    - [개발 가이드](./DEVELOPMENT_GUIDE.md) - 도메인 개발
    - [보안 가이드](./SECURITY.md) - 인증/보안 구조
    ```
  - [ ] README.md에 docs/ 폴더 네비게이션 추가
- **영향 파일**: docs/ 폴더 내 모든 MD 파일, README.md

### Task 2.5: client/server README.md 업데이트
- **작업**:
  - [ ] `client/README.md` 업데이트:
    - 프론트엔드 개발 환경 설정
    - 도메인 구조 설명 강화
    - 공통 컴포넌트 사용법
    - 디자인 시스템 (1on1-Mirror) 링크
    - 상위 문서 링크 (`../docs/` 참조)
  - [ ] `server/README.md` 업데이트:
    - 백엔드 개발 환경 설정
    - API 개발 가이드
    - 도메인 플러그인 구조
    - 데이터베이스 마이그레이션
    - 상위 문서 링크 (`../docs/` 참조)
- **영향 파일**:
  - `/home/user/1on1-vntg/client/README.md`
  - `/home/user/1on1-vntg/server/README.md`

### Task 2.6: 문서 메타데이터 추가
- **작업**:
  - [ ] 모든 문서 하단에 메타 정보 추가:
    ```markdown
    ---
    **작성일**: 2026-01-23
    **최종 수정**: 2026-01-23
    **버전**: 1.0.0
    **다음 리뷰**: 2026-02-23
    ```
- **영향 파일**: 모든 MD 파일

---

## 📍 Phase 3: 보안 문서 추가 (필수)

> **목표**: 현재 보안 구조 문서화
> **소요**: 1시간
> **우선순위**: 🟡 높음

### Task 3.1: SECURITY.md 생성
- **내용**:
  ```markdown
  # 보안 가이드

  ## 1. 인증/인가 구조
  - JWT 토큰 기반 인증
  - Google OAuth 2.0 통합
  - 권한 체크 미들웨어
  - 토큰 발급 및 검증 흐름

  ## 2. 현재 보안 구현
  - FastAPI 보안 헤더
  - CORS 설정
  - SQL Injection 방지 (SQLAlchemy ORM)
  - XSS 방지 (React 기본 보호)

  ## 3. 민감 정보 관리
  - 환경 변수 (.env)
  - Google OAuth 시크릿
  - JWT 시크릿 키
  - Supabase 접속 정보

  ## 4. 보안 체크리스트
  - [ ] .env 파일 .gitignore 등록 확인
  - [ ] 프로덕션 환경 시크릿 분리
  - [ ] HTTPS 사용 (프로덕션)
  - [ ] CORS 도메인 제한
  ```
- **신규 파일**: `/home/user/1on1-vntg/docs/SECURITY.md`

### Task 3.2: TEST_GUIDE.md 확장
- **현재**: JWT 토큰 테스트만
- **작업**:
  - [ ] 전체 테스트 가이드로 확장:
    - JWT 토큰 발급 테스트 (현재 내용 유지)
    - API 엔드포인트 테스트 방법
    - 인증이 필요한 API 테스트
    - 권한 체크 테스트
  - [ ] docs/ 폴더로 이미 이동 완료 (Task 2.1)
- **영향 파일**: `/home/user/1on1-vntg/docs/TEST_GUIDE.md`

---

## 📍 Phase 4: 바이브코딩 최적화 (선택)

> **목표**: AI 개발자 경험 극대화
> **소요**: 2-3시간
> **우선순위**: 🔵 보통

### Task 4.1: .cursorrules 고도화
- **작업**:
  - [ ] 구체적인 예시 코드 추가
  - [ ] 안티 패턴 예시 추가
  - [ ] 체크리스트 형식으로 재구성
  - [ ] Supabase 활용 예시 추가
- **영향 파일**: `/home/user/1on1-vntg/.cursorrules`

### Task 4.2: 도메인별 .cursorrules 생성
- **작업**:
  - [ ] `client/src/domains/.cursorrules` 생성 (프론트엔드 규칙)
  - [ ] `server/domains/.cursorrules` 생성 (백엔드 규칙)
  - [ ] 각 도메인 폴더에 컨텍스트별 규칙 추가
- **신규 파일**:
  - `client/src/domains/.cursorrules`
  - `server/domains/.cursorrules`

### Task 4.3: AI 개발자용 체크리스트
- **작업**:
  - [ ] `docs/AI_DEVELOPER_CHECKLIST.md` 생성
  - [ ] 내용:
    - 새 기능 개발 시작 전 확인사항
    - 코드 작성 중 확인사항
    - PR 전 확인사항
    - 문서 업데이트 체크리스트
- **신규 파일**: `/home/user/1on1-vntg/docs/AI_DEVELOPER_CHECKLIST.md`

---

## 📊 진행 상황 추적

### Phase 1: 긴급 수정
- [ ] Task 1.1: 프로젝트 이름 통일
- [ ] Task 1.2: Supabase 적극 권장 정책 확립
- [ ] Task 1.3: 폴더 구조 예시 통일

### Phase 2: 문서 구조 재구성
- [ ] Task 2.1: docs/ 폴더 생성 및 문서 이동
- [ ] Task 2.2: SETUP_GUIDE.md 신규 분리
- [ ] Task 2.3: README.md 슬림화
- [ ] Task 2.4: 문서 상호 참조 강화
- [ ] Task 2.5: client/server README.md 업데이트
- [ ] Task 2.6: 문서 메타데이터 추가

### Phase 3: 보안 문서 추가
- [ ] Task 3.1: SECURITY.md 생성
- [ ] Task 3.2: TEST_GUIDE.md 확장

### Phase 4: 바이브코딩 최적화
- [ ] Task 4.1: .cursorrules 고도화
- [ ] Task 4.2: 도메인별 .cursorrules 생성
- [ ] Task 4.3: AI 개발자용 체크리스트

---

## 🎯 완료 기준

### Phase 1 완료 조건
✅ 모든 문서에서 프로젝트 이름이 `1on1-vntg`로 통일
✅ Supabase를 적극 권장하는 정책이 명확히 정의됨
✅ 경로 예시가 실제 구조와 일치

### Phase 2 완료 조건
✅ docs/ 폴더 생성 및 모든 문서 이동 완료
✅ SETUP_GUIDE.md 분리 완료
✅ README.md 150-200줄로 슬림화
✅ 모든 문서에 상호 참조 추가
✅ client/server README.md 업데이트 완료
✅ 모든 문서에 메타데이터 추가

### Phase 3 완료 조건
✅ SECURITY.md 생성 완료
✅ TEST_GUIDE.md 확장 완료

### Phase 4 완료 조건
✅ .cursorrules에 예시 코드 추가
✅ 도메인별 규칙 파일 생성
✅ AI 개발자 체크리스트 완성

---

## 📝 사용 방법

### 1. 로드맵 시작
```bash
# 이 문서를 읽고 Phase 1부터 시작
# 각 Task를 순서대로 진행
```

### 2. AI 개발자에게 요청
```
"DOCUMENTATION_ROADMAP.md의 Phase 1 Task 1.1을 진행해줘"
"Phase 2 전체를 진행해줘"
"Task 3.1 보안 가이드를 작성해줘"
```

### 3. 진행 상황 확인
```bash
# 이 파일의 체크박스를 확인하여 진행률 파악
```

---

## 🚀 다음 단계

1. **지금 바로**: Phase 1 긴급 수정 시작
2. **오늘 내**: Phase 2 문서 구조 재구성 완료
3. **이번 주**: Phase 3 보안 문서 추가
4. **여유 있을 때**: Phase 4 바이브코딩 최적화

---

## 📞 문의

- 각 Task 진행 시 막히는 부분이 있으면 이 로드맵을 참조
- 새로운 이슈 발견 시 이 문서에 추가
- 정기적으로 이 문서를 업데이트하여 최신 상태 유지

---

**작성일**: 2026-01-23
**최종 수정**: 2026-01-23
**버전**: 2.0.0
**다음 리뷰**: 2026-01-30
