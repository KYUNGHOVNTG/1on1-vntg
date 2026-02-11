"""
Auth API 라우터

Google OAuth 로그인 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id, get_current_session_id
from server.app.core.logging import get_logger
from server.app.domain.auth.schemas import (
    CleanupExpiredSessionsResponse,
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
    HeartbeatResponse,
    LogoutResponse,
    SessionStatsResponse,
    UserInfoResponse,
)
from server.app.domain.auth.service import GoogleAuthService, SessionService

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
    description="Google OAuth 인증 후 콜백을 처리하고 로그인을 완료합니다. 기존 활성 세션이 있으면 세션 정보를 반환합니다.",
)
async def google_auth_callback(
    callback_request: GoogleAuthCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> GoogleAuthResponse:
    """
    Google OAuth 콜백을 처리합니다.

    Args:
        callback_request: Google OAuth 콜백 요청 (authorization code 포함)
        request: FastAPI Request 객체 (헤더 정보 추출용)
        db: 데이터베이스 세션

    Returns:
        GoogleAuthResponse: 로그인 결과
            - has_active_session=True인 경우: 기존 세션 정보 반환, 토큰 없음
            - has_active_session=False인 경우: 새로운 토큰 생성 및 세션 생성
    """
    # Request에서 device_info (User-Agent)와 ip_address 추출
    device_info = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    # X-Forwarded-For 헤더 확인 (프록시 경유 시)
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()

    logger.info(
        "Google OAuth 콜백 수신",
        extra={
            "device_info": device_info,
            "ip_address": ip_address
        }
    )

    service = GoogleAuthService(db)
    result = await service.execute(
        callback_request,
        device_info=device_info,
        ip_address=ip_address
    )

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


@router.post(
    "/session/heartbeat",
    response_model=HeartbeatResponse,
    summary="Heartbeat (세션 활성 유지)",
    description="세션의 마지막 활동 시간을 업데이트하여 Idle Timeout을 방지합니다. 1분 이내 중복 요청은 무시됩니다.",
)
async def session_heartbeat(
    session_id: str = Depends(get_current_session_id),
    db: AsyncSession = Depends(get_db),
) -> HeartbeatResponse:
    """
    Heartbeat를 처리하여 세션을 활성 상태로 유지합니다.

    Args:
        session_id: 현재 세션 ID (JWT에서 자동 추출)
        db: 데이터베이스 세션

    Returns:
        HeartbeatResponse: Heartbeat 처리 결과
    """
    service = SessionService(db)
    result = await service.update_heartbeat(session_id)

    logger.info(
        f"Heartbeat 처리: success={result['success']}",
        extra={"last_activity_at": result.get("last_activity_at")}
    )

    return HeartbeatResponse(
        success=result["success"],
        last_activity_at=result.get("last_activity_at"),
        message=result.get("message", ""),
    )


@router.get(
    "/session/stats",
    response_model=SessionStatsResponse,
    summary="세션 통계 조회",
    description="현재 활성 세션, Idle 세션, 전체 세션 수를 조회합니다. (관리자용)",
)
async def get_session_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> SessionStatsResponse:
    """
    세션 통계를 조회합니다.

    Args:
        user_id: 검증된 사용자 ID (Dependency에서 자동 주입)
        db: 데이터베이스 세션

    Returns:
        SessionStatsResponse: 세션 통계 정보
    """
    service = SessionService(db)
    stats = await service.get_session_stats()

    return SessionStatsResponse(
        active_sessions=stats["active_sessions"],
        idle_sessions=stats["idle_sessions"],
        total_sessions=stats["total_sessions"],
    )


@router.post(
    "/session/cleanup",
    response_model=CleanupExpiredSessionsResponse,
    summary="만료 세션 정리",
    description="Idle 상태인 세션을 정리합니다. 기본적으로 15분 이상 비활동 세션을 폐기합니다. (관리자용)",
)
async def cleanup_expired_sessions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> CleanupExpiredSessionsResponse:
    """
    만료된 세션을 수동으로 정리합니다.

    Args:
        user_id: 검증된 사용자 ID (Dependency에서 자동 주입)
        db: 데이터베이스 세션

    Returns:
        CleanupExpiredSessionsResponse: 정리 결과
    """
    service = SessionService(db)
    result = await service.cleanup_expired_sessions()

    logger.info(
        f"만료 세션 정리 요청 by user_id={user_id}: cleaned_count={result['cleaned_count']}"
    )

    return CleanupExpiredSessionsResponse(
        success=result["success"],
        cleaned_count=result["cleaned_count"],
        message=result.get("message", ""),
    )
