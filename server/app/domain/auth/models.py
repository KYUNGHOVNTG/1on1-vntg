"""
Auth 도메인 ORM 모델

인증 토큰 관리 테이블을 담당합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, CHAR, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class RefreshToken(Base):
    """
    Refresh Token 테이블 (auth_refresh_token)

    JWT 토큰 갱신을 위한 Refresh Token을 관리하는 테이블입니다.
    Access Token이 만료되었을 때 새로운 토큰을 발급받기 위해 사용됩니다.
    """

    __tablename__ = "auth_refresh_token"

    # Primary Key
    refresh_token: Mapped[str] = mapped_column(
        String(255),
        primary_key=True,
        comment="Refresh Token"
    )

    # 기본 정보
    user_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="사용자 ID"
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        comment="만료일시"
    )

    revoked_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='N',
        comment="폐기여부"
    )

    # 이력 관리
    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        comment="등록일시"
    )

    def __repr__(self) -> str:
        return f"<RefreshToken(user_id='{self.user_id}', expires_at={self.expires_at}, revoked_yn='{self.revoked_yn}')>"

    def is_expired(self) -> bool:
        """토큰이 만료되었는지 확인"""
        return datetime.now() > self.expires_at

    def is_valid(self) -> bool:
        """토큰이 유효한지 확인 (만료되지 않았고 폐기되지 않음)"""
        return not self.is_expired() and self.revoked_yn == 'N'

    def revoke(self) -> None:
        """토큰을 폐기"""
        self.revoked_yn = 'Y'
