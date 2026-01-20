# JWT 토큰 발급 테스트 가이드

## 사전 준비사항

### 1. 환경 설정 (.env 파일)

```bash
# .env 파일이 없다면 생성
cp .env.example .env
```

`.env` 파일에서 다음 항목을 반드시 설정하세요:

```env
# Supabase 데이터베이스 URL (필수)
DATABASE_URL=postgresql+asyncpg://postgres.xxx:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# Google OAuth 설정 (필수)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT 시크릿 키 (운영환경에서는 반드시 변경!)
SECRET_KEY=your-secret-key-here-change-in-production
```

### 2. 데이터베이스 마이그레이션 실행

**Supabase Dashboard에서 실행:**

1. Supabase Dashboard → SQL Editor
2. 다음 SQL 파일들을 순서대로 실행:

```sql
-- 1. 공통코드 테이블 및 초기 데이터 생성
-- migration/20260120_common_code_init.sql 실행

-- 2. 테스트용 사용자 데이터 생성 (선택사항)
-- migration/20260120_test_user_data.sql 실행
```

### 3. 실제 사용자 데이터 준비

**중요:** Google 계정으로 로그인하려면, 해당 이메일이 `cm_user` 테이블에 등록되어 있어야 합니다.

예를 들어, `john.doe@gmail.com`으로 로그인하려면:

```sql
INSERT INTO cm_user (user_id, email, use_yn, role_code, position_code, in_user, in_date)
VALUES ('john.doe', 'john.doe@gmail.com', 'Y', 'CD001', 'CD101', 'system', NOW());
```

**user_id 규칙:** 이메일의 `@` 앞 부분 (예: john.doe@gmail.com → john.doe)

## 테스트 절차

### 방법 1: 프론트엔드를 통한 테스트 (권장)

#### 1. 서버 실행

```bash
cd /home/user/1on1-vntg/server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 클라이언트 실행

```bash
cd /home/user/1on1-vntg/client
npm run dev
```

#### 3. 브라우저에서 로그인 테스트

1. `http://localhost:3000/login` 접속
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택 및 인증
4. 개발자 도구(F12) → Network 탭에서 응답 확인

**예상 응답:**

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "john.doe",
  "email": "john.doe@gmail.com",
  "name": "John Doe",
  "role": "HR",
  "position": "TEAM_LEADER"
}
```

### 방법 2: API 직접 테스트 (백엔드만)

#### 1. Google OAuth URL 얻기

```bash
curl -X GET "http://localhost:8000/api/v1/auth/google/url"
```

**응답:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

#### 2. 브라우저에서 인증

1. 위 `auth_url`을 브라우저에 붙여넣기
2. Google 로그인 후 리다이렉트 URL에서 `code` 파라미터 복사
   - 예: `http://localhost:3000/auth/google/callback?code=4/0AY0e...`

#### 3. 토큰 발급 요청

```bash
curl -X POST "http://localhost:8000/api/v1/auth/google/callback" \
  -H "Content-Type: application/json" \
  -d '{"code": "복사한_코드"}'
```

**성공 응답:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obi5kb2UiLCJlbWFpbCI6ImpvaG4uZG9lQGdtYWlsLmNvbSIsInJvbGUiOiJIUiIsInBvc2l0aW9uIjoiVEVBTV9MRUFERVIiLCJleHAiOjE3Mzc0NjgwMDAsImlhdCI6MTczNzQ2MDgwMH0...",
  "token_type": "bearer",
  "user_id": "john.doe",
  "email": "john.doe@gmail.com",
  "name": "John Doe",
  "role": "HR",
  "position": "TEAM_LEADER"
}
```

**실패 응답 (사용자 미등록):**
```json
{
  "success": false,
  "message": "등록되지 않은 사용자이거나 비활성화된 계정입니다"
}
```

## JWT 토큰 검증

발급받은 토큰을 [jwt.io](https://jwt.io)에서 디코딩하여 확인할 수 있습니다.

**Payload 예시:**
```json
{
  "user_id": "john.doe",
  "email": "john.doe@gmail.com",
  "role": "HR",
  "position": "TEAM_LEADER",
  "exp": 1737468000,  // 만료시간 (2시간 후)
  "iat": 1737460800   // 발급시간
}
```

## 체크리스트

- [ ] `.env` 파일에 DATABASE_URL 설정됨
- [ ] `.env` 파일에 Google OAuth 설정됨
- [ ] `cm_codemaster`, `cm_codedetail` 테이블 생성됨
- [ ] 공통코드 초기 데이터(ROLE, POSITION) 삽입됨
- [ ] `cm_user` 테이블에 테스트 사용자 등록됨
- [ ] 서버가 정상적으로 실행됨 (포트 8000)
- [ ] 로그인 성공 시 JWT 토큰이 응답에 포함됨
- [ ] JWT payload에 user_id, email, role, position이 포함됨
- [ ] role과 position이 코드(CD001)가 아닌 의미값(HR)으로 표시됨

## 트러블슈팅

### 1. "등록되지 않은 사용자" 오류

**원인:** `cm_user` 테이블에 사용자가 없거나 `use_yn='N'`

**해결:**
```sql
-- 사용자 확인
SELECT * FROM cm_user WHERE email = 'your-email@gmail.com';

-- 사용자 추가
INSERT INTO cm_user (user_id, email, use_yn, role_code, position_code, in_user)
VALUES ('your-email', 'your-email@gmail.com', 'Y', 'CD002', 'CD102', 'system');
```

### 2. role이나 position이 코드(CD001)로 표시됨

**원인:** `cm_codedetail` 테이블에 해당 코드가 없음

**해결:**
```sql
-- 공통코드 확인
SELECT * FROM cm_codedetail WHERE code_type IN ('ROLE', 'POSITION');

-- 공통코드가 없다면 migration/20260120_common_code_init.sql 재실행
```

### 3. 데이터베이스 연결 오류

**원인:** `.env` 파일의 DATABASE_URL이 잘못됨

**해결:**
- Supabase Dashboard에서 Connection String 재확인
- `postgresql://` → `postgresql+asyncpg://`로 변경 확인
- 비밀번호의 특수문자 URL 인코딩 확인

### 4. Google OAuth 오류

**원인:** GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 잘못됨

**해결:**
- Google Cloud Console에서 OAuth 2.0 클라이언트 ID 확인
- Redirect URI가 정확히 `http://localhost:3000/auth/google/callback`인지 확인
