# 1on1 코칭 AI 시스템 — 전체 개발 로드맵

> 작성일: 2026-03-04
> 설계 버전: v7.1 (점검 반영)
> 최종 수정일: 2026-03-04
> 변경 내역: 기능/설계 점검 결과 반영 — CRITICAL 5건 수정, MAJOR 6건·MINOR 7건 베타 타협안 적용

---

## 📌 사전 확정 결정사항 (설계 점검 결과)

| 항목 | 결정 |
|------|------|
| C-1 일시정지 타임스탬프 불일치 | **Pause 기능 제거** — 녹음은 중단 없이 진행 |
| C-2 Agenda 출처 구분 | **source 컬럼 추가** (MEMBER_PRESET / AI_SUGGESTED / LEADER_ADDED) |
| C-3 액션아이템 이월 방식 | **B안(복사)** — 미팅 시작 시 미완료 항목을 현재 미팅에 INSERT |
| H-1 REQUESTED 상태 취소 | **레코드 삭제** — 사전준비 모달 취소 시 meeting 레코드 DELETE |
| H-2 leader_speaker_label | **필드 제거** — STT JSON 내 화자 라벨 포함으로 대체 |
| H-3 N-1/N-2 브리핑 범위 | **미완료 Action Item만** 로드 (AI 요약 제외) |
| H-4 조직원 사전 아젠다 | **v1 제외** — 항상 빈 배열, 화면에 안내 문구만 표시 |
| H-5 actual_duration_seconds | **실제 녹음 길이** (오디오 파일 duration 기준) |
| M-4 팀원/리더 구분 | **position_code 기준** — P001~P004=리더, P005=멤버 (대시보드 필터: `== 'P005'` 사용) |

---

## 🔧 v7.1 수정 내역 (2026-03-04 점검 반영)

| 항목 | 수정 내용 |
|------|---------|
| V-1 assignee 누락 | `TbMeetingActionItem.assignee` 컬럼 추가, `ActionItemReport` 스키마 반영 |
| V-2 position_code 오류 | Task 3 필터 `!= 'P004'` → `== 'P005'` 수정 |
| V-3 /start 바디 누락 | `MeetingStartRequest` (agendas 목록) 스키마 추가 |
| V-4 Whisper 25MB 한도 | 오디오 청크 분할 전략 추가 (10분 단위 분할 → 병합) |
| V-5 alembic env.py | Task 1 체크리스트에 coaching 모델 import 단계 명시 |
| V-6 /timelines 중복 | Task 5/7 동일 엔드포인트 통합 (`end_time?`, `segment_summary?` Optional 통합) |
| V-7 MediaRecorder store | Zustand에서 제거 → `useRef`로 관리 명시, `activeRrId` 추가 |
| V-8 업로드 진행률 | `fetch` → `XMLHttpRequest.upload.onprogress` 명시 |
| V-9 LLM 동기 지연 | 15초 타임아웃 + fallback 빈 배열 (베타 타협) |
| V-10 PROCESSING 고착 | scheduler.py 활용 30분 초과 시 FAILED 전환 (베타 타협) |
| V-11 UPSERT 미명세 | Task 6에 TbCoachingRelation UPSERT 패턴 명시 |
| V-12 구간 매칭 버그 | `seg['end'] <=` → `seg['start'] <` 경계 조건 수정 |
| V-13 이월 범위 | N-1/N-2 제한 명확화, assignee 복사 명시 |
| V-14 GCS CORS | cors.json 설정 예시 추가 |
| V-15 필터 혼용 | 서버 재조회 시 카드 필터 초기화 명시 |
| V-16 메뉴 등록 누락 | Task 15에 cm_menu 마이그레이션 항목 추가 |
| V-17 audio_url 중복 | Report 응답에서 audio_url 제거, 별도 endpoint 사용 통일 |

---

## 🗂️ 시스템 전체 구조

```
1on1 코칭 AI 시스템
├── Dashboard           대시보드 (면담 현황 요약 + 팀원 목록)
├── Pre-meeting Modal   사전 준비 모달 (아젠다 구성 + 이전 미팅 브리핑)
├── Active Meeting      미팅 실행 화면 (녹음 + 실시간 타임라인 + AI 추천)
├── Post-meeting Upload 종료 후 GCS 업로드 + AI 파이프라인 트리거
└── History / Bento     히스토리 목록 + 상세 리포트 (Bento Grid)
```

---

## 🏗️ 기술 스택 (추가 사항)

| 구분 | 기술 |
|------|------|
| 음성 녹음 | Web MediaRecorder API (webm format) |
| STT | OpenAI Whisper API |
| LLM | OpenAI GPT-4o (화자 분리, 요약, Action Item 추출, 질문 추천) |
| 파일 스토리지 | Google Cloud Storage (Private Bucket) |
| GCS 업로드 | Presigned URL (프론트엔드 직접 업로드) |
| 임시 저장 | IndexedDB (10초 주기) + localStorage (beforeunload) |
| 비동기 처리 | BackgroundTasks (FastAPI) 또는 별도 Worker |

---

## 📊 최종 확정 데이터 모델

> 설계서 v7.0 기반 + 결정사항 반영

### SQLAlchemy 모델 전체 코드

