# Phase 1: 긴급 수정 - 상세 액션 플랜

> **우선순위**: 🔴 최고
> **예상 소요**: 1-2시간
> **목표**: 치명적 불일치 즉시 해결

---

## Task 1.1: 프로젝트 이름 통일

### 현재 상황
```
❌ ai-worker-project (README.md line 109)
❌ vibe-web-starter (PROJECT_HANDOVER.md line 75)
✅ 1on1-vntg (실제 프로젝트명)
```

### 수정 대상 파일 및 위치

#### 1. README.md
**검색 키워드**: `ai-worker-project`
**작업**:
- [ ] README.md 전체에서 `ai-worker-project` 검색
- [ ] 발견된 모든 인스턴스를 `1on1-vntg`로 치환
- [ ] 폴더 경로 예시 확인 (line 109 부근)

#### 2. PROJECT_HANDOVER.md
**검색 키워드**: `vibe-web-starter`
**작업**:
- [ ] PROJECT_HANDOVER.md 전체에서 `vibe-web-starter` 검색
- [ ] 발견된 모든 인스턴스를 `1on1-vntg`로 치환
- [ ] 폴더 경로 예시 확인 (line 75 부근)

#### 3. 기타 문서
**확인 대상**:
- [ ] DEVELOPMENT_GUIDE.md
- [ ] ARCHITECTURE.md
- [ ] client/README.md
- [ ] server/README.md

### 실행 명령
```bash
# 1. 전체 검색
grep -r "ai-worker-project" /home/user/1on1-vntg/*.md
grep -r "vibe-web-starter" /home/user/1on1-vntg/*.md

# 2. AI 개발자에게 요청
"모든 MD 파일에서 'ai-worker-project'와 'vibe-web-starter'를 '1on1-vntg'로 치환해줘"
```

### 검증 방법
```bash
# 치환 후 확인
grep -r "ai-worker-project" /home/user/1on1-vntg/*.md  # 결과 없어야 함
grep -r "vibe-web-starter" /home/user/1on1-vntg/*.md   # 결과 없어야 함
grep -c "1on1-vntg" /home/user/1on1-vntg/README.md      # 여러 건 나와야 함
```

---

## Task 1.2: Supabase 정책 명확화

### 현재 상황
```
현재: 문서 간 Supabase 정책이 명확하지 않음
목표: PostgreSQL DB로만 사용, 전용 기능 금지 명확화
```

### 정책 방향
```
✅ Supabase를 PostgreSQL 데이터베이스로 활용 (권장)
❌ Supabase 전용 기능 사용 금지 (Auth, Storage, Realtime 등)
📌 이유: 향후 순수 PostgreSQL로 쉬운 이관
```

### 수정 대상 1: .cursorrules

**위치**: Line 17-19 부근
**현재**:
```
8. **SUPABASE 기능 사용 금지** : 추후 PostgreSQL로 이관 계획이 있으므로
   Supabase Auth, Storage, Realtime 기능 사용 금지
```

**수정 후**:
```
8. **SUPABASE 사용 정책**
   - ✅ 권장: Supabase를 PostgreSQL 데이터베이스로 활용
   - ❌ 금지: Supabase 전용 기능 사용 (Auth, Storage, Realtime, Edge Functions 등)
   - 이유: 향후 순수 PostgreSQL 환경으로 쉬운 이관을 위해
   - 장점:
     * 무료 티어로 빠른 개발 환경 구축
     * PostgreSQL 100% 호환 (표준 SQL만 사용)
     * 관리 UI 제공 (테이블 관리, SQL Editor)
     * 로컬 개발에 최적
   - 로컬 개발: Supabase 무료 계정으로 PostgreSQL DB 사용 권장
   - 프로덕션: Supabase 또는 자체 PostgreSQL 서버로 쉽게 이관 가능
   - 대안 구현:
     * 인증: JWT 직접 구현 (현재 구현됨)
     * 파일 저장: S3 또는 로컬 스토리지
     * 실시간: WebSocket 직접 구현
```

### 수정 대상 2: README.md

**위치**: Lines 292-322 (데이터베이스 설정 섹션)
**현재**: 간단한 Supabase 안내만 있음

**추가/강화 내용**:
```markdown
## 데이터베이스 설정 (Supabase PostgreSQL 권장)

### 🚀 Supabase 사용 정책
- ✅ **권장**: Supabase를 PostgreSQL 데이터베이스로 활용
- ❌ **금지**: Supabase 전용 기능 (Auth, Storage, Realtime 등)
- 📌 **이유**: 향후 순수 PostgreSQL로 쉬운 이관

### 왜 Supabase PostgreSQL인가?
- ✅ **무료 티어**: 로컬 개발에 충분한 무료 PostgreSQL DB
- ✅ **빠른 설정**: 클릭 몇 번으로 즉시 사용
- ✅ **PostgreSQL 100% 호환**: 표준 SQL만 사용
- ✅ **관리 UI**: 웹에서 테이블 관리, SQL 실행, 데이터 확인
- ✅ **쉬운 이관**: 언제든 다른 PostgreSQL 서버로 이동 가능

### Supabase 시작하기
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. Settings → Database에서 PostgreSQL 연결 정보 확인
4. `.env` 파일에 `DATABASE_URL` 입력
5. 바로 개발 시작!

### 연결 예시
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**중요**: Supabase Auth, Storage, Realtime 등 전용 기능은 사용하지 마세요.
순수 PostgreSQL 데이터베이스로만 활용하세요.

자세한 설정은 [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)를 참조하세요.
```

### 수정 대상 3: TEST_GUIDE.md (또는 docs/TEST_GUIDE.md)

