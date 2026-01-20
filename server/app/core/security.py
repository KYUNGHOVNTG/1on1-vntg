"""
보안 관련 유틸리티

JWT 토큰 생성 및 검증 기능을 제공합니다.
"""

from datetime import datetime, timedelta
from typing import Any

from jose import jwt

from server.app.core.config import settings


# JWT 알고리즘
ALGORITHM = "HS256"


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    JWT Access Token을 생성합니다.

    Args:
        data: JWT payload에 담을 데이터
        expires_delta: 토큰 만료 시간 (기본값: settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    Returns:
        str: 생성된 JWT 토큰
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """
    JWT Access Token을 검증하고 디코딩합니다.

    Args:
        token: JWT 토큰

    Returns:
        dict: 디코딩된 payload

    Raises:
        JWTError: 토큰이 유효하지 않은 경우
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[ALGORITHM]
    )
    return payload