```python
# server/app/domain/coaching/models/__init__.py

from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey,
    Integer, Boolean, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from server.app.core.database import Base


class TbCoachingRelation(Base):
    """코칭 관계 및 캐싱 테이블"""
    __tablename__ = 'tb_coaching_relation'

    relation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    leader_emp_no = Column(String(20), nullable=False)
    member_emp_no = Column(String(20), nullable=False)
    last_meeting_id = Column(UUID(as_uuid=True), ForeignKey('tb_meeting.meeting_id'), nullable=True)
    last_meeting_date = Column(DateTime, nullable=True)
    total_meeting_count = Column(Integer, default=0, nullable=False)
    up_date = Column(DateTime, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('leader_emp_no', 'member_emp_no', name='uq_coaching_relation'),
    )


class TbMeeting(Base):
    """미팅 마스터 테이블"""
    __tablename__ = 'tb_meeting'

    meeting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    leader_emp_no = Column(String(20), nullable=False)
    member_emp_no = Column(String(20), nullable=False)
    # REQUESTED: 사전준비 모달 열림
    # IN_PROGRESS: 녹음 중
    # PROCESSING: GCS 업로드 완료, AI 파이프라인 처리 중
    # COMPLETED: 모든 처리 완료
    # FAILED: AI 파이프라인 실패
    status = Column(String(20), default='REQUESTED', nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    actual_duration_seconds = Column(Integer, default=0, nullable=False)  # 실제 녹음 길이(초)
    private_memo = Column(Text, nullable=True)  # 리더 전용 비공개 메모
    in_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    agendas = relationship('TbMeetingAgenda', back_populates='meeting', cascade='all, delete-orphan')
    action_items = relationship('TbMeetingActionItem', back_populates='meeting', cascade='all, delete-orphan')
    timelines = relationship('TbMeetingTimeline', back_populates='meeting', cascade='all, delete-orphan')
    record = relationship('TbMeetingRecord', back_populates='meeting', uselist=False, cascade='all, delete-orphan')


class TbMeetingAgenda(Base):
    """아젠다 테이블 (v1: MEMBER_PRESET 항상 빈 배열)"""
    __tablename__ = 'tb_meeting_agenda'

    agenda_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('tb_meeting.meeting_id'), nullable=False)
    content = Column(String(1000), nullable=False)
    source = Column(String(20), nullable=False)
    # MEMBER_PRESET: 조직원 사전 작성 (v1 미사용, 항상 빈 배열)
    # AI_SUGGESTED: AI 추천 질문
    # LEADER_ADDED: 리더 즉석 추가
    order = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)

    meeting = relationship('TbMeeting', back_populates='agendas')


class TbMeetingActionItem(Base):
    """Action Item (To-Do) 테이블"""
    __tablename__ = 'tb_meeting_action_item'

    action_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('tb_meeting.meeting_id'), nullable=False)
    origin_meeting_id = Column(UUID(as_uuid=True), nullable=True)  # 이월 원본 미팅 ID
    is_carried_over = Column(Boolean, default=False, nullable=False)  # True: 이월 항목
    content = Column(Text, nullable=False)
    assignee = Column(String(10), nullable=True)  # 'LEADER' | 'MEMBER' | None (AI 추출 시 설정, 이월 항목은 origin 값 복사)
    is_completed = Column(Boolean, default=False, nullable=False)

    meeting = relationship('TbMeeting', back_populates='action_items')


class TbMeetingRecord(Base):
    """녹음 및 AI 분석 결과 테이블"""
    __tablename__ = 'tb_meeting_record'

    record_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('tb_meeting.meeting_id'), unique=True, nullable=False)
    audio_file_url = Column(String(500), nullable=True)
    # GCS 경로: meetings/{leader_emp_no}/{meeting_id}/original_audio.webm
    stt_transcript = Column(JSONB, nullable=True)
    # STT 결과 구조:
    # [{ "start": 0.0, "end": 5.2, "text": "...", "speaker": "LEADER" | "MEMBER" }, ...]
    ai_summary = Column(Text, nullable=True)

    meeting = relationship('TbMeeting', back_populates='record')


class TbMeetingTimeline(Base):
    """실시간 타임라인 기록 테이블"""
    __tablename__ = 'tb_meeting_timeline'

    timeline_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey('tb_meeting.meeting_id'), nullable=False)
    rr_id = Column(UUID(as_uuid=True), ForeignKey('tb_rr.rr_id'), nullable=True)
    start_time = Column(Integer, nullable=False)   # 녹음 시작 기준 상대 시간(초)
    end_time = Column(Integer, nullable=True)       # 미팅 종료 시 마지막 카드 자동 마감
    segment_summary = Column(Text, nullable=True)   # AI가 채워주는 구간 요약

    meeting = relationship('TbMeeting', back_populates='timelines')
```

### STT JSON 구조 (stt_transcript)

```json
[
  {
    "start": 0.0,
    "end": 5.2,
    "text": "안녕하세요, 오늘 미팅 시작하겠습니다.",
    "speaker": "LEADER"
  },
  {
    "start": 5.5,
    "end": 12.0,
    "text": "네, 잘 부탁드립니다.",
    "speaker": "MEMBER"
  }
]
```

---

## 🗺️ 전체 개발 로드맵

```
Phase 0: 인프라 세팅          (Task 1-2)
Phase 1: Backend API 개발     (Task 3-7)
Phase 2: Frontend 개발        (Task 8-12)
Phase 3: AI 파이프라인         (Task 13-14)
Phase 4: 통합 테스트 & 마무리  (Task 15)
```

---

## ✅ 상세 Task 목록

---

### PHASE 0: 인프라 세팅

---

#### Task 1 — DB 모델 생성 + Alembic 마이그레이션

**작업 내용:**
- `server/app/domain/coaching/models/__init__.py` 생성 (위 모델 코드 그대로)
- `server/app/domain/coaching/__init__.py` 생성
- Alembic autogenerate 실행
- `alembic upgrade head` 실행

**파일 구조:**
```
server/app/domain/coaching/
├── __init__.py
├── models/
│   └── __init__.py   ← 위 5개 테이블 모델
├── schemas/
│   └── __init__.py
├── repositories/
│   └── __init__.py
├── calculators/
│   └── __init__.py
├── formatters/
│   └── __init__.py
└── service.py
```

**명령어:**
```bash
# 1. alembic/env.py에 coaching 모델 import 추가 (autogenerate 감지용)
# target_metadata = Base.metadata 위에 아래 import 삽입:
# from server.app.domain.coaching.models import (
#     TbCoachingRelation, TbMeeting, TbMeetingAgenda,
#     TbMeetingActionItem, TbMeetingRecord, TbMeetingTimeline
# )

# 2. 마이그레이션 생성 + 적용
alembic revision --autogenerate -m "coaching_ai 도메인 테이블 생성"
alembic upgrade head
```

**예외처리 체크:**
- [ ] **`alembic/env.py`에 coaching 모델 import 추가** — 빠뜨리면 autogenerate가 새 테이블을 감지 못함
- [ ] `tb_rr` 테이블이 이미 존재하므로 FK만 참조, 테이블 재생성 금지
- [ ] `Base` import 경로 확인: `from server.app.core.database import Base`
- [ ] UUID primary key에 `default=uuid.uuid4` (callable, 괄호 없음)
- [ ] 마이그레이션 파일에 `downgrade()` 함수 필수 (DROP TABLE 역순: timelines → record → action_items → agendas → meeting → coaching_relation)
- [ ] `TbCoachingRelation` → `TbMeeting` FK 순서 주의: upgrade 시 `tb_meeting` 먼저 생성, downgrade 시 `tb_coaching_relation` 먼저 DROP

