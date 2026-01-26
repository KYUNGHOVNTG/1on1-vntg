"""
Auth API 라우터

Google OAuth 로그인 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.auth.schemas import (
    CheckActiveSessionRequest,
    CheckActiveSessionResponse,
    CompleteForceLoginRequest,
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
    LogoutResponse,
    RevokeSessionRequest,
    RevokeSessionResponse,
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
    "/check-active-session",
    response_model=CheckActiveSessionResponse,
    summary="활성 세션 확인",
    description="사용자의 활성 세션이 있는지 확인합니다.",
)
async def check_active_session(
    request: CheckActiveSessionRequest,
    db: AsyncSession = Depends(get_db),
) -> CheckActiveSessionResponse:
    """
    사용자의 활성 세션을 확인합니다.

    Args:
        request: 활성 세션 확인 요청
        db: 데이터베이스 세션

    Returns:
        CheckActiveSessionResponse: 활성 세션 정보
    """
    service = SessionService(db)
    result = await service.check_active_session(request.user_id)

    logger.info(
        f"활성 세션 확인 완료: user_id={request.user_id}, has_active={result.has_active_session}"
    )

    return result


@router.post(
    "/revoke-session",
    response_model=RevokeSessionResponse,
    summary="세션 폐기",
    description="사용자의 모든 활성 세션을 폐기합니다. (동시접속 제어용)",
)
async def revoke_session(
    request: RevokeSessionRequest,
    db: AsyncSession = Depends(get_db),
) -> RevokeSessionResponse:
    """
    사용자의 모든 활성 세션을 폐기합니다.

    Args:
        request: 세션 폐기 요청
        db: 데이터베이스 세션

    Returns:
        RevokeSessionResponse: 폐기 결과
    """
    if not request.revoke_previous:
        return RevokeSessionResponse(
            success=True,
            message="세션 폐기가 요청되지 않았습니다"
        )

    service = SessionService(db)
    result = await service.revoke_previous_sessions(request.user_id)

    logger.info(
        f"세션 폐기 완료: user_id={request.user_id}, success={result.success}"
    )

    return result


@router.post(
    "/complete-force-login",
    response_model=GoogleAuthResponse,
    summary="강제 로그인 완료",
    description="기존 세션을 폐기하고 임시 저장된 토큰으로 로그인을 완료합니다.",
)
async def complete_force_login(
    request: CompleteForceLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> GoogleAuthResponse:
    """
    강제 로그인을 완료합니다.

    동시접속 감지 후 사용자가 "기존 세션 종료하고 로그인"을 선택했을 때 호출됩니다.
    1. 기존 세션 폐기
    2. 임시 저장된 토큰으로 새 세션 생성
    3. 토큰 반환

    Args:
        request: 강제 로그인 요청 (user_id 포함)
        db: 데이터베이스 세션

    Returns:
        GoogleAuthResponse: 로그인 결과

    Raises:
        HTTPException 401: 임시 저장된 토큰이 없거나 만료된 경우
    """
    logger.info(f"강제 로그인 요청: user_id={request.user_id}")

    service = SessionService(db)
    result = await service.complete_force_login(request.user_id)

    if not result.success:
        logger.error(f"강제 로그인 실패: {result.error}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.error,
        )

    logger.info(f"강제 로그인 성공: user_id={request.user_id}")
    return result.data
