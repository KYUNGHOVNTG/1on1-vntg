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

## Task 1.2: Supabase 적극 권장 정책 확립

### 현재 상황
```
현재: 문서 간 Supabase 언급이 일관되지 않음
목표: Supabase를 개발 환경 DB로 적극 권장하는 명확한 정책
```

### 정책 방향
```
✅ Supabase를 로컬 개발 환경 PostgreSQL DB로 적극 권장
✅ Supabase의 모든 기능 활용 가능 (Auth, Storage, Realtime 등)
✅ 빠른 개발, 무료 티어, 실시간 기능, 관리 편의성 강조
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
8. **SUPABASE 적극 활용**
   - ✅ Supabase를 개발 환경 PostgreSQL 데이터베이스로 적극 권장
   - ✅ Supabase의 모든 기능 활용 가능 (Auth, Storage, Realtime, Edge Functions 등)
   - 장점:
     * 빠른 개발 환경 구축 (무료 티어)
     * 실시간 기능 (Realtime Subscriptions)
     * 인증/권한 관리 용이 (Supabase Auth)
     * 파일 저장소 (Supabase Storage)
     * 관리 UI 제공 (테이블 관리, SQL Editor)
   - 로컬 개발: Supabase 무료 계정 사용 권장
   - 프로덕션: Supabase 유료 플랜 또는 자체 PostgreSQL 선택 가능
```

### 수정 대상 2: README.md

**위치**: Lines 292-322 (데이터베이스 설정 섹션)
**현재**: 간단한 Supabase 안내만 있음

**추가/강화 내용**:
```markdown
## 데이터베이스 설정 (Supabase 권장)

### 🚀 왜 Supabase인가?
- ✅ **무료 티어**: 로컬 개발에 충분한 무료 계정 제공
- ✅ **빠른 설정**: 클릭 몇 번으로 PostgreSQL DB 즉시 사용
- ✅ **실시간 기능**: Realtime Subscriptions으로 실시간 업데이트 가능
- ✅ **인증 내장**: Google OAuth, JWT 토큰 등 인증 기능 제공
- ✅ **파일 저장소**: 프로필 이미지, 첨부 파일 등 저장 가능
- ✅ **관리 UI**: 웹에서 테이블 관리, SQL 실행, 데이터 확인

### Supabase 시작하기
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. Settings → Database에서 연결 정보 확인
4. `.env` 파일에 `DATABASE_URL` 입력
5. 바로 개발 시작!

### 연결 예시
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

자세한 설정은 [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)를 참조하세요.
```

### 수정 대상 3: TEST_GUIDE.md (또는 docs/TEST_GUIDE.md)

**작업**:
- [ ] Supabase 사용 전제로 작성된 내용 유지
- [ ] "Supabase를 사용하는 경우" 조건문 제거 (기본값으로 간주)
- [ ] Supabase Auth 사용 예시 추가 (선택사항)

### 실행 명령
```bash
# AI 개발자에게 요청
".cursorrules의 8번 항목을 Supabase 적극 권장 정책으로 수정해줘.
README.md의 데이터베이스 섹션에 Supabase 장점을 강조하는 내용을 추가해줘."
```

### 검증 방법
```bash
# 1. .cursorrules 확인
cat /home/user/1on1-vntg/.cursorrules | grep -A10 "SUPABASE"

# 2. README.md 확인
cat /home/user/1on1-vntg/README.md | grep -A20 "데이터베이스 설정"

# 3. 일관성 확인 (육안)
# .cursorrules와 README.md의 Supabase 정책이 "적극 권장"으로 일치하는지
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

### Task 1.2: Supabase 적극 권장 정책 확립
- [ ] .cursorrules의 8번 항목을 Supabase 적극 권장으로 수정
- [ ] README.md 데이터베이스 섹션에 Supabase 장점 추가
- [ ] TEST_GUIDE.md에서 Supabase 기본값으로 간주
- [ ] 검증: 3개 문서의 정책이 "적극 권장"으로 일치함

### Task 1.3: 폴더 구조 예시 통일
- [ ] 모든 MD 파일에서 경로 예시 치환
- [ ] 검증: 잘못된 경로명 0개, 올바른 경로명 다수 확인

### 최종 검증
- [ ] 모든 문서를 한 번씩 읽으며 육안 확인
- [ ] Git diff로 변경사항 확인
- [ ] 커밋 메시지 작성:
  ```
  docs: Phase 1 긴급 수정 - 프로젝트명 통일 및 Supabase 정책 확립

  - 모든 문서에서 프로젝트명을 1on1-vntg로 통일
  - Supabase를 개발 환경 DB로 적극 권장하는 정책 확립
  - 경로 예시 통일

  주요 변경:
  - .cursorrules: Supabase 적극 활용 권장
  - README.md: Supabase 장점 강조, 프로젝트명 통일
  - 모든 문서: 경로 예시를 1on1-vntg/로 통일

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