**테스트 방법:**
```bash
# 테이블 생성 확인
python -c "
from server.app.core.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
coaching_tables = [t for t in tables if 'tb_meeting' in t or 'tb_coaching' in t]
print(coaching_tables)
"
```

---

#### Task 2 — GCS 연동 모듈 + 환경변수 세팅

**작업 내용:**
- `server/app/core/storage/gcs.py` 생성 (GCS 클라이언트 싱글톤)
- `.env`에 GCS 환경변수 추가
- Presigned URL 생성 함수 구현

**구현 파일:** `server/app/core/storage/gcs.py`

```python
# 핵심 함수 시그니처
async def generate_upload_presigned_url(
    leader_emp_no: str,
    meeting_id: str,
    expiration_seconds: int = 3600
) -> str:
    """GCS Presigned Upload URL 생성"""
    # 경로: meetings/{leader_emp_no}/{meeting_id}/original_audio.webm
    ...

async def generate_download_presigned_url(
    gcs_path: str,
    expiration_seconds: int = 3600
) -> str:
    """GCS Presigned Download URL 생성 (오디오 재생용)"""
    ...
```

**환경변수 (.env):**
```
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
OPENAI_API_KEY=sk-...
```

**GCS 버킷 CORS 설정 (cors.json):**
```json
[
  {
    "origin": ["http://localhost:5173", "https://your-production-domain.com"],
    "method": ["PUT", "GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```
```bash
# 적용 명령어
gcloud storage buckets update gs://{BUCKET_NAME} --cors-file=cors.json
```

**예외처리 체크:**
- [ ] GCS 서비스 계정 JSON 파일 경로 누락 시 명확한 에러 메시지
- [ ] Presigned URL 만료 시간 기본값 1시간 (대용량 파일 업로드 고려)
- [ ] CORS 설정 적용 확인 (미설정 시 프론트엔드 직접 업로드 시 CORS 에러로 전면 차단됨)

---

### PHASE 1: Backend API 개발

---

#### Task 3 — 대시보드 API

**엔드포인트:**
```
GET /v1/coaching/dashboard
    → 리더의 팀원 목록 + 면담 현황 통계
    쿼리 파라미터: dept_code(optional), search_name(optional)
```

**비즈니스 로직:**
1. 현재 로그인 유저의 `emp_no` 확인
2. `hr_mgnt` 테이블에서 같은 `dept_code` 내 `position_code == 'P005'` (팀원만) + `on_work_yn == 'Y'` 조회
   - **주의**: P001~P004는 모두 조직장 코드이므로 제외. `!= 'P004'`가 아닌 `== 'P005'` 조건 사용 필수
3. 각 팀원별 `TbCoachingRelation` LEFT JOIN → `last_meeting_date`, `total_meeting_count` (없으면 NULL/0)
4. 면담 상태 계산:
   - `last_meeting_date IS NULL`: 미실시
   - `last_meeting_date < 현재 - 2개월`: 2개월 초과 지연 (경고색)
   - `last_meeting_date < 현재 - 1개월`: 1개월 도래
   - 나머지: 정상

**응답 구조:**
```python
class DashboardResponse(BaseModel):
    summary: DashboardSummary          # 상단 카드 집계
    items: list[DashboardMemberItem]   # 팀원 리스트
    total: int

class DashboardSummary(BaseModel):
    requested_count: int      # 면담 요청 (미실시)
    overdue_2month: int       # 2개월 초과 지연
    due_1month: int           # 1개월 도래
    normal_count: int         # 정상

class DashboardMemberItem(BaseModel):
    emp_no: str
    emp_name: str
    dept_name: str
    last_meeting_date: datetime | None
    total_meeting_count: int
    meeting_status: str       # 'NOT_STARTED' | 'OVERDUE_2M' | 'DUE_1M' | 'NORMAL'
```

**예외처리 체크:**
- [ ] `position_code == 'P005'` AND `on_work_yn == 'Y'` 조건 필수 (P001~P004 조직장 코드 전체 제외)
- [ ] `TbCoachingRelation`이 없는 팀원 → `last_meeting_date=None`, `total_meeting_count=0` (LEFT JOIN)
- [ ] 검색어 2자 미만 시 전체 조회
- [ ] 리더 자신이 목록에 포함되지 않도록 `emp_no != current_user.emp_no` 조건 추가

**테스트 방법:**
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8000/api/v1/coaching/dashboard"

# 기대: items에 팀원 목록, summary에 집계 수치
# 체크: leader 본인은 목록에 없어야 함
# 체크: dept_code 필터 작동 여부
```

---

#### Task 4 — 사전 준비 모달 API (Pre-meeting)

**엔드포인트:**
```
POST /v1/coaching/meetings
     → 미팅 레코드 생성 (status=REQUESTED)
     body: { member_emp_no }

GET  /v1/coaching/meetings/{meeting_id}/pre-meeting
     → 사전 준비 데이터 로드

DELETE /v1/coaching/meetings/{meeting_id}
       → 모달 취소 시 REQUESTED 상태 미팅 삭제
```

**GET pre-meeting 응답 구조:**
```python
class PreMeetingResponse(BaseModel):
    meeting_id: str
    member_info: MemberInfo
    is_first_meeting: bool
    # is_first_meeting = True: AI 온보딩 체크리스트 + 아이스브레이킹 질문
    # is_first_meeting = False: 이전 미팅 미완료 Action Items
    previous_action_items: list[ActionItemBrief]  # 미완료 항목 (N-1, N-2 미팅)
    ai_suggested_agendas: list[str]               # AI 추천 질문 (LLM 호출)
    member_preset_agendas: list[str]              # v1: 항상 빈 배열 []
