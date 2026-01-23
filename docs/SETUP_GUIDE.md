# 🚀 1on1-vntg 설치 및 실행 가이드

> **빠른 시작**: 이 문서는 로컬 개발 환경에서 1on1-vntg 프로젝트를 설치하고 실행하는 방법을 안내합니다.

---

## 📋 목차

- [사전 준비사항](#-사전-준비사항)
- [백엔드 실행](#️⃣-백엔드-실행)
- [데이터베이스 설정](#-데이터베이스-설정-supabase-postgresql-권장)
- [프론트엔드 실행](#️⃣-프론트엔드-실행)
- [실행 확인](#-실행-확인)
- [문제 해결](#-문제-해결)

---

## 📦 사전 준비사항

시작하기 전에 다음 소프트웨어를 설치하세요:

- **Python 3.12+** ([다운로드](https://www.python.org/downloads/))
- **Node.js 18+** ([다운로드](https://nodejs.org/))
- **Supabase 계정** (권장) - [무료 가입](https://supabase.com)
- 또는 **PostgreSQL** (로컬 개발) - [다운로드](https://www.postgresql.org/download/)

---

## 1️⃣ 백엔드 실행

### 1. 프로젝트 클론 및 이동

```bash
# 프로젝트 루트로 이동
cd 1on1-vntg
```

### 2. Python 가상환경 설정

```bash
# 가상환경 생성
python3 -m venv .venv

# 가상환경 활성화 (Windows)
.venv\Scripts\activate

# Windows에서 보안 오류 발생 시
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 가상환경 활성화 (macOS/Linux)
source .venv/bin/activate
```

### 3. 의존성 설치

```bash
pip install -r requirements.txt
```

### 4. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 열어 데이터베이스 연결 정보 수정
# 다음 섹션에서 자세히 설명
```

---

## 💾 데이터베이스 설정 (Supabase PostgreSQL 권장)

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

**중요**: Supabase Auth, Storage, Realtime 등 전용 기능은 사용하지 마세요.
순수 PostgreSQL 데이터베이스로만 활용하세요.

#### Step 1: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트명, 데이터베이스 비밀번호, 리전 선택
3. 프로젝트 생성 완료까지 2-3분 대기

#### Step 2: 초기 테이블 생성

1. Supabase Dashboard > SQL Editor > New query 클릭
2. 프로젝트 루트의 `supabase_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 Run 버튼 클릭
4. `connection_tests` 테이블 생성 및 초기 데이터 삽입 확인

#### Step 3: Connection String 복사 (중요!)

1. Settings > Database > Connection string 탭 이동
2. 다음 옵션 선택:
   - **Type**: URI
   - **Source**: Primary Database
   - **Method**: "Transaction pooler" (권장, 포트 6543)
3. Connection string 복사
   - 형식 예시: `postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-xx-xx.pooler.supabase.com:6543/postgres`

#### Step 4: .env 파일 설정

1. `.env` 파일 열기
2. `DATABASE_URL` 설정:
   ```bash
   # postgresql:// → postgresql+asyncpg:// 로 변경 (asyncpg 드라이버 명시)
   DATABASE_URL=postgresql+asyncpg://postgres.cafquolsrqkhpqejgojd:yourP%40ssw0rd%21@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```

3. **비밀번호 특수문자 URL 인코딩** (필수):
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`

4. **개별 변수는 주석 처리 또는 삭제**:
   ```bash
   # POSTGRES_HOST=localhost  # 주석 처리
   # POSTGRES_PORT=5432       # 주석 처리
   # DATABASE_URL이 우선순위가 높으므로 이것만 설정하면 됨
   ```

### 로컬 PostgreSQL 사용 (선택사항)

Supabase 대신 로컬 PostgreSQL을 사용하려면:

```bash
# PostgreSQL 설치 후
createdb your_database_name

# .env 파일에 설정
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/your_database_name
```

---

## 5. 백엔드 서버 실행

```bash
# 프로젝트 루트에서 실행
python -m server.main

# 실행 확인:
# → http://localhost:8000 에서 실행
# → http://localhost:8000/docs 에서 API 문서 확인
```

---

## 2️⃣ 프론트엔드 실행

### 1. 프론트엔드 디렉토리로 이동

```bash
# 새 터미널에서 실행
cd client
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev

# 실행 확인:
# → http://localhost:3000 에서 실행
# → Vite가 자동으로 백엔드 API 프록시 설정
```

---

## ✅ 실행 확인

모든 서비스가 정상적으로 실행되었는지 확인하세요:

| 서비스 | URL | 설명 |
|--------|-----|------|
| **백엔드 API** | http://localhost:8000 | FastAPI 서버 |
| **API 문서 (Swagger)** | http://localhost:8000/docs | 자동 생성된 API 문서 |
| **Health Check** | http://localhost:8000/core/health | 서버 상태 확인 |
| **Version Info** | http://localhost:8000/core/version | 버전 정보 |
| **프론트엔드** | http://localhost:3000 | React 애플리케이션 |

---

## 🛑 문제 해결

### 백엔드 에러

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| `ModuleNotFoundError` | 가상환경 미활성화 | `source .venv/bin/activate` 실행 (Linux/macOS)<br>`.\venv\Scripts\activate` 실행 (Windows) |
| `Database connection error` | PostgreSQL 미실행 또는 .env 설정 오류 | 1. Supabase 프로젝트 상태 확인<br>2. `.env`의 `DATABASE_URL` 검증<br>3. 비밀번호 특수문자 URL 인코딩 확인 |
| `Port 8000 already in use` | 포트 충돌 | 1. 기존 프로세스 종료<br>2. 또는 `.env`에서 `PORT` 변경 |
| `asyncpg.exceptions` | 데이터베이스 연결 실패 | 1. Supabase 프로젝트가 활성화되어 있는지 확인<br>2. Transaction Pooler 연결 문자열 사용 확인<br>3. 방화벽 설정 확인 |

### 프론트엔드 에러

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| `command not found: npm` | Node.js 미설치 | Node.js 설치 후 터미널 재시작 |
| `Module not found` | 의존성 미설치 | 1. `node_modules` 폴더 삭제<br>2. `npm install` 재실행 |
| `Port 3000 already in use` | 포트 충돌 | 1. 기존 Vite 서버 종료<br>2. 또는 `vite.config.ts`에서 포트 변경 |
| `ECONNREFUSED` | 백엔드 서버 미실행 | 백엔드 서버 실행 확인 (http://localhost:8000) |

### 가상환경 보안 오류 (Windows)

Windows PowerShell에서 가상환경 활성화 시 보안 오류가 발생하면:

```powershell
# PowerShell을 관리자 권한으로 실행 후
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 다시 가상환경 활성화
.venv\Scripts\activate
```

### Supabase 연결 문제

1. **프로젝트가 일시 중지된 경우**:
   - Supabase Dashboard에서 프로젝트 재활성화
   - 무료 티어는 7일 미사용 시 자동 일시 중지됨

2. **비밀번호 특수문자 문제**:
   ```bash
   # 잘못된 예시
   DATABASE_URL=postgresql+asyncpg://user:p@ssw0rd!@host/db

   # 올바른 예시 (URL 인코딩)
   DATABASE_URL=postgresql+asyncpg://user:p%40ssw0rd%21@host/db
   ```

3. **Connection Pooler vs Direct Connection**:
   - ✅ **권장**: Transaction Pooler (포트 6543) - 더 안정적
   - ❌ **비권장**: Direct Connection (포트 5432) - 연결 제한 가능

---

## 🔄 개발 워크플로우

### 일반적인 개발 흐름

1. **백엔드 서버 시작**:
   ```bash
   # 터미널 1
   source .venv/bin/activate  # 가상환경 활성화
   python -m server.main       # 서버 실행
   ```

2. **프론트엔드 서버 시작**:
   ```bash
   # 터미널 2
   cd client
   npm run dev
   ```

3. **코드 수정 후 자동 반영**:
   - 백엔드: 파일 저장 시 자동 리로드 (Uvicorn의 `--reload` 옵션)
   - 프론트엔드: 파일 저장 시 HMR (Hot Module Replacement)

4. **API 테스트**:
   - Swagger UI: http://localhost:8000/docs
   - 또는 프론트엔드에서 직접 테스트

---

## 📚 다음 단계

설치가 완료되었다면 다음 문서를 참고하세요:

- **[README.md](../README.md)**: 프로젝트 개요 및 핵심 철학
- **[docs/DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: 도메인 추가 및 개발 가이드
- **[docs/ARCHITECTURE.md](./ARCHITECTURE.md)**: 아키텍처 상세 설명
- **[.cursorrules](../.cursorrules)**: AI 코딩 규칙

---

## 📧 도움이 필요하신가요?

문제가 해결되지 않으면:

1. GitHub Issues에 문제 등록
2. 에러 메시지 전체 복사
3. 사용 중인 OS 및 버전 명시
4. `.env` 파일 내용 (비밀번호는 제외하고 공유)

---

**Happy Coding! 🎉**
