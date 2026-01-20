"""
Auth API 라우터

Google OAuth 로그인 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.logging import get_logger
from server.app.domain.auth.schemas import (
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
)
from server.app.domain.auth.service import GoogleAuthService

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get(
    "/google/url",
    response_model=GoogleAuthURLResponse,
    summary="Google OAuth 인증 URL 생성",
    description="Google OAuth 로그인을 위한 인증 URL을 생성합니다.",
)
async def get_google_auth_url(
    db: AsyncSession = Depends(get_db),
) -> GoogleAuthURLResponse:
    """
    Google OAuth 인증 URL을 생성합니다.

    Returns:
        GoogleAuthURLResponse: Google OAuth 인증 URL
    """
    service = GoogleAuthService(db)
    result = service.get_authorization_url()

    if not result.success:
        logger.error(f"Google OAuth URL 생성 실패: {result.error}")
        raise Exception(result.error)

    return result.data


@router.post(
    "/google/callback",
    response_model=GoogleAuthResponse,
    summary="Google OAuth 콜백 처리",
    description="Google OAuth 인증 후 콜백을 처리하고 로그인을 완료합니다.",
)
async def google_auth_callback(
    request: GoogleAuthCallbackRequest,
    db: AsyncSession = Depends(get_db),
) -> GoogleAuthResponse:
    """
    Google OAuth 콜백을 처리합니다.

    Args:
        request: Google OAuth 콜백 요청 (authorization code 포함)
        db: 데이터베이스 세션

    Returns:
        GoogleAuthResponse: 로그인 결과
    """
    service = GoogleAuthService(db)
    result = await service.execute(request)

    if not result.success:
        logger.error(f"Google OAuth 로그인 실패: {result.error}")
        raise Exception(result.error)

    return result.data
