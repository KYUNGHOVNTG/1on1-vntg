"""
Coaching AI 도메인 모델

1on1 코칭 AI 시스템의 SQLAlchemy ORM 모델을 정의합니다.

테이블 목록:
- TbCoachingRelation : tb_coaching_relation (코칭 관계 캐싱)
- TbMeeting          : tb_meeting           (미팅 마스터)
- TbMeetingAgenda    : tb_meeting_agenda    (아젠다)
- TbMeetingActionItem: tb_meeting_action_item (Action Item)
- TbMeetingRecord    : tb_meeting_record    (녹음 및 AI 분석 결과)
- TbMeetingTimeline  : tb_meeting_timeline  (실시간 타임라인)

생성 순서 (FK 의존성):
  tb_meeting → tb_coaching_relation (last_meeting_id FK)
  tb_meeting → tb_meeting_agenda, tb_meeting_action_item, tb_meeting_record, tb_meeting_timeline
  tb_rr → tb_meeting_timeline (rr_id FK)
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class TbMeeting(Base):
    """
    미팅 마스터 테이블 (tb_meeting)

    상태 흐름:
      REQUESTED  → 사전 준비 모달 열림
      IN_PROGRESS → 녹음 중
      PROCESSING  → GCS 업로드 완료, AI 파이프라인 처리 중
      COMPLETED   → 모든 처리 완료
      FAILED      → AI 파이프라인 실패
    """

    __tablename__ = "tb_meeting"

    meeting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="미팅 ID (UUID)",
    )

    leader_emp_no: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="리더 사번",
    )

    member_emp_no: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="팀원 사번",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="REQUESTED",
        nullable=False,
        comment="미팅 상태 (REQUESTED / IN_PROGRESS / PROCESSING / COMPLETED / FAILED)",
    )

    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="미팅 시작일시 (UTC)",
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="미팅 종료일시 (UTC)",
    )

    actual_duration_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="실제 녹음 길이(초) — 오디오 파일 duration 기준",
    )

    private_memo: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="리더 전용 비공개 메모",
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        comment="생성일시 (UTC)",
    )

    # Relationships
    agendas: Mapped[List["TbMeetingAgenda"]] = relationship(
        "TbMeetingAgenda",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )

    action_items: Mapped[List["TbMeetingActionItem"]] = relationship(
        "TbMeetingActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )

    timelines: Mapped[List["TbMeetingTimeline"]] = relationship(
        "TbMeetingTimeline",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )

    record: Mapped[Optional["TbMeetingRecord"]] = relationship(
        "TbMeetingRecord",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<TbMeeting(meeting_id='{self.meeting_id}', "
            f"leader='{self.leader_emp_no}', member='{self.member_emp_no}', "
            f"status='{self.status}')>"
        )


class TbCoachingRelation(Base):
    """
    코칭 관계 및 캐싱 테이블 (tb_coaching_relation)

    리더-팀원 쌍의 미팅 통계를 캐싱합니다.
    last_meeting_id, last_meeting_date, total_meeting_count를 관리합니다.
    """

    __tablename__ = "tb_coaching_relation"

    __table_args__ = (
        UniqueConstraint(
            "leader_emp_no",
            "member_emp_no",
            name="uq_coaching_relation",
        ),
    )

    relation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="코칭 관계 ID (UUID)",
    )

    leader_emp_no: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="리더 사번",
    )

    member_emp_no: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="팀원 사번",
    )

    last_meeting_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_meeting.meeting_id"),
        nullable=True,
        comment="마지막 미팅 ID",
    )

    last_meeting_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="마지막 미팅 일시 (UTC)",
    )

    total_meeting_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="총 미팅 횟수",
    )

    up_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow,
        nullable=True,
        comment="수정일시 (UTC)",
    )

    def __repr__(self) -> str:
        return (
            f"<TbCoachingRelation(leader='{self.leader_emp_no}', "
            f"member='{self.member_emp_no}', "
            f"total_count={self.total_meeting_count})>"
        )


class TbMeetingAgenda(Base):
    """
    아젠다 테이블 (tb_meeting_agenda)

    source 구분:
      MEMBER_PRESET — 조직원 사전 작성 (v1 미사용, 항상 빈 배열)
      AI_SUGGESTED  — AI 추천 질문
      LEADER_ADDED  — 리더 즉석 추가
    """

    __tablename__ = "tb_meeting_agenda"

    agenda_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="아젠다 ID (UUID)",
    )

    meeting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_meeting.meeting_id"),
        nullable=False,
        comment="미팅 ID",
    )

    content: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        comment="아젠다 내용",
    )

    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="출처 (MEMBER_PRESET / AI_SUGGESTED / LEADER_ADDED)",
    )

    order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="정렬 순서",
    )

    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="완료 여부",
    )

    # Relationships
    meeting: Mapped["TbMeeting"] = relationship(
        "TbMeeting",
        back_populates="agendas",
    )

    def __repr__(self) -> str:
        return (
            f"<TbMeetingAgenda(agenda_id='{self.agenda_id}', "
            f"source='{self.source}', is_completed={self.is_completed})>"
        )


class TbMeetingActionItem(Base):
    """
    Action Item (To-Do) 테이블 (tb_meeting_action_item)

    이월 항목(is_carried_over=True)은 PATCH /start 시 이전 미팅에서 복사 INSERT됩니다.
    이월 항목 체크 시 원본 미팅 row는 변경하지 않습니다.
    """

    __tablename__ = "tb_meeting_action_item"

    action_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Action Item ID (UUID)",
    )

    meeting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_meeting.meeting_id"),
        nullable=False,
        comment="미팅 ID",
    )

    origin_meeting_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="이월 원본 미팅 ID (이월 항목인 경우 설정)",
    )

    is_carried_over: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="이월 항목 여부",
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Action Item 내용",
    )

    assignee: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        comment="담당자 (LEADER / MEMBER / None) — AI 추출 또는 이월 시 origin 값 복사",
    )

    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="완료 여부",
    )

    # Relationships
    meeting: Mapped["TbMeeting"] = relationship(
        "TbMeeting",
        back_populates="action_items",
    )

    def __repr__(self) -> str:
        return (
            f"<TbMeetingActionItem(action_item_id='{self.action_item_id}', "
            f"assignee='{self.assignee}', is_completed={self.is_completed})>"
        )


class TbMeetingRecord(Base):
    """
    녹음 및 AI 분석 결과 테이블 (tb_meeting_record)

    GCS 경로: meetings/{leader_emp_no}/{meeting_id}/original_audio.webm

    stt_transcript JSON 구조:
    [
      {"start": 0.0, "end": 5.2, "text": "...", "speaker": "LEADER"},
      {"start": 5.5, "end": 12.0, "text": "...", "speaker": "MEMBER"},
    ]
    """

    __tablename__ = "tb_meeting_record"

    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="레코드 ID (UUID)",
    )

    meeting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_meeting.meeting_id"),
        unique=True,
        nullable=False,
        comment="미팅 ID (1:1 관계)",
    )

    audio_file_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="GCS 오디오 파일 경로",
    )

    stt_transcript: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="STT 결과 JSON [{start, end, text, speaker}, ...]",
    )

    ai_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="AI 전체 요약",
    )

    # Relationships
    meeting: Mapped["TbMeeting"] = relationship(
        "TbMeeting",
        back_populates="record",
    )

    def __repr__(self) -> str:
        return (
            f"<TbMeetingRecord(record_id='{self.record_id}', "
            f"meeting_id='{self.meeting_id}')>"
        )


class TbMeetingTimeline(Base):
    """
    실시간 타임라인 기록 테이블 (tb_meeting_timeline)

    start_time / end_time은 녹음 시작 기준 상대 시간(초)입니다.
    end_time이 None인 카드는 현재 진행 중인 카드입니다.
    segment_summary는 AI 파이프라인이 채워줍니다.
    """

    __tablename__ = "tb_meeting_timeline"

    timeline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="타임라인 ID (UUID)",
    )

    meeting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_meeting.meeting_id"),
        nullable=False,
        comment="미팅 ID",
    )

    rr_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_rr.rr_id"),
        nullable=True,
        comment="R&R ID (tb_rr 참조)",
    )

    start_time: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="구간 시작 시간 (녹음 시작 기준 상대 초)",
    )

    end_time: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="구간 종료 시간 (NULL이면 현재 활성 카드)",
    )

    segment_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="AI 구간 요약 (AI 파이프라인 완료 후 채워짐)",
    )

    # Relationships
    meeting: Mapped["TbMeeting"] = relationship(
        "TbMeeting",
        back_populates="timelines",
    )

    def __repr__(self) -> str:
        return (
            f"<TbMeetingTimeline(timeline_id='{self.timeline_id}', "
            f"start_time={self.start_time}, end_time={self.end_time})>"
        )


__all__ = [
    "TbMeeting",
    "TbCoachingRelation",
    "TbMeetingAgenda",
    "TbMeetingActionItem",
    "TbMeetingRecord",
    "TbMeetingTimeline",
]
