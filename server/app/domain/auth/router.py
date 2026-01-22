"""
Auth API 라우터

Google OAuth 로그인 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.auth.schemas import (
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
    LogoutResponse,
    UserInfoResponse,
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.error,
        )

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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.error,
        )

    return result.data


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="로그아웃",
    description="로그아웃을 처리합니다. (클라이언트 측 토큰 제거 필요)",
)
async def logout() -> LogoutResponse:
    """
    로그아웃을 처리합니다.

    Note:
        - Access Token Only 방식이므로 서버 측 세션/토큰 무효화 처리 없음
        - 클라이언트에서 localStorage의 토큰 제거 필요
        - 단순히 200 OK 응답만 반환

    Returns:
        LogoutResponse: 로그아웃 성공 응답
    """
    logger.info("로그아웃 요청 처리")
    return LogoutResponse(success=True, message="로그아웃되었습니다")


@router.get(
    "/me",
    response_model=UserInfoResponse,
    summary="현재 사용자 정보 조회",
    description="JWT 토큰을 검증하고 현재 로그인한 사용자 정보를 반환합니다.",
)
async def get_current_user_info(
    user_id: str = Depends(get_current_user_id),
) -> UserInfoResponse:
    """
    현재 인증된 사용자 정보를 조회합니다.

    이 엔드포인트는 JWT 토큰 검증 및 세션 검증을 테스트하기 위한 용도입니다.

    Args:
        user_id: 검증된 사용자 ID (Dependency에서 자동 주입)

    Returns:
        UserInfoResponse: 사용자 정보

    Raises:
        HTTPException 401: 토큰이 유효하지 않거나 세션이 만료된 경우
    """
    logger.info(f"사용자 정보 조회: user_id={user_id}")

    return UserInfoResponse(
        user_id=user_id,
        message="인증 성공"
    )
