# Phase 2 통합 테스트 시나리오

**세션 관리 및 동시접속 제어 기능 검증**

> 이 문서는 Phase 2에서 구현한 세션 관리 및 동시접속 제어 기능을 테스트하기 위한 시나리오입니다.
> 개발 초보자도 쉽게 따라할 수 있도록 단계별로 작성되었습니다.

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [테스트 시나리오 1: 세션 생성 및 저장 확인](#테스트-시나리오-1-세션-생성-및-저장-확인)
3. [테스트 시나리오 2: 동시접속 감지 및 모달 표시](#테스트-시나리오-2-동시접속-감지-및-모달-표시)
4. [테스트 시나리오 3: 기존 세션 종료 후 재로그인](#테스트-시나리오-3-기존-세션-종료-후-재로그인)
5. [테스트 시나리오 4: 강제 로그아웃 (다른 기기에서 로그인)](#테스트-시나리오-4-강제-로그아웃-다른-기기에서-로그인)
6. [테스트 시나리오 5: API 직접 테스트 (Swagger)](#테스트-시나리오-5-api-직접-테스트-swagger)
7. [예상 결과 체크리스트](#예상-결과-체크리스트)

---

## 사전 준비

### 1️⃣ 서버 실행

```bash
# Backend 서버 실행
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**확인**: 터미널에 `Application startup complete.` 메시지 표시

---

### 2️⃣ 프론트엔드 실행

```bash
# Frontend 서버 실행 (새 터미널)
cd client
npm run dev
```

**확인**: 브라우저에서 `http://localhost:5173` 접속 가능

---

### 3️⃣ 테스트용 브라우저 2개 준비

- **브라우저 A**: Chrome (일반 창)
- **브라우저 B**: Chrome (시크릿 모드) 또는 Firefox

> **왜 2개가 필요한가요?**
> 동시접속을 테스트하려면 같은 계정으로 서로 다른 "디바이스"에서 로그인해야 하기 때문입니다.

---

## 테스트 시나리오 1: 세션 생성 및 저장 확인

### 🎯 목적
로그인 시 세션이 DB에 올바르게 저장되는지 확인

### 📝 단계

#### Step 1: 로그인
1. 브라우저 A에서 `http://localhost:5173` 접속
2. "Google 계정으로 계속하기" 버튼 클릭
3. Google 계정으로 로그인 완료

#### Step 2: 브라우저 개발자 도구 확인
1. `F12` 키를 눌러 개발자 도구 열기
2. **Console** 탭으로 이동
3. 다음과 같은 로그 확인:
   ```
   ✅ Google 로그인 성공 - 전체 응답: { ... }
   📋 사용자 정보: { user_id: "...", email: "...", ... }
   🔑 JWT 토큰: eyJ...
   ```

#### Step 3: DB에서 세션 확인 (Supabase)
1. Supabase 대시보드 접속
2. **Table Editor** → **refresh_token** 테이블 선택
3. 최신 레코드 확인:
   - ✅ `user_id`: 로그인한 사용자 ID
   - ✅ `device_info`: User-Agent 정보 (예: Chrome/131.0.0.0)
   - ✅ `ip_address`: 로그인 IP 주소
   - ✅ `last_activity_at`: 현재 시간
   - ✅ `revoked_yn`: 'N'

### ✅ 예상 결과
- 로그인 성공 후 세션이 DB에 저장됨
- device_info와 ip_address가 올바르게 기록됨
- revoked_yn이 'N'으로 설정됨

---

## 테스트 시나리오 2: 동시접속 감지 및 모달 표시

### 🎯 목적
같은 계정으로 다른 브라우저에서 로그인 시도 시 동시접속 모달이 표시되는지 확인

### 📝 단계

#### Step 1: 브라우저 A에서 로그인 상태 유지
- 이전 시나리오에서 로그인한 상태 그대로 유지

#### Step 2: 브라우저 B에서 로그인 시도
1. **브라우저 B** (시크릿 모드 또는 다른 브라우저) 실행
2. `http://localhost:5173` 접속
3. "Google 계정으로 계속하기" 클릭
4. **같은 Google 계정**으로 로그인

#### Step 3: 동시접속 모달 확인
모달이 자동으로 표시되어야 합니다:

```
┌─────────────────────────────────────────────┐
│  다른 기기에서 로그인 중입니다                │
│                                               │
│  이미 다른 곳에서 로그인되어 있습니다.        │
│  계속 진행하시면 기존 세션이 종료됩니다.      │
│                                               │
│  ┌───────────────────────────────────┐      │
│  │  기존 세션 정보                    │      │
│  │  💻 디바이스: Chrome 브라우저      │      │
│  │  🕐 로그인 시간: 2026년 01월 23일  │      │
│  │  📍 IP 주소: 127.0.0.1            │      │
│  └───────────────────────────────────┘      │
│                                               │
│  [취소]  [기존 세션 종료하고 로그인]         │
└─────────────────────────────────────────────┘
```

#### Step 4: 개발자 도구에서 로그 확인
```
🔒 기존 활성 세션 감지: { device_info: "...", ip_address: "...", ... }
```

### ✅ 예상 결과
- 모달이 자동으로 표시됨
- 기존 세션 정보(디바이스, 로그인 시간, IP)가 올바르게 표시됨
- 토큰이 아직 발급되지 않음 (로그인 보류 상태)

---

## 테스트 시나리오 3: 기존 세션 종료 후 재로그인

### 🎯 목적
"기존 세션 종료하고 로그인" 버튼을 눌렀을 때 올바르게 재로그인되는지 확인

### 📝 단계

#### Step 1: 모달에서 "기존 세션 종료하고 로그인" 클릭
- 이전 시나리오에서 표시된 모달에서 버튼 클릭

#### Step 2: 개발자 도구에서 로그 확인
다음과 같은 순서로 로그가 표시되어야 합니다:
```
🔄 기존 세션 폐기 시작: user_xxx
✅ 기존 세션 폐기 완료: 1개의 세션이 폐기되었습니다
🔄 재로그인 시도
✅ 강제 로그인 성공: { ... }
```

#### Step 3: 로그인 성공 확인
1. 브라우저 B에서 대시보드 화면으로 이동
2. 우측 상단에 사용자 이름 표시 확인

#### Step 4: DB에서 세션 상태 확인 (Supabase)
1. **refresh_token** 테이블 조회
2. 기존 세션(브라우저 A):
   - ✅ `revoked_yn`: **'Y'** (폐기됨)
3. 새 세션(브라우저 B):
   - ✅ `revoked_yn`: **'N'** (활성)
   - ✅ `device_info`: 브라우저 B의 User-Agent
   - ✅ `ip_address`: 브라우저 B의 IP

### ✅ 예상 결과
- 기존 세션이 폐기됨 (revoked_yn = 'Y')
- 새 세션이 생성되어 정상 로그인됨
- 브라우저 B에서 대시보드 접근 가능

---

## 테스트 시나리오 4: 강제 로그아웃 (다른 기기에서 로그인)

### 🎯 목적
다른 기기에서 로그인 시 기존 기기에서 자동 로그아웃되는지 확인

### 📝 단계

#### Step 1: 브라우저 A로 돌아가기
- 이전 시나리오에서 세션이 폐기된 브라우저 A로 이동
- 아직 대시보드 화면이 보일 것입니다 (화면만 남아있음)

#### Step 2: 브라우저 A에서 API 호출 시도
1. 대시보드 화면에서 아무 메뉴 클릭 (예: 메뉴 관리)
2. 또는 `F5` 키로 새로고침

#### Step 3: Toast 알림 확인
우측 하단에 다음과 같은 Toast 메시지가 표시되어야 합니다:

```
┌────────────────────────────────────────┐
│ ⚠️ 다른 기기에서 로그인하여 현재      │
│    세션이 종료되었습니다              │
└────────────────────────────────────────┘
```

#### Step 4: 자동 리다이렉트 확인
- 2초 후 자동으로 로그인 페이지(`/`)로 이동
- localStorage에서 토큰 삭제 확인:
  ```javascript
  // 개발자 도구 Console에서 실행
  localStorage.getItem('access_token')
  // 결과: null
  ```

### ✅ 예상 결과
- API 호출 시 401 Unauthorized 에러 발생
- Toast 메시지: "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
- 2초 후 자동으로 로그인 페이지로 이동
- localStorage에서 토큰 삭제됨

---

## 테스트 시나리오 5: API 직접 테스트 (Swagger)

### 🎯 목적
세션 관리 API가 올바르게 동작하는지 Swagger UI에서 직접 테스트

### 📝 Swagger UI 접속

1. 브라우저에서 `http://localhost:8000/docs` 접속
2. Swagger UI 화면 확인

---

### 🔹 Test 1: 활성 세션 확인 API

#### Step 1: API 찾기
- **POST** `/api/v1/auth/check-active-session` 찾기
- "Try it out" 버튼 클릭

#### Step 2: Request Body 입력
```json
{
  "user_id": "YOUR_USER_ID_HERE"
}
```

> **user_id 찾는 방법**:
> 1. Supabase → **user** 테이블 → `user_id` 복사
> 2. 또는 로그인 후 개발자 도구 Console에서 확인

#### Step 3: 실행
- "Execute" 버튼 클릭

#### Step 4: 응답 확인
**활성 세션이 있는 경우:**
```json
{
  "has_active_session": true,
  "session_info": {
    "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "ip_address": "127.0.0.1",
    "created_at": "2026-01-23T10:30:00",
    "last_activity_at": "2026-01-23T10:35:00"
  }
}
```

**활성 세션이 없는 경우:**
```json
{
  "has_active_session": false,
  "session_info": null
}
```

---

### 🔹 Test 2: 세션 폐기 API

#### Step 1: API 찾기
- **POST** `/api/v1/auth/revoke-session` 찾기
- "Try it out" 버튼 클릭

#### Step 2: Request Body 입력
```json
{
  "user_id": "YOUR_USER_ID_HERE",
  "revoke_previous": true
}
```

#### Step 3: 실행
- "Execute" 버튼 클릭

#### Step 4: 응답 확인
```json
{
  "success": true,
  "message": "1개의 세션이 폐기되었습니다"
}
```

#### Step 5: DB에서 확인
1. Supabase → **refresh_token** 테이블
2. 해당 user_id의 모든 레코드가 `revoked_yn = 'Y'`로 변경됨

---

### 🔹 Test 3: 현재 사용자 정보 조회 (인증 테스트)

#### Step 1: 로그인하여 토큰 획득
1. 브라우저에서 로그인
2. 개발자 도구 → Application → Local Storage → `access_token` 복사

#### Step 2: Swagger에서 Authorize 설정
1. Swagger UI 우측 상단 **"Authorize"** 버튼 클릭
2. 팝업창에서 다음 형식으로 입력:
   ```
   Bearer YOUR_ACCESS_TOKEN_HERE
   ```
3. "Authorize" 클릭 후 "Close"

#### Step 3: API 찾기
- **GET** `/api/v1/auth/me` 찾기
- "Try it out" 버튼 클릭

#### Step 4: 실행
- "Execute" 버튼 클릭

#### Step 5: 응답 확인
**성공 (200):**
```json
{
  "user_id": "user_xxx",
  "email": "your@email.com",
  "name": "홍길동",
  "message": "인증 성공"
}
```

**실패 (401) - 세션이 폐기된 경우:**
```json
{
  "detail": {
    "error_code": "SESSION_REVOKED",
    "message": "다른 곳에서 로그인하여 세션이 종료되었습니다"
  }
}
```

---

## 예상 결과 체크리스트

### ✅ 세션 생성 및 저장
- [ ] 로그인 시 refresh_token 테이블에 레코드 생성
- [ ] device_info에 User-Agent 저장
- [ ] ip_address에 로그인 IP 저장
- [ ] last_activity_at에 현재 시간 저장
- [ ] revoked_yn = 'N' 설정

### ✅ 동시접속 감지
- [ ] 같은 계정으로 다른 브라우저 로그인 시 모달 표시
- [ ] 모달에 기존 세션 정보 표시 (디바이스, 시간, IP)
- [ ] 토큰이 발급되지 않음 (로그인 보류)

### ✅ 기존 세션 종료 후 재로그인
- [ ] "기존 세션 종료하고 로그인" 클릭 시 revoke API 호출
- [ ] 기존 세션의 revoked_yn = 'Y'로 변경
- [ ] 새 세션 생성 및 로그인 성공
- [ ] 대시보드로 정상 이동

### ✅ 강제 로그아웃
- [ ] 브라우저 A에서 API 호출 시 401 에러
- [ ] Toast 메시지: "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
- [ ] 2초 후 로그인 페이지로 자동 이동
- [ ] localStorage에서 토큰 삭제

### ✅ API 동작
- [ ] `/auth/check-active-session`: 활성 세션 올바르게 반환
- [ ] `/auth/revoke-session`: 세션 폐기 성공
- [ ] `/auth/me`: 유효한 토큰으로 사용자 정보 조회 성공
- [ ] `/auth/me`: 폐기된 세션으로 호출 시 SESSION_REVOKED 에러

---

## 🐛 문제 발생 시 체크리스트

### 모달이 표시되지 않는 경우
1. **백엔드 로그 확인**:
   ```bash
   # server 터미널에서 확인
   # "활성 세션 발견" 로그가 있는지 확인
   ```
2. **프론트엔드 Console 확인**:
   ```
   🔒 기존 활성 세션 감지: ...
   ```
   이 로그가 없으면 백엔드 응답 확인

3. **API 응답 확인**:
   - 개발자 도구 → Network 탭
   - `/auth/google/callback` 요청 확인
   - Response에 `has_active_session: true` 있는지 확인

### Toast 알림이 표시되지 않는 경우
1. **App.tsx에 ToastContainer 있는지 확인**:
   ```tsx
   // client/src/App.tsx
   import { ToastContainer } from '@/core/ui/Toast';

   // return 문 내부에
   <ToastContainer />
   ```

2. **에러 응답 형식 확인**:
   - 개발자 도구 → Network → 401 에러 응답 확인
   - `detail.error_code`가 `"SESSION_REVOKED"`인지 확인

### 재로그인이 실패하는 경우
1. **세션 폐기 확인**:
   - DB에서 revoked_yn = 'Y'인지 확인
2. **OAuth code 재사용 확인**:
   - Google OAuth code는 1회용입니다
   - 새로 로그인을 시도해야 합니다

---

## 📞 추가 지원

테스트 중 문제가 발생하면 다음을 확인하세요:
1. **서버 로그**: `server` 터미널에서 에러 메시지 확인
2. **브라우저 Console**: F12 → Console 탭에서 에러 확인
3. **Network 탭**: API 요청/응답 상세 확인
4. **DB 상태**: Supabase에서 실제 데이터 확인

---

**작성일**: 2026-01-23
**작성자**: Claude AI
**버전**: Phase 2 (세션 관리 및 동시접속 제어)
