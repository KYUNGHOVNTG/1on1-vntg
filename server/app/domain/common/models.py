"""
Common 도메인 ORM 모델

공통코드 마스터 및 디테일 테이블을 관리합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, SmallInteger, Integer, CHAR, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class CodeMaster(Base):
    """
    공통코드 마스터 테이블 (cm_codemaster)

    코드 타입(ROLE, POSITION, MENU 등)을 정의하는 마스터 테이블입니다.
    """

    __tablename__ = "cm_codemaster"

    # Primary Key
    code_type: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="코드 타입 (ROLE, POSITION, MENU 등)"
    )

    # 기본 정보
    code_type_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="코드 타입명"
    )

    code_len: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        comment="코드 길이"
    )

    rmk: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="비고"
    )

    # 이력 관리
    in_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="등록자"
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        comment="등록일시"
    )

    up_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="수정자"
    )

    up_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="수정일시"
    )

    # Relationships
    code_details = relationship(
        "CodeDetail",
        back_populates="code_master",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CodeMaster(code_type='{self.code_type}', code_type_name='{self.code_type_name}')>"


class CodeDetail(Base):
    """
    공통코드 디테일 테이블 (cm_codedetail)

    각 코드 타입별 상세 코드(HR, TEAM_LEADER 등)를 정의하는 테이블입니다.
    """

    __tablename__ = "cm_codedetail"

    # Composite Primary Key
    code_type: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("cm_codemaster.code_type"),
        primary_key=True,
        comment="코드 타입"
    )

    code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        comment="코드 (CD001 형태)"
    )

    # 기본 정보
    code_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="코드명 (HR, TEAM_LEADER 등)"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="사용여부"
    )

    sort_seq: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="정렬순서"
    )

    rmk: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="비고"
    )

    # 이력 관리
    in_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="등록자"
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        comment="등록일시"
    )

    up_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="수정자"
    )

    up_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="수정일시"
    )

    # Relationships
    code_master = relationship("CodeMaster", back_populates="code_details")

    def __repr__(self) -> str:
        return f"<CodeDetail(code_type='{self.code_type}', code='{self.code}', code_name='{self.code_name}')>"