```

**비즈니스 로직 (GET):**
1. `TbMeeting` 중 해당 leader-member 쌍의 이전 COMPLETED 미팅 조회 (최신 2건)
2. 이전 미팅에서 `is_completed=False`인 Action Item 수집
3. LLM 호출: member의 R&R + 이전 요약(있으면) → AI 추천 질문 3~5개 생성
4. 첫 미팅 여부: COMPLETED 미팅이 0건이면 `is_first_meeting=True`

**베타 타협 — LLM 응답 지연 처리:**
- `GET /pre-meeting` 호출 시 LLM을 동기로 호출하나, 타임아웃 15초 후 빈 배열 fallback
- 프론트엔드: `ai_suggested_agendas`가 빈 배열이면 "AI 추천 질문을 불러오는 중..." skeleton → 모달 자체는 즉시 표시
- 베타 10명 규모에서는 동기 방식 허용 (비동기 분리는 실서비스 고도화 시 대응)

**예외처리 체크:**
- [ ] `DELETE` 시 status가 `REQUESTED`가 아닌 경우 삭제 거부 (이미 시작된 미팅 보호)
- [ ] LLM 타임아웃 15초 설정 → 초과 시 `ai_suggested_agendas: []` fallback (모달은 정상 오픈)
- [ ] N-1, N-2 미팅이 PROCESSING 상태이면 Action Item이 없을 수 있음 → 정상 처리 (빈 배열)

---

#### Task 5 — 미팅 실행 API (Active Meeting)

**요청 바디 스키마 (PATCH /start):**
```python
class AgendaStartItem(BaseModel):
    content: str
    source: Literal["AI_SUGGESTED", "LEADER_ADDED"]

class MeetingStartRequest(BaseModel):
    agendas: list[AgendaStartItem]  # 사전 준비 모달에서 선택/추가한 아젠다 목록
    # MEMBER_PRESET은 v1 미사용 → 프론트에서 항상 제외하고 전달
```

**엔드포인트:**
```
PATCH /v1/coaching/meetings/{meeting_id}/start
      body: MeetingStartRequest
      → status = IN_PROGRESS, started_at 기록
      → 이전 미팅(N-1, N-2만) 미완료 Action Item → 현재 미팅에 복사 INSERT (is_carried_over=True, assignee 값 그대로 복사)
      → 사전 아젠다 INSERT (AI_SUGGESTED, LEADER_ADDED, body.agendas 기준)

GET   /v1/coaching/meetings/{meeting_id}/active
      → 미팅 실행 화면 초기 데이터

GET   /v1/coaching/members/{member_emp_no}/rnr
      → 팀원의 R&R 계층 구조 조회

POST  /v1/coaching/meetings/{meeting_id}/timelines
      → 타임라인 카드 생성 (R&R 클릭 시)
      body: { rr_id, start_time }

PATCH /v1/coaching/meetings/{meeting_id}/timelines/{timeline_id}
      → 타임라인 카드 마감 OR 구간 요약 수동 편집 (통합 엔드포인트)
      body: { end_time?: int, segment_summary?: str }
      # end_time만 → 카드 마감 (미팅 실행 중)
      # segment_summary만 → 구간 요약 수정 (히스토리 리포트에서 편집)

PATCH /v1/coaching/meetings/{meeting_id}/memo
      → 개인 메모 저장 (2초 debounce 자동 저장)
      body: { private_memo }

PATCH /v1/coaching/meetings/{meeting_id}/agendas/{agenda_id}/complete
      → 아젠다 체크 (is_completed 토글)

PATCH /v1/coaching/meetings/{meeting_id}/action-items/{action_item_id}/complete
      → Action Item 체크 (is_completed 토글, 원본 미팅에 반영 안 함)

POST  /v1/coaching/meetings/{meeting_id}/agendas
      → 리더 즉석 아젠다 추가 (source=LEADER_ADDED)

GET   /v1/coaching/meetings/{meeting_id}/ai-questions
      → AI 스마트 아젠다 새로고침 (LLM 재호출)
```

**R&R 계층 구조 응답:**
```python
class RrTreeNode(BaseModel):
    rr_id: str
    upper_rr_name: str | None
    rr_name: str
    detail_content: str | None
    children: list['RrTreeNode'] = []  # 기존 tb_rr parent_rr_id 기반
```

**예외처리 체크:**
- [ ] `start` 호출 시 status가 `REQUESTED`가 아니면 400 에러 (중복 시작 방지)
- [ ] **Action Item 이월 범위: N-1, N-2 미팅만** (COMPLETED 기준 최신 2건) — 더 오래된 미팅은 이월 제외하여 누적 방지
- [ ] 이월 복사 시 `assignee` 값도 함께 복사 (`origin_meeting_id` + `is_carried_over=True` + `assignee` 유지)
- [ ] 타임라인 카드 생성 시 동일 meeting_id에 end_time이 NULL인 카드가 있으면 자동 마감 후 신규 생성
- [ ] 메모 저장은 인증된 leader만 가능 (meeting.leader_emp_no == current_user.emp_no)
- [ ] Action Item 체크는 이월 항목도 현재 미팅 row에서만 업데이트 (원본 미팅 불변)
- [ ] AI 질문 새로고침 LLM 실패 시 이전 질문 유지 + 에러 토스트

---

#### Task 6 — 미팅 종료 + GCS 업로드 API

**엔드포인트:**
```
POST /v1/coaching/meetings/{meeting_id}/presigned-url
     → GCS Presigned Upload URL 발급
     응답: { presigned_url, gcs_path, expires_at }

PATCH /v1/coaching/meetings/{meeting_id}/complete
      → 미팅 종료 처리
      body: {
        actual_duration_seconds: int,
        gcs_path: str,          # 업로드 완료 후 프론트가 전달
        timelines: [...],        # 최종 타임라인 JSON (end_time null 자동 마감)
        private_memo: str | None
      }
      → status = PROCESSING
      → TbMeetingRecord 생성 (audio_file_url = gcs_path)
      → TbCoachingRelation UPSERT (row 없으면 INSERT, 있으면 UPDATE)
        : last_meeting_id, last_meeting_date = completed_at, total_meeting_count += 1
      → AI 파이프라인 BackgroundTask 트리거
```

**종료 프로세스 흐름:**
```
[프론트] 미팅 종료 버튼
  → MediaRecorder.stop() → Blob 생성
  → POST /presigned-url
  → GCS 직접 업로드 (PUT to presigned URL)
  → PATCH /complete (gcs_path 전달)
  → [백엔드] BackgroundTask: AI 파이프라인 시작
  → [프론트] 리포트 대기 화면으로 이동
