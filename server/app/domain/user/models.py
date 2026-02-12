"""
User 도메인 ORM 모델

사용자(사전 등록 직원) 정보를 관리합니다.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, CHAR, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base

if TYPE_CHECKING:
    from server.app.domain.hr.models.employee import HRMgnt


class User(Base):
    """
    사용자 테이블 (cm_user)

    시스템에 사전 등록된 사용자 정보를 관리하는 테이블입니다.
    Google OAuth 로그인 시 이 테이블에 등록된 사용자만 접근 가능합니다.
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
        nullable=False,
        unique=True,
        comment="이메일 주소"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="계정 사용 여부 (Y: 사용, N: 미사용)"
    )

    # 권한 정보
    role_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="시스템 권한 코드 (ROLE)"
    )

    position_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
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
    employee: Mapped[Optional["HRMgnt"]] = relationship(
        "HRMgnt",
        back_populates="user",
        uselist=False
    )

    def __repr__(self) -> str:
        return f"<User(user_id='{self.user_id}', email='{self.email}', use_yn='{self.use_yn}')>"

    def is_active(self) -> bool:
        """계정이 활성 상태인지 확인"""
        return self.use_yn == 'Y'
