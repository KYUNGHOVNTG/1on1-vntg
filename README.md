# 🚀 AI 바이브코딩 환경 웹 서비스 템플릿

> **"유지보수성 최우선" 및 "모듈화"를 핵심 가치로 하는 바이브 코딩(Vibe Coding) 환경**

빠른 시작을 위한 FastAPI + SQLAlchemy 2.0 + React 19 + Tailwind 4 기반의 풀스택 웹 애플리케이션

---

## 📖 목차

- [프로젝트 비전](#-프로젝트-비전)
- [핵심 철학](#-핵심-철학)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [빠른 시작](#-빠른-시작)
- [도메인 추가하기](#-도메인-추가하기)
- [문서](#-문서)

---

## 🎯 프로젝트 비전

이 프로젝트는 **확장 가능하고 유지보수하기 쉬운 AI 바이브코딩 기반 웹 서비스**를 위한 생산급(Production-Ready) 풀스택 템플릿입니다.

### 왜 이 템플릿인가?

- **도메인 플러그인 구조**: 새로운 비즈니스 도메인을 독립적으로 추가 가능 (충돌 최소화)
- **계층화된 아키텍처**: 명확한 책임 분리로 테스트 가능하고 유지보수 쉬움
- **타입 안전성**: Pydantic v2 + SQLAlchemy 2.0 + TypeScript로 런타임 에러 최소화
- **비동기 최적화**: async/await 기반으로 높은 처리량 보장
- **모던 기술 스택**: React 19, Tailwind 4, Zustand 등 최신 기술 적용
- **운영 준비 완료**: Request ID 로깅, Health Check, 전역 에러/로딩 처리 내장

---

## 💡 핵심 철학

1. **유지보수성 최우선**: 계층화된 아키텍처, 단일 책임 원칙, 클래스 기반 설계
2. **모듈화 & 도메인 독립성**: 자체 완결적 도메인 구조, 병렬 개발 가능
3. **타입 안전성**: Pydantic + TypeScript로 런타임/컴파일 타임 에러 방지
4. **테스트 가능성**: 의존성 주입, 순수 함수/Side Effect 분리

자세한 내용은 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)를 참조하세요.

---

## 🏗️ 기술 스택

**백엔드**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL + Pydantic v2 + JWT 인증
**프론트엔드**: React 19 + TypeScript + Vite + Tailwind 4 + Zustand
**DevOps**: pytest + black/ruff + mypy + Alembic

자세한 기술 스택과 버전 정보는 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)를 참조하세요.

---

## 📂 프로젝트 구조

```
1on1-vntg/
├── 📁 server/                   # 백엔드 (FastAPI)
│   └── app/
│       ├── core/                # 핵심 인프라 (DB, Auth, Logging)
│       ├── shared/              # 공유 컴포넌트 (Base 클래스, 예외)
│       ├── domain/              # 🎯 비즈니스 도메인 (여기에 새 기능 추가!)
│       └── api/v1/              # API 엔드포인트
│
├── 📁 client/                   # 프론트엔드 (React + Vite)
│   └── src/
│       ├── core/                # 핵심 유틸리티 (API, Layout, UI)
│       └── domains/             # 🎯 도메인별 기능 (백엔드 미러링)
│
├── 📁 docs/                     # 프로젝트 문서
└── 📁 tests/                    # 테스트 (Unit + Integration)
```

자세한 폴더 구조와 각 파일의 역할은 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)를 참조하세요.

---

## 🚀 빠른 시작

```bash
# 1. 백엔드 실행
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # DATABASE_URL 설정 필요
python -m server.main      # → http://localhost:8000

# 2. 프론트엔드 실행 (새 터미널)
cd client
npm install
npm run dev                # → http://localhost:3000
```

### 💾 데이터베이스 설정

- ✅ **권장**: Supabase를 PostgreSQL 데이터베이스로 활용 ([무료 가입](https://supabase.com))
- ❌ **금지**: Supabase 전용 기능 (Auth, Storage, Realtime 등)
- 📌 **이유**: 향후 순수 PostgreSQL로 쉬운 이관

**자세한 설치 가이드는 [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)를 참조하세요.**

---

## 🎯 도메인 추가하기

새로운 비즈니스 기능을 추가하는 표준 절차:

### 백엔드 (예: payment 도메인)

```bash
mkdir -p server/app/domain/payment/{models,schemas,repositories,calculators,formatters}
```

1. `models/` - SQLAlchemy DB 모델
2. `schemas/` - Pydantic Request/Response
3. `repositories/` - 데이터 조회 (BaseRepository 상속)
4. `calculators/` - 비즈니스 로직 (BaseCalculator 상속)
5. `formatters/` - 응답 포맷팅 (BaseFormatter 상속)
6. `service.py` - 도메인 서비스 (BaseService 상속)
7. `api/v1/endpoints/payment.py` - FastAPI 라우터
8. `api/v1/router.py`에 라우터 등록

### 프론트엔드

```bash
mkdir -p client/src/domains/payment/{components,pages}
```

1. `types.ts` - TypeScript 타입
2. `api.ts` - API 호출 함수
3. `store.ts` - Zustand 상태 관리
4. `components/` - UI 컴포넌트
5. `pages/` - 페이지 컴포넌트
6. 라우터에 페이지 등록

**상세한 체크리스트와 예제 코드는 [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)를 참조하세요.**

---

## 📚 개발 가이드

### 코드 품질 & 테스트

```bash
# 포맷팅: black + isort / 린팅: ruff / 타입 체크: mypy
black server/ && isort server/ && ruff check server/ && mypy server/

# 테스트
pytest                          # 전체 테스트
pytest --cov=server             # 커버리지 포함

# DB 마이그레이션
alembic revision --autogenerate -m "message"  # 생성
alembic upgrade head                          # 적용
```

자세한 개발 가이드와 체크리스트는 [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)를 참조하세요.

---

## 📖 문서

| 문서 | 설명 |
|------|------|
| **[docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** | 설치 및 실행 가이드 (환경 설정, DB 설정, 문제 해결) |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | 아키텍처 상세 설명 (디자인 패턴, 계층 구조, 예외 처리) |
| **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** | 개발 가이드 (도메인 추가 체크리스트, 코드 리뷰 기준) |
| **[docs/PROJECT_HANDOVER.md](./docs/PROJECT_HANDOVER.md)** | AI 개발자 인수인계 문서 |
| **[docs/TEST_GUIDE.md](./docs/TEST_GUIDE.md)** | 테스트 작성 가이드 |
| **[.cursorrules](./.cursorrules)** | Cursor/Claude AI 에이전트 코딩 규칙 |
| **[server/README.md](./server/README.md)** | 백엔드 개발 가이드 |
| **[client/README.md](./client/README.md)** | 프론트엔드 개발 가이드 |

---

**Happy Vibe Coding! 🎉**
