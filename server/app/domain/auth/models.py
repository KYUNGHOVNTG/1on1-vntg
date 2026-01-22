"""
Auth 도메인 ORM 모델

인증 토큰 관리 테이블을 담당합니다.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import String, CHAR, DateTime, Text
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

    # 세션 관리
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        comment="마지막 활동 시간 (Idle Timeout 체크용)"
    )

    device_info: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="디바이스 정보 (User-Agent)"
    )

    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        comment="로그인 IP 주소 (IPv6 지원)"
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

    # 세션 관리 메서드
    def is_active(self) -> bool:
        """
        세션이 활성 상태인지 확인

        Returns:
            bool: 세션이 활성 상태면 True (폐기되지 않았고, 만료되지 않음)
        """
        return self.revoked_yn == 'N' and not self.is_expired()

    def is_idle(self, idle_minutes: int = 15) -> bool:
        """
        세션이 idle 상태인지 확인

        Args:
            idle_minutes: idle로 간주할 분 단위 (기본 15분)

        Returns:
            bool: 마지막 활동 이후 idle_minutes 이상 경과하면 True
        """
        idle_threshold = datetime.now() - timedelta(minutes=idle_minutes)
        return self.last_activity_at < idle_threshold

    def update_activity(self) -> None:
        """
        세션 활동 시간 업데이트
        API 호출 시 호출하여 idle timeout 방지
        """
        self.last_activity_at = datetime.now()

    def get_session_info(self) -> dict:
        """
        세션 정보 반환 (UX용)

        Returns:
            dict: 세션 정보 (device_info, ip_address, created_at, last_activity_at)
        """
        return {
            "device_info": self.device_info,
            "ip_address": self.ip_address,
            "created_at": self.in_date.isoformat() if self.in_date else None,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None,
        }
