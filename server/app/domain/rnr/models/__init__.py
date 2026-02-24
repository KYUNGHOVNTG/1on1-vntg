"""
R&R 도메인 모델

R&R 관리 관련 ORM 모델을 정의합니다.
- RrLevel : tb_rr_level (R&R 레벨)
- Rr      : tb_rr       (R&R 마스터, Self-Reference)
- RrPeriod: tb_rr_period (업무 기간)
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class RrLevel(Base):
    """
    R&R 레벨 테이블 (tb_rr_level)

    R&R의 계층 레벨(전사/부문/본부/센터/팀/파트)을 관리합니다.
    """

    __tablename__ = "tb_rr_level"

    level_id: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="레벨 ID (예: LV2026_0)",
    )

    year: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        comment="기준 연도 (예: 2026)",
    )

    level_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="레벨 명 (전사, 부문, 본부, 센터, 팀, 파트)",
    )

    level_step: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="레벨 순서 (0: Root, 1, 2, 3...)",
    )

    # Relationships
    rr_list: Mapped[List["Rr"]] = relationship(
        "Rr",
        back_populates="level",
    )

    def __repr__(self) -> str:
        return (
            f"<RrLevel(level_id='{self.level_id}', "
            f"year='{self.year}', level_name='{self.level_name}')>"
        )


class Rr(Base):
    """
    R&R 마스터 테이블 (tb_rr)

    직원의 역할 및 책임(R&R) 정보를 관리합니다.
    Self-Reference를 통해 상위 R&R 계층을 표현합니다.
    """

    __tablename__ = "tb_rr"

    __table_args__ = (
        CheckConstraint(
            "rr_type IN ('COMPANY', 'LEADER', 'MEMBER')",
            name="ck_tb_rr_rr_type",
        ),
        CheckConstraint(
            "status IN ('N', 'R', 'Y')",
            name="ck_tb_rr_status",
        ),
        Index("idx_tb_rr_year_emp", "year", "emp_no"),
        Index("idx_tb_rr_dept", "dept_code", "year"),
    )

    rr_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="R&R ID (UUID)",
    )

    year: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        comment="기준 연도 (예: 2026)",
    )

    level_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("tb_rr_level.level_id"),
        nullable=False,
        comment="R&R 레벨 ID",
    )

    emp_no: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("hr_mgnt.emp_no"),
        nullable=False,
        comment="사번",
    )

    dept_code: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("cm_department.dept_code"),
        nullable=False,
        comment="부서 코드",
    )

    rr_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="R&R 유형 (COMPANY: 전사, LEADER: 조직장, MEMBER: 팀원)",
    )

    parent_rr_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_rr.rr_id"),
        nullable=True,
        comment="상위 R&R ID (Self-Reference, 최상위는 NULL)",
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="R&R 명 (핵심 과업 제목)",
    )

    content: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="상세 내용 (구체적 역할 및 책임)",
    )

    status: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default="N",
        comment="상태 (N: 미작성, R: 작성중, Y: 확정)",
    )

    in_user: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="등록자",
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="등록일시 (UTC)",
    )

    up_user: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="수정자",
    )

    up_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="수정일시 (UTC)",
    )

    # Relationships
    level: Mapped["RrLevel"] = relationship(
        "RrLevel",
        back_populates="rr_list",
        foreign_keys=[level_id],
    )

    employee: Mapped["HRMgnt"] = relationship(  # type: ignore[name-defined]
        "HRMgnt",
        foreign_keys=[emp_no],
    )

    department: Mapped["CMDepartment"] = relationship(  # type: ignore[name-defined]
        "CMDepartment",
        foreign_keys=[dept_code],
    )

    # Self-Reference: 하위 R&R 목록
    children: Mapped[List["Rr"]] = relationship(
        "Rr",
        back_populates="parent",
        foreign_keys=[parent_rr_id],
    )

    # Self-Reference: 상위 R&R
    parent: Mapped[Optional["Rr"]] = relationship(
        "Rr",
        back_populates="children",
        remote_side="Rr.rr_id",
        foreign_keys=[parent_rr_id],
    )

    # 업무 기간 목록
    periods: Mapped[List["RrPeriod"]] = relationship(
        "RrPeriod",
        back_populates="rr",
        cascade="all, delete-orphan",
        order_by="RrPeriod.seq",
    )

    def __repr__(self) -> str:
        return (
            f"<Rr(rr_id='{self.rr_id}', "
            f"year='{self.year}', emp_no='{self.emp_no}', "
            f"title='{self.title[:30]}')>"
        )


class RrPeriod(Base):
    """
    R&R 업무 기간 테이블 (tb_rr_period)

    하나의 R&R에 대해 단절된 다중 수행 기간을 관리합니다.
    (예: 1~3월 + 7~12월)
    """

    __tablename__ = "tb_rr_period"

    rr_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_rr.rr_id", ondelete="CASCADE"),
        primary_key=True,
        comment="R&R ID",
    )

    seq: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        comment="기간 순서 (1부터 시작)",
    )

    start_date: Mapped[str] = mapped_column(
        String(6),
        nullable=False,
        comment="시작월 (YYYYMM)",
    )

    end_date: Mapped[str] = mapped_column(
        String(6),
        nullable=False,
        comment="종료월 (YYYYMM)",
    )

    # Relationship
    rr: Mapped["Rr"] = relationship(
        "Rr",
        back_populates="periods",
        foreign_keys=[rr_id],
    )

    def __repr__(self) -> str:
        return (
            f"<RrPeriod(rr_id='{self.rr_id}', "
            f"seq={self.seq}, "
            f"start_date='{self.start_date}', end_date='{self.end_date}')>"
        )


__all__ = ["RrLevel", "Rr", "RrPeriod"]
