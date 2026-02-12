"""
HR 도메인 - 사용자(계정) 모델

CM_USER 테이블: 1on1 시스템 계정 정보를 관리합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, CHAR, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class CMUser(Base):
    """
    사용자 계정 테이블 (cm_user)

    1on1 시스템의 사용자 계정 정보를 관리합니다.
    인사정보(HR_MGNT)와 1:1 관계를 가집니다.
    """

    __tablename__ = "cm_user"

    # Primary Key
    user_id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        comment="사용자 ID"
    )

    # 기본 정보
    email: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        comment="이메일"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="사용여부"
    )

    # 권한 정보
    role_code: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        comment="시스템 권한 코드 (ROLE)"
    )

    position_code: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        comment="직책 코드 (POSITION)"
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
        default=datetime.utcnow,
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
    employee = relationship(
        "HRMgnt",
        back_populates="user",
        uselist=False,
        foreign_keys="HRMgnt.user_id"
    )

    def __repr__(self) -> str:
        return f"<CMUser(user_id='{self.user_id}', email='{self.email}')>"
