"""
User 도메인 ORM 모델

사용자(사전 등록 직원) 정보를 관리합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, CHAR, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class User(Base):
    """
    사용자 테이블 (cm_user)

    사전 등록된 직원 정보를 관리하는 테이블입니다.
    OAuth 로그인 시 이메일을 통해 사용자를 식별하고 권한을 부여합니다.
    """

    __tablename__ = "cm_user"

    # Primary Key
    user_id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        comment="사용자 ID (이메일 @ 앞부분)"
    )

    # 기본 정보
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        comment="이메일"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="사용여부"
    )

    # 권한 정보
    role_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="역할 코드 (CD001 - ROLE)"
    )

    position_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="직책 코드 (CD101 - POSITION)"
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

    def __repr__(self) -> str:
        return f"<User(user_id='{self.user_id}', email='{self.email}', position_code='{self.position_code}')>"