```

**예외처리 체크:**
- [ ] GCS 업로드 실패 시 재시도 로직 (프론트: 최대 3회)
- [ ] `/complete` 호출 시 `gcs_path` 없으면 `FAILED` 처리 (파일 없이 AI 불가)
- [ ] 마지막 타임라인 카드 `end_time` NULL이면 `actual_duration_seconds`로 자동 마감
- [ ] BackgroundTask 실패 시 status를 `FAILED`로 업데이트 (catch-all try/except 필수)
- [ ] `/complete` 멱등성: 이미 PROCESSING/COMPLETED이면 200 반환 (중복 호출 무시)
- [ ] **베타 타협 — PROCESSING 고착 방어:** 기존 `scheduler.py` 활용, 30분 이상 PROCESSING 상태인 미팅을 FAILED로 자동 전환하는 배치 추가 (실서비스 전 Celery/Worker 전환 예정)

---

#### Task 7 — 히스토리 및 리포트 API

**엔드포인트:**
```
GET /v1/coaching/members/{member_emp_no}/meetings
    → 해당 팀원과의 미팅 히스토리 목록
    응답: { items: [...], total: int }

GET /v1/coaching/meetings/{meeting_id}/report
    → 미팅 상세 리포트 (Bento Grid 데이터)
    → 권한에 따라 private_memo 포함/제외
    → audio_url 미포함 (별도 /audio-url 엔드포인트 사용)

# PATCH /timelines → Task 5와 동일 엔드포인트 재사용 (body에 segment_summary 전달)
# 별도 정의 불필요

GET /v1/coaching/meetings/{meeting_id}/audio-url
    → GCS Presigned Download URL 발급 (오디오 플레이어용)
    → 매 요청마다 새로운 URL 발급 (캐싱 금지)
    → 권한 체크: current_user.emp_no == meeting.leader_emp_no OR meeting.member_emp_no
```

**리포트 응답 구조:**
```python
class MeetingReportResponse(BaseModel):
    meeting_id: str
    member_info: MemberInfo
    started_at: datetime
    actual_duration_seconds: int
    status: str
    ai_summary: str | None
    timelines: list[TimelineItem]
    action_items: list[ActionItemReport]
    private_memo: str | None   # 리더만 조회 가능, 멤버는 None 반환
    # audio_url 제외 → GET /audio-url 별도 호출 (리포트 로드와 분리하여 presigned URL 생성 타이밍 제어)

class TimelineItem(BaseModel):
    timeline_id: str
    rr_name: str | None
    start_time: int
    end_time: int | None
    segment_summary: str | None

class ActionItemReport(BaseModel):
    action_item_id: str
    content: str
    assignee: str | None    # 'LEADER' | 'MEMBER' | None
    is_completed: bool
    is_carried_over: bool
    origin_meeting_id: str | None
```

**예외처리 체크:**
- [ ] `private_memo`: 백엔드 DTO 레벨에서 권한 체크 (`current_user.emp_no != meeting.leader_emp_no` → `None` 반환)
- [ ] 오디오 URL: Presigned URL 만료 시간 1시간, 매 요청마다 새로 발급
- [ ] status=PROCESSING 중인 리포트 조회 → "분석 중" 응답 (partial data 허용)
- [ ] 타임라인 수동 편집 후 LLM 재요약은 BackgroundTask로 비동기 처리

---

### PHASE 2: Frontend 개발

---

#### Task 8 — coaching 도메인 기본 구조 + 타입 정의

**작업 내용:**
- `client/src/domains/coaching/` 폴더 생성
- `types.ts` — 전체 타입 정의
- `api.ts` — API 호출 함수 (apiClient 사용)
- `store.ts` — Zustand 스토어 (미팅 실행 상태 관리)
- React Router에 coaching 라우트 추가

**라우트 구조:**
```
/coaching                    → 대시보드
/coaching/members/:emp_no    → 팀원 미팅 히스토리
/coaching/meetings/:id/report → 미팅 상세 리포트
```

**store.ts 주요 상태:**
```typescript
interface CoachingMeetingStore {
  // 현재 진행 중인 미팅
  activeMeeting: ActiveMeeting | null;
  recordingSeconds: number;        // 녹음 경과 시간 (초)
  isRecording: boolean;

  // 실시간 타임라인
  activeTimelineId: string | null;  // 현재 활성 타임라인 카드 ID
  activeRrId: string | null;        // 현재 활성 R&R ID (같은 카드 연속 클릭 방지용)

  // IndexedDB 임시 저장 (유실 방지)
  draftMemo: string;
}

// ⚠️ MediaRecorder, audioChunks(Blob[])는 Zustand에 넣지 말 것 → useRef로 관리
// ActiveMeetingPage.tsx 내부:
// const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// const audioChunksRef = useRef<Blob[]>([]);
// → 브라우저 API 객체, 대용량 바이너리는 직렬화 불가능 → store 저장 금지
```
```

**예외처리 체크:**
- [ ] MediaRecorder API 미지원 브라우저 감지 → 사용 불가 안내
- [ ] 마이크 권한 거부 시 에러 메시지 (PermissionDeniedError)
- [ ] store에 민감 정보(token 등) 저장 금지

---

#### Task 9 — 대시보드 페이지

**컴포넌트 구조:**
```
pages/CoachingDashboard.tsx
├── DashboardSummaryCards.tsx   상단 요약 카드 3개 (클릭 시 필터)
├── MemberSearchFilter.tsx      부서 Select + 이름 검색 Input
└── MemberDataGrid.tsx          팀원 목록 그리드
    ├── MeetingStatusBadge.tsx  상태 뱃지 (색상 구분)
    └── StartMeetingButton.tsx  [미팅 시작] 버튼
```

**요약 카드 색상:**
```
면담 요청 (미실시):  text-gray-500, bg-gray-50
2개월 초과 지연:     text-red-600,  bg-red-50   (경고색)
1개월 도래:         text-amber-600, bg-amber-50
```

**예외처리 체크:**
- [ ] 팀원 0명일 때 EmptyState 컴포넌트 표시
- [ ] 검색 디바운스 300ms (타이핑 중 과도한 API 호출 방지)
- [ ] 요약 카드 클릭 시 그리드 필터링 (추가 API 호출 없이 클라이언트 사이드)
- [ ] **필터 우선순위:** 이름 검색(서버 재조회) 시 카드 필터 상태 초기화 — 혼용 시 충돌 방지를 위해 서버 재조회가 항상 우선

---

#### Task 10 — 사전 준비 모달

