"""
Pending Login Store

동시접속 감지 시 토큰을 임시 저장하는 메모리 캐시입니다.
사용자가 "기존 세션 종료하고 로그인"을 선택하면 저장된 토큰으로 로그인을 완료합니다.
"""

import time
from dataclasses import dataclass
from typing import Optional

from server.app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class PendingLoginData:
    """임시 저장되는 로그인 데이터"""

    user_id: str
    email: str
    name: Optional[str]
    role: str
    position: str
    role_code: str
    position_code: str
    access_token: str
    refresh_token: str
    device_info: Optional[str]
    ip_address: Optional[str]
    created_at: float  # timestamp


class PendingLoginStore:
    """
    임시 로그인 데이터 저장소 (싱글톤)

    동시접속 감지 시 발급된 토큰을 임시 저장합니다.
    TTL(Time-To-Live) 후 자동으로 만료됩니다.
    """

    _instance: Optional["PendingLoginStore"] = None
    _store: dict[str, PendingLoginData] = {}
    TTL_SECONDS = 300  # 5분

    def __new__(cls) -> "PendingLoginStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._store = {}
        return cls._instance

    def save(self, user_id: str, data: PendingLoginData) -> None:
        """
        임시 로그인 데이터를 저장합니다.

        Args:
            user_id: 사용자 ID
            data: 임시 로그인 데이터
        """
        self._cleanup_expired()
        self._store[user_id] = data
        logger.info(
            f"Pending login 저장: user_id={user_id}",
            extra={"user_id": user_id, "ttl_seconds": self.TTL_SECONDS},
        )

    def get(self, user_id: str) -> Optional[PendingLoginData]:
        """
        임시 로그인 데이터를 조회합니다.

        Args:
            user_id: 사용자 ID

        Returns:
            PendingLoginData 또는 None (만료되었거나 없는 경우)
        """
        self._cleanup_expired()
        data = self._store.get(user_id)

        if data is None:
            logger.debug(f"Pending login 없음: user_id={user_id}")
            return None

        # TTL 확인
        if time.time() - data.created_at > self.TTL_SECONDS:
            self.remove(user_id)
            logger.info(f"Pending login 만료됨: user_id={user_id}")
            return None

        return data

    def remove(self, user_id: str) -> bool:
        """
        임시 로그인 데이터를 삭제합니다.

        Args:
            user_id: 사용자 ID

        Returns:
            삭제 성공 여부
        """
        if user_id in self._store:
            del self._store[user_id]
            logger.info(f"Pending login 삭제: user_id={user_id}")
            return True
        return False

    def _cleanup_expired(self) -> None:
        """만료된 항목을 정리합니다."""
        now = time.time()
        expired_keys = [
            key
            for key, data in self._store.items()
            if now - data.created_at > self.TTL_SECONDS
        ]
        for key in expired_keys:
            del self._store[key]

        if expired_keys:
            logger.debug(f"만료된 pending login 정리: {len(expired_keys)}개")


# 싱글톤 인스턴스
pending_login_store = PendingLoginStore()
