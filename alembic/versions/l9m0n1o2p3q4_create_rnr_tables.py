"""tb_rr_level, tb_rr, tb_rr_period 테이블 생성

Revision ID: l9m0n1o2p3q4
Revises: k8l9m0n1o2p3
Create Date: 2026-02-24 00:00:00.000000

생성 테이블:
- tb_rr_level : R&R 레벨 (전사/부문/본부/센터/팀/파트)
- tb_rr       : R&R 마스터 (Self-Reference 계층 구조)
- tb_rr_period: 업무 기간 (단절된 다중 기간 지원)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "l9m0n1o2p3q4"
down_revision: Union[str, None] = "k8l9m0n1o2p3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    R&R 관련 테이블 3종 생성

    생성 순서:
    1. tb_rr_level (참조 없음, 먼저 생성)
    2. tb_rr       (tb_rr_level, hr_mgnt, cm_department 참조)
    3. tb_rr_period (tb_rr 참조, CASCADE DELETE)
    """

    # =============================================
    # 1. tb_rr_level — R&R 레벨 테이블
    # =============================================
    op.create_table(
        "tb_rr_level",
        sa.Column(
            "level_id",
            sa.String(20),
            nullable=False,
            comment="레벨 ID (예: LV2026_0)",
        ),
        sa.Column(
            "year",
            sa.String(4),
            nullable=False,
            comment="기준 연도 (예: 2026)",
        ),
        sa.Column(
            "level_name",
            sa.String(100),
            nullable=False,
            comment="레벨 명 (전사, 부문, 본부, 센터, 팀, 파트)",
        ),
        sa.Column(
            "level_step",
            sa.Integer(),
            nullable=False,
            comment="레벨 순서 (0: Root, 1, 2, 3...)",
        ),
        sa.PrimaryKeyConstraint("level_id", name="pk_tb_rr_level"),
    )

    # =============================================
    # 2. tb_rr — R&R 마스터 테이블
    # =============================================
    op.create_table(
        "tb_rr",
        sa.Column(
            "rr_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
            comment="R&R ID (UUID)",
        ),
        sa.Column(
            "year",
            sa.String(4),
            nullable=False,
            comment="기준 연도 (예: 2026)",
        ),
        sa.Column(
            "level_id",
            sa.String(20),
            nullable=False,
            comment="R&R 레벨 ID",
        ),
        sa.Column(
            "emp_no",
            sa.String(20),
            nullable=False,
            comment="사번",
        ),
        sa.Column(
            "dept_code",
            sa.String(20),
            nullable=False,
            comment="부서 코드",
        ),
        sa.Column(
            "rr_type",
            sa.String(10),
            nullable=False,
            comment="R&R 유형 (COMPANY: 전사, LEADER: 조직장, MEMBER: 팀원)",
        ),
        sa.Column(
            "parent_rr_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
            comment="상위 R&R ID (Self-Reference, 최상위는 NULL)",
        ),
        sa.Column(
            "title",
            sa.String(500),
            nullable=False,
            comment="R&R 명 (핵심 과업 제목)",
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=True,
            comment="상세 내용 (구체적 역할 및 책임)",
        ),
        sa.Column(
            "status",
            sa.CHAR(1),
            nullable=False,
            server_default="N",
            comment="상태 (N: 미작성, R: 작성중, Y: 확정)",
        ),
        sa.Column(
            "in_user",
            sa.String(20),
            nullable=False,
            comment="등록자",
        ),
        sa.Column(
            "in_date",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
            comment="등록일시 (UTC)",
        ),
        sa.Column(
            "up_user",
            sa.String(20),
            nullable=True,
            comment="수정자",
        ),
        sa.Column(
            "up_date",
            sa.DateTime(),
            nullable=True,
            comment="수정일시 (UTC)",
        ),
        sa.PrimaryKeyConstraint("rr_id", name="pk_tb_rr"),
        sa.ForeignKeyConstraint(
            ["level_id"],
            ["tb_rr_level.level_id"],
            name="fk_tb_rr_level_id_tb_rr_level",
        ),
        sa.ForeignKeyConstraint(
            ["emp_no"],
            ["hr_mgnt.emp_no"],
            name="fk_tb_rr_emp_no_hr_mgnt",
        ),
        sa.ForeignKeyConstraint(
            ["dept_code"],
            ["cm_department.dept_code"],
            name="fk_tb_rr_dept_code_cm_department",
        ),
        sa.ForeignKeyConstraint(
            ["parent_rr_id"],
            ["tb_rr.rr_id"],
            name="fk_tb_rr_parent_rr_id_tb_rr",
        ),
        sa.CheckConstraint(
            "rr_type IN ('COMPANY', 'LEADER', 'MEMBER')",
            name="ck_tb_rr_rr_type",
        ),
        sa.CheckConstraint(
            "status IN ('N', 'R', 'Y')",
            name="ck_tb_rr_status",
        ),
    )

    # tb_rr 인덱스 (로드맵 설계 기준)
    op.create_index("idx_tb_rr_year_emp", "tb_rr", ["year", "emp_no"])
    op.create_index("idx_tb_rr_dept", "tb_rr", ["dept_code", "year"])

    # =============================================
    # 3. tb_rr_period — 업무 기간 테이블
    # =============================================
    op.create_table(
        "tb_rr_period",
        sa.Column(
            "rr_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="R&R ID",
        ),
        sa.Column(
            "seq",
            sa.Integer(),
            nullable=False,
            comment="기간 순서 (1부터 시작)",
        ),
        sa.Column(
            "start_date",
            sa.String(6),
            nullable=False,
            comment="시작월 (YYYYMM)",
        ),
        sa.Column(
            "end_date",
            sa.String(6),
            nullable=False,
            comment="종료월 (YYYYMM)",
        ),
        sa.PrimaryKeyConstraint("rr_id", "seq", name="pk_tb_rr_period"),
        sa.ForeignKeyConstraint(
            ["rr_id"],
            ["tb_rr.rr_id"],
            name="fk_tb_rr_period_rr_id_tb_rr",
            ondelete="CASCADE",
        ),
    )


def downgrade() -> None:
    """
    R&R 테이블 3종 삭제 (역순 삭제)
    """

    # 참조 순서의 역순으로 삭제
    op.drop_table("tb_rr_period")

    op.drop_index("idx_tb_rr_dept", table_name="tb_rr")
    op.drop_index("idx_tb_rr_year_emp", table_name="tb_rr")
    op.drop_table("tb_rr")

    op.drop_table("tb_rr_level")