**컴포넌트 구조:**
```
components/PreMeetingModal.tsx
├── MemberInfoHeader.tsx         팀원 정보 + 총 미팅 횟수
├── PreviousActionItems.tsx      이전 미팅 미완료 Action Items (is_first_meeting=false)
├── OnboardingChecklist.tsx      첫 미팅 시 온보딩 체크리스트 (is_first_meeting=true)
├── AiSuggestedAgendas.tsx       AI 추천 질문 (체크 가능)
├── LeaderAgendaInput.tsx        리더 즉석 추가 Input
└── MeetingStartButton.tsx       [녹음과 함께 미팅 시작하기]
```

**v1 안내 문구 (MEMBER_PRESET 제외):**
```
"팀원 사전 아젠다 작성 기능은 추후 제공될 예정입니다."
```

**예외처리 체크:**
- [ ] 모달 열자마자 `POST /meetings` 호출 → meeting_id 생성 (이후 [취소] 시 DELETE)
- [ ] [취소] 버튼: ConfirmModal로 확인 후 `DELETE /meetings/{id}` 호출
- [ ] 브라우저 뒤로가기/ESC: 동일하게 DELETE 처리 (useEffect cleanup)
- [ ] AI 추천 질문 로딩 중 skeleton UI 표시
- [ ] 마이크 권한 획득 실패 시: 미팅 시작 버튼 비활성화 + 안내 메시지

---

#### Task 11 — 미팅 실행 화면 (핵심)

**레이아웃:**
```
ActiveMeetingPage.tsx
├── MeetingHeader.tsx
│   ├── RecordingTimer.tsx        녹음 시간 카운터 (초 단위 업데이트)
│   ├── RecordingIndicator.tsx    빨간 점 애니메이션
│   └── EndMeetingButton.tsx      [미팅 종료] 버튼
├── LeftPanel.tsx
│   ├── RrTreePanel.tsx           R&R 계층 리스트 (상위 > R&R > 상세)
│   │   └── RrCard.tsx            클릭 시 타임라인 생성, active 표시
│   ├── TimelineList.tsx          실시간 타임라인 카드 목록
│   └── AgendaChecklist.tsx       아젠다 + Action Item 체크리스트
└── RightPanel.tsx
    ├── AiSmartAgenda.tsx         AI 추천 질문 + [새로고침]
    └── PrivateMemoEditor.tsx     개인 메모 textarea (2초 debounce 저장)
```

**유실 방지 로직:**
```typescript
// 10초 주기 IndexedDB 저장
useEffect(() => {
  const interval = setInterval(() => {
    saveDraftToIndexedDB({
      meetingId,
      memo: draftMemo,
      timestamp: Date.now(),
    });
  }, 10_000);
  return () => clearInterval(interval);
}, [meetingId, draftMemo]);

// 페이지 이탈 시 localStorage 저장
useEffect(() => {
  const handler = () => {
    localStorage.setItem(`meeting_draft_${meetingId}`, JSON.stringify({
      memo: draftMemo,
      savedAt: new Date().toISOString(),
    }));
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [meetingId, draftMemo]);
```

**타임라인 로직:**
```typescript
// R&R 카드 클릭
const handleRrClick = async (rrId: string) => {
  // 같은 R&R 카드 연속 클릭 방지 (activeRrId로 판단)
  if (activeRrId === rrId) return;

  const currentTime = recordingSeconds;

  // 현재 활성 카드 마감
  if (activeTimelineId) {
    await api.patchTimeline(meetingId, activeTimelineId, { end_time: currentTime });
  }

  // 새 타임라인 카드 생성
  const newTimeline = await api.createTimeline(meetingId, { rr_id: rrId, start_time: currentTime });
  setActiveTimelineId(newTimeline.timeline_id);
  setActiveRrId(rrId);  // ← store에 현재 활성 R&R ID 기록
};
```

**예외처리 체크:**
- [ ] 페이지 새로고침/이탈 시 `beforeunload` 이벤트에서 경고 다이얼로그 표시
- [ ] 같은 R&R 카드 연속 클릭: `store.activeRrId === rrId`이면 early return (activeTimelineId 비교 불가, rr_id로 판단)
- [ ] 메모 저장 API 실패: 로컬 상태 유지, 다음 debounce 시 재시도
- [ ] AI 추천 질문 클릭 → 메모장 커서 위치에 삽입 (contentEditable or textarea selectionStart/End 활용)
- [ ] R&R 데이터 없을 때 EmptyState ("R&R이 등록되지 않았습니다")

---

#### Task 12 — 미팅 종료 + 히스토리 + 리포트 화면

**미팅 종료 플로우 컴포넌트:**
```
EndMeetingFlow/
├── EndMeetingConfirmModal.tsx   종료 확인 다이얼로그
├── UploadProgressModal.tsx      GCS 업로드 진행률 표시
└── ProcessingWaitScreen.tsx     AI 분석 중 대기 화면 (폴링 또는 완료 후 이동)
```

**히스토리 + 리포트 컴포넌트:**
```
pages/MeetingHistoryPage.tsx     팀원별 미팅 목록 (카드 뷰)
pages/MeetingReportPage.tsx      Bento Grid 상세 리포트
├── AudioPlayer.tsx              재생 컨트롤러 + 프로그레스 바
├── AiSummaryCard.tsx            AI 전체 요약
├── TimelineGrid.tsx             타임라인 목록 (클릭 → 오디오 currentTime 이동)
├── ActionItemsCard.tsx          신규 + 이월 Action Items
├── PrivateMemoCard.tsx          비공개 메모 (자물쇠 아이콘, 수정 가능)
└── EditTimelineModal.tsx        타임라인 수동 편집 모달
```

**오디오 플레이어 타임라인 연동:**
```typescript
// 타임라인 카드 클릭 시 오디오 해당 구간으로 이동
const handleTimelineClick = (startTime: number) => {
  if (audioRef.current) {
    audioRef.current.currentTime = startTime;
    audioRef.current.play();
  }
};
```

