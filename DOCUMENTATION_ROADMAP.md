# 📋 문서 정비 및 바이브코딩 환경 구축 로드맵

> **목적**: 프로젝트 문서 간 일관성 확보 및 AI 바이브코딩 환경 완성
> **작성일**: 2026-01-23
> **버전**: 1.0.0

---

## 🎯 전체 목표

1. **문서 일관성 100%** - 모든 MD 파일 간 정보 통일
2. **바이브코딩 규칙 완성** - AI 개발자가 길을 잃지 않는 명확한 가이드
3. **누락 문서 보완** - 배포, 보안, 성능 가이드 추가
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
- **긴급**: Supabase 정책 모순
- **중요**: 문서 중복 (도메인 추가, 아키텍처, 빠른 시작)
- **중요**: 배포/보안 가이드 부족

---

## 🗺️ 로드맵 (3단계)

```
Phase 1: 긴급 수정 (1-2시간)
  ↓
Phase 2: 문서 구조 개선 (2-3시간)
  ↓
Phase 3: 누락 문서 추가 (3-4시간)
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
  - [ ] README.md line 109 수정
  - [ ] PROJECT_HANDOVER.md line 75 수정
  - [ ] 모든 경로 예시를 `1on1-vntg/`로 통일
- **영향 파일**:
  - `/home/user/1on1-vntg/README.md`
  - `/home/user/1on1-vntg/PROJECT_HANDOVER.md`

### Task 1.2: Supabase 정책 명확화
- **문제**: .cursorrules는 "사용 금지", README.md는 "적극 권장"
- **작업**:
  - [ ] .cursorrules line 17-19 수정:
    ```
    8. **SUPABASE 특수 기능 사용 제한**
       - PostgreSQL 호환성을 위해 Supabase Auth, Storage, Realtime 등
         Supabase 전용 기능 사용 금지
       - PostgreSQL 데이터베이스로서의 Supabase 사용은 허용
       - 이유: 향후 PostgreSQL 단독 환경으로 이관 가능성
    ```
  - [ ] README.md에 동일한 정책 명시 (lines 292-322 부근)
- **영향 파일**:
  - `/home/user/1on1-vntg/.cursorrules`
  - `/home/user/1on1-vntg/README.md`

### Task 1.3: 폴더 구조 예시 통일
- **작업**:
  - [ ] 모든 문서의 경로 예시를 실제 구조와 일치시킴
  - [ ] `ai-worker-project` → `1on1-vntg` 전역 치환
- **영향 파일**:
  - README.md
  - PROJECT_HANDOVER.md
  - DEVELOPMENT_GUIDE.md

---

## 📍 Phase 2: 문서 구조 개선 (중요)

> **목표**: 중복 제거 및 효율적 문서 체계 구축
> **소요**: 2-3시간
> **우선순위**: 🟡 높음

### Task 2.1: README.md 슬림화
- **현재 문제**: 652줄, 너무 많은 정보
- **작업**:
  - [ ] 아키텍처 상세 설명 제거 → `ARCHITECTURE.md` 링크로 대체
  - [ ] 도메인 추가 상세 가이드 제거 → `DEVELOPMENT_GUIDE.md` 링크로 대체
  - [ ] 목표 분량: 300-400줄
  - [ ] 남길 내용:
    - 프로젝트 개요
    - 빠른 시작
    - 기술 스택
    - 트러블슈팅 기본
- **영향 파일**: `/home/user/1on1-vntg/README.md`

### Task 2.2: 중복 콘텐츠 정리
- **작업**:
  - [ ] **도메인 추가 가이드**:
    - README.md: 개요만 (5줄)
    - DEVELOPMENT_GUIDE.md: 전체 체크리스트 (유일한 소스)
    - PROJECT_HANDOVER.md: 링크만
  - [ ] **아키텍처 설명**:
    - README.md: 다이어그램 1개 + 3줄 설명
    - ARCHITECTURE.md: 전체 설명 (유일한 소스)
    - PROJECT_HANDOVER.md: 핵심 원칙만 (5줄)
  - [ ] **빠른 시작**:
    - README.md: 전체 (유일한 소스)
    - PROJECT_HANDOVER.md: 링크만
- **영향 파일**:
  - README.md
  - DEVELOPMENT_GUIDE.md
  - PROJECT_HANDOVER.md
  - ARCHITECTURE.md

### Task 2.3: 문서 상호 참조 강화
- **작업**:
  - [ ] 각 문서 상단에 "관련 문서" 섹션 추가
  - [ ] 예시:
    ```markdown
    ## 📚 관련 문서
    - [전체 개요](./README.md) - 프로젝트 소개 및 빠른 시작
    - [아키텍처](./ARCHITECTURE.md) - 상세 설계
    - [개발 가이드](./DEVELOPMENT_GUIDE.md) - 도메인 추가 체크리스트
    - [인수인계](./PROJECT_HANDOVER.md) - AI 개발자용 가이드
    ```
- **영향 파일**: 모든 루트 레벨 MD 파일

### Task 2.4: 문서 메타데이터 추가
- **작업**:
  - [ ] 모든 문서 하단에 메타 정보 추가:
    ```markdown
    ---
    **작성일**: 2026-01-23
    **최종 수정**: 2026-01-23
    **버전**: 1.0.0
    **작성자**: AI 바이브코딩 팀
    ```
- **영향 파일**: 모든 MD 파일

---

## 📍 Phase 3: 누락 문서 추가 (권장)

> **목표**: 프로덕션 레디 문서 완성
> **소요**: 3-4시간
> **우선순위**: 🟢 보통

### Task 3.1: DEPLOYMENT.md 생성
- **내용**:
  ```markdown
  # 배포 가이드

  ## 1. 개발 환경 배포
  - Docker Compose 사용법
  - 로컬 환경 설정

  ## 2. 스테이징 배포
  - CI/CD 파이프라인
  - 환경 변수 설정

  ## 3. 프로덕션 배포
  - 체크리스트
  - 롤백 절차
  - 모니터링

  ## 4. 인프라
  - 아키텍처 다이어그램
  - 스케일링 전략
  ```
- **신규 파일**: `/home/user/1on1-vntg/DEPLOYMENT.md`

### Task 3.2: SECURITY.md 생성
- **내용**:
  ```markdown
  # 보안 가이드

  ## 1. 인증/인가
  - JWT 토큰 관리
  - OAuth 2.0 설정
  - 권한 체크

  ## 2. 일반 보안
  - SQL Injection 방지
  - XSS 방지
  - CSRF 방지
  - CORS 설정

  ## 3. 민감 정보 관리
  - 환경 변수
  - 시크릿 관리
  - .env 파일 주의사항

  ## 4. 의존성 보안
  - 패키지 업데이트
  - 취약점 스캔
  ```
- **신규 파일**: `/home/user/1on1-vntg/SECURITY.md`

### Task 3.3: PERFORMANCE.md 생성
- **내용**:
  ```markdown
  # 성능 최적화 가이드

  ## 1. 백엔드 최적화
  - 데이터베이스 쿼리 최적화
  - N+1 문제 방지
  - 인덱스 전략
  - 캐싱 (Redis)

  ## 2. 프론트엔드 최적화
  - 번들 사이즈 최적화
  - 코드 스플리팅
  - 이미지 최적화
  - React 렌더링 최적화

  ## 3. API 최적화
  - 페이지네이션
  - Rate Limiting
  - 압축 (gzip/brotli)

  ## 4. 모니터링
  - 성능 메트릭
  - APM 도구
  ```
- **신규 파일**: `/home/user/1on1-vntg/PERFORMANCE.md`

### Task 3.4: CONTRIBUTING.md 생성
- **내용**:
  ```markdown
  # 기여 가이드

  ## 1. 코드 컨벤션
  - 명명 규칙
  - 코드 스타일
  - 커밋 메시지 규칙

  ## 2. 브랜치 전략
  - Git Flow
  - 브랜치 명명

  ## 3. Pull Request
  - PR 템플릿
  - 리뷰 프로세스

  ## 4. 테스트
  - 단위 테스트
  - 통합 테스트
  - 커버리지
  ```
- **신규 파일**: `/home/user/1on1-vntg/CONTRIBUTING.md`

### Task 3.5: TEST_GUIDE.md 확장
- **현재**: JWT 토큰 테스트만
- **작업**:
  - [ ] 이름 변경 고려: `JWT_TEST_GUIDE.md`
  - [ ] 또는 전체 테스트 가이드로 확장:
    - 단위 테스트 (pytest, Jest)
    - 통합 테스트
    - E2E 테스트
    - API 테스트
- **영향 파일**: `/home/user/1on1-vntg/TEST_GUIDE.md`

---

## 📍 Phase 4: 바이브코딩 최적화 (선택)

> **목표**: AI 개발자 경험 극대화
> **소요**: 2-3시간
> **우선순위**: 🔵 낮음

### Task 4.1: .cursorrules 고도화
- **작업**:
  - [ ] 구체적인 예시 코드 추가
  - [ ] 안티 패턴 예시 추가
  - [ ] 체크리스트 형식으로 재구성
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
  - [ ] `AI_DEVELOPER_CHECKLIST.md` 생성
  - [ ] 내용:
    - 새 기능 개발 시작 전 확인사항
    - 코드 작성 중 확인사항
    - PR 전 확인사항
    - 배포 전 확인사항
- **신규 파일**: `/home/user/1on1-vntg/AI_DEVELOPER_CHECKLIST.md`

---

## 📊 진행 상황 추적

### Phase 1: 긴급 수정
- [ ] Task 1.1: 프로젝트 이름 통일
- [ ] Task 1.2: Supabase 정책 명확화
- [ ] Task 1.3: 폴더 구조 예시 통일

### Phase 2: 문서 구조 개선
- [ ] Task 2.1: README.md 슬림화
- [ ] Task 2.2: 중복 콘텐츠 정리
- [ ] Task 2.3: 문서 상호 참조 강화
- [ ] Task 2.4: 문서 메타데이터 추가

### Phase 3: 누락 문서 추가
- [ ] Task 3.1: DEPLOYMENT.md 생성
- [ ] Task 3.2: SECURITY.md 생성
- [ ] Task 3.3: PERFORMANCE.md 생성
- [ ] Task 3.4: CONTRIBUTING.md 생성
- [ ] Task 3.5: TEST_GUIDE.md 확장

### Phase 4: 바이브코딩 최적화
- [ ] Task 4.1: .cursorrules 고도화
- [ ] Task 4.2: 도메인별 .cursorrules 생성
- [ ] Task 4.3: AI 개발자용 체크리스트

---

## 🎯 완료 기준

### Phase 1 완료 조건
✅ 모든 문서에서 프로젝트 이름이 `1on1-vntg`로 통일
✅ Supabase 정책이 명확히 정의되고 모순 없음
✅ 경로 예시가 실제 구조와 일치

### Phase 2 완료 조건
✅ README.md 300-400줄 이하
✅ 중복 콘텐츠 0개 (모두 링크로 대체)
✅ 모든 문서에 상호 참조 추가
✅ 모든 문서에 메타데이터 추가

### Phase 3 완료 조건
✅ 배포 가이드 완성
✅ 보안 가이드 완성
✅ 성능 최적화 가이드 완성
✅ 기여 가이드 완성
✅ 테스트 가이드 확장

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
"Task 3.2 보안 가이드를 작성해줘"
```

### 3. 진행 상황 확인
```bash
# 이 파일의 체크박스를 확인하여 진행률 파악
```

---

## 🚀 다음 단계

1. **지금 바로**: Phase 1 긴급 수정 시작
2. **오늘 내**: Phase 2 문서 구조 개선 완료
3. **이번 주**: Phase 3 누락 문서 추가
4. **여유 있을 때**: Phase 4 바이브코딩 최적화

---

## 📞 문의

- 각 Task 진행 시 막히는 부분이 있으면 이 로드맵을 참조
- 새로운 이슈 발견 시 이 문서에 추가
- 정기적으로 이 문서를 업데이트하여 최신 상태 유지

---

**작성일**: 2026-01-23
**최종 수정**: 2026-01-23
**버전**: 1.0.0
**다음 리뷰**: 2026-01-30
