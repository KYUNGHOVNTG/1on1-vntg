"""coaching_ai 도메인 테이블 생성

Revision ID: 532ba7fc20aa
Revises: q4r5s6t7u8v9
Create Date: 2026-03-04 08:10:18.559513

생성 테이블 (FK 의존성 순서):
  1. tb_meeting           (마스터, tb_rr 참조 없음)
  2. tb_coaching_relation (last_meeting_id → tb_meeting)
  3. tb_meeting_agenda    (meeting_id → tb_meeting)
  4. tb_meeting_action_item (meeting_id → tb_meeting)
  5. tb_meeting_record    (meeting_id → tb_meeting)
  6. tb_meeting_timeline  (meeting_id → tb_meeting, rr_id → tb_rr)

삭제 순서 (downgrade — FK 역순):
  tb_coaching_relation, tb_meeting_timeline, tb_meeting_record,
  tb_meeting_action_item, tb_meeting_agenda, tb_meeting
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "532ba7fc20aa"
down_revision: Union[str, None] = "q4r5s6t7u8v9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. tb_meeting ────────────────────────────────────────────────────────
    op.create_table(
        "tb_meeting",
        sa.Column(
            "meeting_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="미팅 ID (UUID)",
        ),
        sa.Column(
            "leader_emp_no",
            sa.String(20),
            nullable=False,
            comment="리더 사번",
        ),
        sa.Column(
            "member_emp_no",
            sa.String(20),
            nullable=False,
            comment="팀원 사번",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="REQUESTED",
            comment="미팅 상태 (REQUESTED / IN_PROGRESS / PROCESSING / COMPLETED / FAILED)",
        ),
        sa.Column(
            "started_at",
            sa.DateTime(),
            nullable=True,
            comment="미팅 시작일시 (UTC)",
        ),
        sa.Column(
            "completed_at",
            sa.DateTime(),
            nullable=True,
            comment="미팅 종료일시 (UTC)",
        ),
        sa.Column(
            "actual_duration_seconds",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="실제 녹음 길이(초) — 오디오 파일 duration 기준",
        ),
        sa.Column(
            "private_memo",
            sa.Text(),
            nullable=True,
            comment="리더 전용 비공개 메모",
        ),
        sa.Column(
            "in_date",
            sa.DateTime(),
            nullable=False,
            comment="생성일시 (UTC)",
        ),
    )

    # ── 2. tb_coaching_relation ───────────────────────────────────────────────
    op.create_table(
        "tb_coaching_relation",
        sa.Column(
            "relation_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="코칭 관계 ID (UUID)",
        ),
        sa.Column(
            "leader_emp_no",
            sa.String(20),
            nullable=False,
            comment="리더 사번",
        ),
        sa.Column(
            "member_emp_no",
            sa.String(20),
            nullable=False,
            comment="팀원 사번",
        ),
        sa.Column(
            "last_meeting_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_meeting.meeting_id"),
            nullable=True,
            comment="마지막 미팅 ID",
        ),
        sa.Column(
            "last_meeting_date",
            sa.DateTime(),
            nullable=True,
            comment="마지막 미팅 일시 (UTC)",
        ),
        sa.Column(
            "total_meeting_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="총 미팅 횟수",
        ),
        sa.Column(
            "up_date",
            sa.DateTime(),
            nullable=True,
            comment="수정일시 (UTC)",
        ),
        sa.UniqueConstraint(
            "leader_emp_no",
            "member_emp_no",
            name="uq_coaching_relation",
        ),
    )

    # ── 3. tb_meeting_agenda ──────────────────────────────────────────────────
    op.create_table(
        "tb_meeting_agenda",
        sa.Column(
            "agenda_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="아젠다 ID (UUID)",
        ),
        sa.Column(
            "meeting_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_meeting.meeting_id"),
            nullable=False,
            comment="미팅 ID",
        ),
        sa.Column(
            "content",
            sa.String(1000),
            nullable=False,
            comment="아젠다 내용",
        ),
        sa.Column(
            "source",
            sa.String(20),
            nullable=False,
            comment="출처 (MEMBER_PRESET / AI_SUGGESTED / LEADER_ADDED)",
        ),
        sa.Column(
            "order",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="정렬 순서",
        ),
        sa.Column(
            "is_completed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="완료 여부",
        ),
    )

    # ── 4. tb_meeting_action_item ─────────────────────────────────────────────
    op.create_table(
        "tb_meeting_action_item",
        sa.Column(
            "action_item_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="Action Item ID (UUID)",
        ),
        sa.Column(
            "meeting_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_meeting.meeting_id"),
            nullable=False,
            comment="미팅 ID",
        ),
        sa.Column(
            "origin_meeting_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
            comment="이월 원본 미팅 ID",
        ),
        sa.Column(
            "is_carried_over",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="이월 항목 여부",
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
            comment="Action Item 내용",
        ),
        sa.Column(
            "assignee",
            sa.String(10),
            nullable=True,
            comment="담당자 (LEADER / MEMBER / None)",
        ),
        sa.Column(
            "is_completed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="완료 여부",
        ),
    )

    # ── 5. tb_meeting_record ──────────────────────────────────────────────────
    op.create_table(
        "tb_meeting_record",
        sa.Column(
            "record_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="레코드 ID (UUID)",
        ),
        sa.Column(
            "meeting_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_meeting.meeting_id"),
            unique=True,
            nullable=False,
            comment="미팅 ID (1:1 관계)",
        ),
        sa.Column(
            "audio_file_url",
            sa.String(500),
            nullable=True,
            comment="GCS 오디오 파일 경로",
        ),
        sa.Column(
            "stt_transcript",
            postgresql.JSONB(),
            nullable=True,
            comment="STT 결과 JSON [{start, end, text, speaker}, ...]",
        ),
        sa.Column(
            "ai_summary",
            sa.Text(),
            nullable=True,
            comment="AI 전체 요약",
        ),
    )

    # ── 6. tb_meeting_timeline ────────────────────────────────────────────────
    op.create_table(
        "tb_meeting_timeline",
        sa.Column(
            "timeline_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            comment="타임라인 ID (UUID)",
        ),
        sa.Column(
            "meeting_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_meeting.meeting_id"),
            nullable=False,
            comment="미팅 ID",
        ),
        sa.Column(
            "rr_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tb_rr.rr_id"),
            nullable=True,
            comment="R&R ID (tb_rr 참조)",
        ),
        sa.Column(
            "start_time",
            sa.Integer(),
            nullable=False,
            comment="구간 시작 시간 (녹음 시작 기준 상대 초)",
        ),
        sa.Column(
            "end_time",
            sa.Integer(),
            nullable=True,
            comment="구간 종료 시간 (NULL이면 현재 활성 카드)",
        ),
        sa.Column(
            "segment_summary",
            sa.Text(),
            nullable=True,
            comment="AI 구간 요약",
        ),
    )


def downgrade() -> None:
    # FK 의존성 역순으로 삭제
    # tb_coaching_relation은 tb_meeting을 참조하므로 먼저 삭제
    op.drop_table("tb_coaching_relation")
    op.drop_table("tb_meeting_timeline")
    op.drop_table("tb_meeting_record")
    op.drop_table("tb_meeting_action_item")
    op.drop_table("tb_meeting_agenda")
    op.drop_table("tb_meeting")