**예외처리 체크:**
- [ ] GCS 업로드 실패: 재시도 버튼 제공 (최대 3회 자동 재시도 후 수동 재시도)
- [ ] 업로드 진행률: **반드시 `XMLHttpRequest` + `upload.onprogress` 사용** — `fetch`는 업로드 진행률 추적 불가 (ReadableStream은 다운로드 전용)
- [ ] PROCESSING 상태 폴링: 5초 간격, 최대 30분 (타임아웃 시 "분석이 오래 걸리고 있습니다" 안내)
- [ ] 오디오 URL 만료 (1시간): 재생 중 만료 감지 → 자동 URL 갱신
- [ ] 리포트 미완성(PROCESSING) 상태: 완성된 데이터만 표시 + "분석 중" 배너
- [ ] private_memo 수정: 리더만 편집 가능 (멤버 접근 시 수정 버튼 숨김)

---

### PHASE 3: AI 파이프라인

---

#### Task 13 — STT + 화자 분리

**파일 위치:** `server/app/domain/coaching/calculators/ai_pipeline.py`

**파이프라인 함수:**
```python
async def run_ai_pipeline(meeting_id: str, db: AsyncSession) -> None:
    """BackgroundTask로 실행되는 AI 파이프라인 전체"""
    try:
        # 1. STT (Whisper)
        transcript = await run_stt(audio_gcs_path)

        # 2. 화자 분리 (LLM)
        labeled_transcript = await run_speaker_diarization(
            transcript=transcript,
            leader_name=leader.emp_name,
            member_name=member.emp_name
        )

        # 3. 타임라인 구간 매칭 + 구간 요약
        await run_timeline_matching_and_summary(
            meeting_id=meeting_id,
            transcript=labeled_transcript,
            timelines=timelines,
            db=db
        )

        # 4. 전체 요약 + Action Item 추출
        await run_full_summary_and_action_items(meeting_id=meeting_id, db=db)

        # 5. 통계 갱신 + 상태 COMPLETED
        await finalize_meeting(meeting_id=meeting_id, db=db)

    except Exception as e:
        await mark_meeting_failed(meeting_id=meeting_id, db=db)
        logger.error(f"AI 파이프라인 실패: {meeting_id}", exc_info=True)
```

**STT JSON 구조:**
```python
# Whisper 결과를 LLM에 전달하여 화자 라벨링
# 최종 저장 구조 (TbMeetingRecord.stt_transcript):
[
    {"start": 0.0, "end": 5.2, "text": "...", "speaker": "LEADER"},
    {"start": 5.5, "end": 12.0, "text": "...", "speaker": "MEMBER"},
]
```

**LLM 프롬프트 설계 (화자 분리):**
```
당신은 1on1 미팅 녹음 전사 텍스트의 화자를 분리하는 전문가입니다.

참가자 정보:
- 리더: {leader_name} (팀장)
- 팀원: {member_name}

다음 전사 텍스트에서 각 발화의 화자를 LEADER 또는 MEMBER로 라벨링하세요.
맥락, 말투, 내용을 종합적으로 판단하세요.

전사 텍스트:
{transcript}

JSON 형식으로 응답하세요:
[{"start": float, "end": float, "text": str, "speaker": "LEADER" | "MEMBER"}, ...]
```

**Whisper API 파일 크기 제한 처리 (CRITICAL):**

Whisper API 최대 파일 크기: **25MB**. webm 60분 녹음은 수십~수백 MB 가능.

```python
WHISPER_MAX_BYTES = 24 * 1024 * 1024  # 24MB (여유 1MB)

async def run_stt(audio_bytes: bytes) -> list[dict]:
    """파일 크기 초과 시 청크 분할 → 순서대로 STT → 결과 병합"""
    if len(audio_bytes) <= WHISPER_MAX_BYTES:
        return await _call_whisper(audio_bytes)

    # 베타 타협안: 파일을 시간 기준으로 청크 분할 (pydub 또는 ffmpeg 사용)
    # 10분 단위 분할 → 각각 STT → transcript 시간 오프셋 보정 후 병합
    chunks = split_audio_by_duration(audio_bytes, chunk_minutes=10)
    full_transcript = []
    time_offset = 0.0
    for chunk_bytes in chunks:
        chunk_result = await _call_whisper(chunk_bytes)
        for seg in chunk_result:
            full_transcript.append({
                **seg,
                "start": seg["start"] + time_offset,
                "end": seg["end"] + time_offset,
            })
        time_offset += chunk_duration_seconds  # 청크 실제 길이
    return full_transcript
```

**베타 타협:** 10명 사용자 기준 60분 이하 미팅이 대부분이므로, pydub 없이 ffmpeg CLI로 단순 분할해도 무방.

**예외처리 체크:**
- [ ] GCS 파일 다운로드: 서비스 계정으로 직접 다운로드 (Presigned URL 아님, 내부 처리)
- [ ] 파일 크기 확인 후 25MB 초과 시 청크 분할 STT 수행
- [ ] LLM JSON 파싱 실패: speaker를 UNKNOWN으로 저장 후 계속 진행 (전체 파이프라인 중단 금지)
- [ ] 빈 오디오 파일 (0초): STT 단계에서 감지 → 빈 transcript로 건너뜀
- [ ] GCS 파일 다운로드 실패: 재시도 3회 후 FAILED

---

#### Task 14 — 구간 요약 + Action Item 추출 + 최종 요약

**타임라인 구간 매칭 로직:**
```python
async def run_timeline_matching_and_summary(
    meeting_id: str,
    transcript: list[dict],
    timelines: list[TbMeetingTimeline],
    db: AsyncSession
) -> None:
    """각 타임라인 구간에 해당하는 STT 텍스트를 매칭하고 구간 요약 생성"""
    for timeline in timelines:
        # 구간 내 발화 추출 (start_time ~ end_time)
        # ⚠️ seg['end'] <= end_time 조건이면 경계 걸친 세그먼트 누락 → seg['start'] 기준으로 판단
        segment_texts = [
            seg for seg in transcript
            if seg['start'] >= timeline.start_time
            and (timeline.end_time is None or seg['start'] < timeline.end_time)
        ]

        if not segment_texts:
            continue

        # LLM 구간 요약
        summary = await llm_summarize_segment(segment_texts, rr_name=timeline.rr.rr_name)
        timeline.segment_summary = summary
        db.add(timeline)

    await db.commit()
```

**Action Item 추출 LLM 프롬프트:**
```
다음 1on1 미팅 전사 텍스트에서 Action Item(할 일)을 추출하세요.

조건:
- 구체적이고 실행 가능한 항목만 추출 (최대 5개)
- "~하겠습니다", "~해주세요", "~확인해볼게요" 같은 약속/합의 사항
- 담당자: LEADER 또는 MEMBER 명시

JSON 형식:
[{"content": str, "assignee": "LEADER" | "MEMBER"}, ...]
```