**작업**:
- [ ] Supabase PostgreSQL 사용 전제 유지
- [ ] Supabase 전용 기능 사용 안 함 명시
- [ ] 순수 PostgreSQL 연결 방식만 사용

### 실행 명령
```bash
# AI 개발자에게 요청
".cursorrules의 8번 항목을 Supabase 정책(PostgreSQL만 사용, 전용 기능 금지)으로 수정해줘.
README.md의 데이터베이스 섹션에도 동일한 정책을 명확히 추가해줘."
```

### 검증 방법
```bash
# 1. .cursorrules 확인
cat /home/user/1on1-vntg/.cursorrules | grep -A15 "SUPABASE"

# 2. README.md 확인
cat /home/user/1on1-vntg/README.md | grep -A25 "데이터베이스 설정"

# 3. 일관성 확인 (육안)
# .cursorrules와 README.md의 Supabase 정책이 "PostgreSQL만 사용, 전용 기능 금지"로 일치하는지
```

---

## Task 1.3: 폴더 구조 예시 통일

### 현재 상황
```
문서마다 다른 루트 폴더명 사용:
- ai-worker-project/
- vibe-web-starter/
- 1on1-vntg/ (실제)
```

### 수정 대상 파일

#### 1. README.md
**검색**: `ai-worker-project/`
**치환**: `1on1-vntg/`

#### 2. PROJECT_HANDOVER.md
**검색**: `vibe-web-starter/`
**치환**: `1on1-vntg/`

#### 3. DEVELOPMENT_GUIDE.md
**확인**: 경로 예시에 잘못된 루트 폴더명 사용 여부

#### 4. ARCHITECTURE.md
**확인**: 경로 예시에 잘못된 루트 폴더명 사용 여부

### 전역 치환 스크립트
```bash
# 모든 MD 파일에서 잘못된 폴더명 찾기
find /home/user/1on1-vntg -name "*.md" -exec grep -l "ai-worker-project\|vibe-web-starter" {} \;

# AI 개발자에게 요청
"모든 MD 파일에서 'ai-worker-project/'와 'vibe-web-starter/'를 '1on1-vntg/'로 치환해줘.
단, 실제 설명 문구는 건드리지 말고, 경로 예시만 수정해줘."
```

### 검증 방법
```bash
# 1. 잘못된 경로 확인 (없어야 함)
find /home/user/1on1-vntg -name "*.md" -exec grep "ai-worker-project/" {} + | wc -l  # 0이어야 함
find /home/user/1on1-vntg -name "*.md" -exec grep "vibe-web-starter/" {} + | wc -l  # 0이어야 함

# 2. 올바른 경로 확인 (있어야 함)
find /home/user/1on1-vntg -name "*.md" -exec grep "1on1-vntg/" {} + | head -5

# 3. 각 문서별 확인
grep "1on1-vntg/" /home/user/1on1-vntg/README.md | head -3
grep "1on1-vntg/" /home/user/1on1-vntg/PROJECT_HANDOVER.md | head -3
```

---

## Phase 1 완료 체크리스트

### Task 1.1: 프로젝트 이름 통일
- [ ] README.md에서 모든 `ai-worker-project` 치환
- [ ] PROJECT_HANDOVER.md에서 모든 `vibe-web-starter` 치환
- [ ] 기타 문서에서 잘못된 프로젝트명 검색 및 치환
- [ ] 검증: `grep -r "ai-worker-project\|vibe-web-starter" *.md` 결과 없음

### Task 1.2: Supabase 정책 명확화
- [ ] .cursorrules의 8번 항목을 명확한 정책으로 수정 (PostgreSQL만 사용, 전용 기능 금지)
- [ ] README.md 데이터베이스 섹션에 정책 명시 및 주의사항 추가
- [ ] TEST_GUIDE.md에서 Supabase PostgreSQL 사용 명시
- [ ] 검증: 3개 문서의 정책이 일치함 (PostgreSQL OK, 전용 기능 금지)

### Task 1.3: 폴더 구조 예시 통일
- [ ] 모든 MD 파일에서 경로 예시 치환
- [ ] 검증: 잘못된 경로명 0개, 올바른 경로명 다수 확인

### 최종 검증
- [ ] 모든 문서를 한 번씩 읽으며 육안 확인
- [ ] Git diff로 변경사항 확인
- [ ] 커밋 메시지 작성:
  ```
  docs: Phase 1 긴급 수정 - 프로젝트명 통일 및 Supabase 정책 명확화

  - 모든 문서에서 프로젝트명을 1on1-vntg로 통일
  - Supabase 정책 명확화: PostgreSQL DB로만 사용, 전용 기능 금지
  - 경로 예시 통일

  주요 변경:
  - .cursorrules: Supabase 정책 (PostgreSQL 권장, 전용 기능 금지)
  - README.md: Supabase 정책 명시, 프로젝트명 통일
  - 모든 문서: 경로 예시를 1on1-vntg/로 통일

  Supabase 정책:
  - ✅ PostgreSQL 데이터베이스로 활용
  - ❌ Auth, Storage, Realtime 등 전용 기능 사용 금지
  - 이유: 향후 순수 PostgreSQL로 쉬운 이관

  Ref: DOCUMENTATION_ROADMAP.md Phase 1
  ```

---

## 다음 단계

Phase 1 완료 후:
1. DOCUMENTATION_ROADMAP.md Phase 2 확인
2. Phase 2 작업 시작 (문서 구조 재구성 - docs/ 폴더 생성)

---

**작성일**: 2026-01-23
**최종 수정**: 2026-01-23
**버전**: 2.0.0
