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
**위치**: Line 109
**현재**:
```markdown
ai-worker-project/
├── client/          # React 19 프론트엔드
```

**수정 후**:
```markdown
1on1-vntg/
├── client/          # React 19 프론트엔드
```

**추가 확인 필요**:
- [ ] README.md 전체에서 `ai-worker-project` 검색
- [ ] README.md 전체에서 `vibe-web-starter` 검색
- [ ] 발견된 모든 인스턴스를 `1on1-vntg`로 치환

#### 2. PROJECT_HANDOVER.md
**위치**: Line 75
**현재**:
```markdown
vibe-web-starter/
├── client/          # React 19 프론트엔드
```

**수정 후**:
```markdown
1on1-vntg/
├── client/          # React 19 프론트엔드
```

**추가 확인 필요**:
- [ ] PROJECT_HANDOVER.md 전체에서 `vibe-web-starter` 검색
- [ ] PROJECT_HANDOVER.md 전체에서 `ai-worker-project` 검색
- [ ] 발견된 모든 인스턴스를 `1on1-vntg`로 치환

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
"README.md와 PROJECT_HANDOVER.md에서 모든 'ai-worker-project'와 'vibe-web-starter'를 '1on1-vntg'로 치환해줘"
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
❌ .cursorrules: "SUPABASE 기능 사용 금지" (모호함)
❌ README.md: Supabase 적극 권장 (모순)
```

### 명확한 정책 수립
```
✅ 정책: PostgreSQL 데이터베이스로서의 Supabase 사용은 허용
✅ 금지: Supabase Auth, Storage, Realtime 등 전용 기능 사용 금지
✅ 이유: 향후 순수 PostgreSQL 환경으로 이관 가능성
```

### 수정 대상 1: .cursorrules

**위치**: Line 17-19
**현재**:
```
8. **SUPABASE 기능 사용 금지** : 추후 PostgreSQL로 이관 계획이 있으므로
   Supabase Auth, Storage, Realtime 기능 사용 금지
```

**수정 후**:
```
8. **SUPABASE 특수 기능 사용 제한**
   - ✅ 허용: PostgreSQL 데이터베이스로서의 Supabase 사용
   - ❌ 금지: Supabase Auth, Storage, Realtime, Edge Functions 등 Supabase 전용 기능
   - 이유: 향후 순수 PostgreSQL 환경으로 이관 가능성을 위해 PostgreSQL 표준만 사용
   - 권장: 인증은 JWT 직접 구현, 파일은 S3/로컬 스토리지, 실시간은 WebSocket 직접 구현
```

### 수정 대상 2: README.md

**위치**: Lines 292-322 (데이터베이스 설정 섹션)
**현재**:
```markdown
## 데이터베이스 설정 (Supabase 권장)

로컬에서는 Supabase 무료 계정으로 빠르게 시작하세요.
```

**수정 후**:
```markdown
## 데이터베이스 설정 (Supabase PostgreSQL 권장)

### Supabase 사용 정책
- ✅ **허용**: PostgreSQL 데이터베이스로서의 Supabase 사용
- ❌ **금지**: Supabase Auth, Storage, Realtime 등 전용 기능
- **이유**: PostgreSQL 호환성 유지 및 향후 이관 가능성

### Supabase 무료 계정 시작
로컬에서는 Supabase 무료 계정의 PostgreSQL 데이터베이스로 빠르게 시작하세요.
(단, Supabase 전용 기능은 사용하지 마세요)
```

### 수정 대상 3: TEST_GUIDE.md

**위치**: 전체 (Supabase 언급 부분)
**작업**:
- [ ] Supabase 언급 시 "Supabase PostgreSQL 데이터베이스" 명시
- [ ] 정책 링크 추가: `자세한 정책은 [.cursorrules](./.cursorrules) 참조`

### 실행 명령
```bash
# AI 개발자에게 요청
".cursorrules의 8번 항목을 Supabase 정책에 맞게 수정해줘.
README.md의 데이터베이스 설정 섹션에도 동일한 정책을 추가해줘."
```

### 검증 방법
```bash
# 1. .cursorrules 확인
cat /home/user/1on1-vntg/.cursorrules | grep -A5 "SUPABASE"

# 2. README.md 확인
cat /home/user/1on1-vntg/README.md | grep -A10 "데이터베이스 설정"

# 3. 일관성 확인
# .cursorrules와 README.md의 Supabase 정책이 동일한지 육안 확인
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
단, 실제 설명 문구(예: '이 프로젝트는...')는 건드리지 말고, 경로 예시만 수정해줘."
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
- [ ] .cursorrules의 8번 항목 수정
- [ ] README.md 데이터베이스 섹션에 정책 추가
- [ ] TEST_GUIDE.md에 정책 링크 추가
- [ ] 검증: 3개 문서의 정책이 일치함

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
  - Supabase 사용 정책 명확화 (DB는 허용, 전용 기능은 금지)
  - 경로 예시 통일

  Ref: DOCUMENTATION_ROADMAP.md Phase 1
  ```

---

## 다음 단계

Phase 1 완료 후:
1. `PHASE2_ACTION_PLAN.md` 확인
2. Phase 2 작업 시작 (문서 구조 개선)

---

**작성일**: 2026-01-23
**버전**: 1.0.0