**Action Item 저장 시 assignee 반영:**
```python
# LLM 추출 결과 → TbMeetingActionItem INSERT
for item in extracted_items:
    db.add(TbMeetingActionItem(
        meeting_id=meeting_id,
        content=item["content"],
        assignee=item.get("assignee"),   # 'LEADER' | 'MEMBER' | None
        is_carried_over=False,
        is_completed=False,
    ))
```

**예외처리 체크:**
- [ ] 타임라인이 없는 미팅 (녹음만 한 경우): 타임라인 생략하고 전체 요약만 진행
- [ ] Action Item 0개 추출: 정상 처리 (빈 배열)
- [ ] LLM 응답이 JSON이 아닌 경우: 정규식으로 JSON 파싱 재시도, 실패 시 빈 배열
- [ ] Action Item 추출은 AI 파이프라인에서만 수행 → 이월 항목(is_carried_over=True)과 중복 저장 아님 (이월 항목은 PATCH /start에서 INSERT됨)

---

### PHASE 4: 통합 테스트 & 마무리

---

#### Task 15 — 통합 테스트 + 라우터 등록 + 배포 준비

**백엔드 라우터 등록:**
```python
# server/app/api/v1/router.py
from server.app.domain.coaching.router import router as coaching_router
api_router.include_router(coaching_router, prefix="/coaching", tags=["coaching"])
```

**메뉴 등록 (Alembic 마이그레이션):**
```python
# alembic revision -m "coaching_ai 메뉴 등록"
# upgrade():
#   migration/ 폴더 기존 메뉴 코드 확인 후 INSERT
#   cm_menu에 '1on1 코칭' 메뉴 추가 (menu_url: /coaching)
#   cm_role_menu에 P004(리더) 권한 매핑
# downgrade(): 해당 메뉴 코드 DELETE
```
- **베타 타협:** 10명 내부 사용자이므로 전체 권한 부여 후 이후 role 기반 권한 세분화

**통합 테스트 시나리오:**

**시나리오 1: 첫 미팅 플로우**
```
1. 대시보드 접근 → 팀원 목록 확인 (meeting_status=NOT_STARTED)
2. [미팅 시작] 클릭 → 사전 준비 모달 열림
3. is_first_meeting=True 확인 → 온보딩 체크리스트 표시
4. [녹음과 함께 미팅 시작하기] 클릭
5. 미팅 실행 화면: 타이머 동작, R&R 클릭 → 타임라인 생성
6. 메모 입력 → 2초 후 자동 저장
7. [미팅 종료] → 컨펌 → GCS 업로드 → PROCESSING 상태
8. AI 파이프라인 완료 → 대시보드 meeting_status 변경 확인
9. 리포트 페이지: 타임라인, AI 요약, Action Item 표시
```

**시나리오 2: 이월 Action Item 확인**
```
1. 두 번째 미팅 시작
2. 사전 준비 모달: 첫 미팅의 미완료 Action Item 표시
3. 미팅 시작 → 이월 Action Items가 현재 미팅에 복사됨 (is_carried_over=True)
4. 체크 시 현재 미팅 row만 업데이트 (원본 미팅 불변 확인)
```

**시나리오 3: 중단 케이스**
```
1. 사전 준비 모달 → [취소] → meeting 레코드 DELETE 확인
2. 미팅 실행 중 브라우저 새로고침 → beforeunload 경고 + IndexedDB 복구
3. GCS 업로드 실패 → 재시도 버튼 동작
4. AI 파이프라인 실패 → status=FAILED, 리포트 페이지 오류 상태 표시
```

**필수 예외 케이스 (누락 시 치명적):**

| 케이스 | 확인 방법 |
|--------|----------|
| private_memo 멤버 접근 차단 | 멤버 계정으로 GET /report → response.private_memo === null |
| 미팅 중복 시작 방지 | PATCH /start 두 번 호출 → 두 번째는 400 응답 |
| 타임라인 end_time null 자동 마감 | 미팅 종료 시 마지막 타임라인 end_time 확인 |
| 오디오 URL 만료 후 갱신 | GET /audio-url 매 호출마다 새 URL 확인 |
| 이월 항목 원본 불변 | 이월 항목 체크 후 origin_meeting의 action_item.is_completed 확인 |

---

## 📋 Task 요약 및 의존성

```
Task 1: DB 모델 + 마이그레이션           (선행 없음, 최우선)
Task 2: GCS 연동 모듈                   (선행 없음, Task 1과 병행 가능)
Task 3: 대시보드 API                    (Task 1 필요)
Task 4: 사전 준비 모달 API              (Task 1, 2 필요)
Task 5: 미팅 실행 API                   (Task 4 필요)
Task 6: 미팅 종료 + GCS 업로드 API      (Task 2, 5 필요)
Task 7: 히스토리 + 리포트 API           (Task 6 필요)
Task 8: Frontend 기본 구조              (Task 3 API 스펙 확정 후)
Task 9: 대시보드 페이지                 (Task 3, 8 필요)
Task 10: 사전 준비 모달                 (Task 4, 8 필요)
Task 11: 미팅 실행 화면                 (Task 5, 8, 10 필요)
Task 12: 종료 + 히스토리 + 리포트       (Task 6, 7, 11 필요)
Task 13: STT + 화자 분리                (Task 6 필요)
Task 14: 구간 요약 + Action Item 추출   (Task 13 필요)
Task 15: 통합 테스트 + 배포 준비         (모든 Task 완료 후)
```

---

## 🔑 개발 시 주의사항 요약

1. **타임라인 시간 기준**: 녹음 시작 기준 상대 시간(초), Pause 없음
2. **이월 Action Item**: 원본 미팅 Row는 절대 수정 금지
3. **private_memo**: 백엔드 DTO에서 원천 차단 (프론트 조건부 렌더링으로 보완)
4. **GCS 경로**: `meetings/{leader_emp_no}/{meeting_id}/original_audio.webm`
5. **position_code**: P004=리더, P005=팀원 (다른 코드는 리더로 처리)
6. **AI 파이프라인 실패**: 전체 중단 금지, 각 단계 독립 실패 처리
7. **Agenda source**: MEMBER_PRESET은 v1 미사용, 항상 빈 배열
