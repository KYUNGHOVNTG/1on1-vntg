"""
FastAPI 공통 의존성 (Dependencies)

라우터에서 사용할 수 있는 재사용 가능한 의존성 함수들을 정의합니다.
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.core.database import get_db
from server.app.core.security import decode_access_token
from server.app.domain.auth.models import RefreshToken


# ====================
# Database Dependency
# ====================


async def get_database_session() -> AsyncSession:
    """
    데이터베이스 세션 의존성

    사용법:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_database_session)):
            ...
    """
    async for session in get_db():
        yield session


# ====================
# Authentication Dependencies
# ====================


# Swagger UI 연동을 위한 Security Scheme 정의
reusable_oauth2 = HTTPBearer()


async def get_current_user_id(
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_database_session)
) -> str:
    """
    JWT 토큰 및 세션을 검증하고 user_id를 반환합니다.

    사용법:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}

    Args:
        token: HTTPAuthorizationCredentials (FastAPI가 자동으로 Bearer 토큰 파싱)
        db: 데이터베이스 세션

    Returns:
        str: 검증된 사용자 ID

    Raises:
        HTTPException: 토큰이 유효하지 않은 경우
    """
    # 1. Authorization 헤더 및 스킴 확인 (HTTPBearer가 처리)
    # token.credentials에 실제 토큰 문자열이 들어있음

    # 3. JWT 디코딩 및 검증
    try:
        payload = decode_access_token(token.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. user_id 및 session_id 추출
    user_id: str = payload.get("user_id")
    session_id: str = payload.get("session_id")  # refresh_token 문자열

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 5. RefreshToken 테이블에서 세션 검증 (session_id로 정확히 매칭)
    if session_id:
        # session_id(refresh_token)로 정확한 세션 조회
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.refresh_token == session_id,
                RefreshToken.user_id == user_id
            )
        )
        session = result.scalar_one_or_none()

        if session and session.revoked_yn == 'Y':
            # 해당 세션이 폐기됨 (다른 곳에서 로그인)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error_code": "SESSION_REVOKED",
                    "message": "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not session:
            # 세션을 찾을 수 없음
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error_code": "SESSION_NOT_FOUND",
                    "message": "세션을 찾을 수 없습니다"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # session_id가 없는 레거시 토큰 - user_id로 검증 (하위 호환)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_yn == 'N'
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            # 세션이 없는 경우, revoked되었는지 확인
            revoked_result = await db.execute(
                select(RefreshToken).where(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked_yn == 'Y'
                ).order_by(RefreshToken.in_date.desc()).limit(1)
            )
            revoked_session = revoked_result.scalar_one_or_none()

            if revoked_session:
                # 세션이 폐기됨 (다른 곳에서 로그인)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error_code": "SESSION_REVOKED",
                        "message": "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
                    },
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                # 세션이 없음 (최초 로그인 필요)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error_code": "SESSION_NOT_FOUND",
                        "message": "세션을 찾을 수 없습니다"
                    },
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # 6. 세션 만료 확인
    if session.is_expired():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "SESSION_EXPIRED",
                "message": "세션이 만료되었습니다"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 7. Idle timeout 확인 (15분)
    if session.is_idle(idle_minutes=15):
        # 세션 폐기
        session.revoke()
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "SESSION_IDLE_TIMEOUT",
                "message": "장시간 사용하지 않아 세션이 만료되었습니다"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 8. 세션 활동 시간 업데이트
    session.update_activity()
    await db.commit()

    # 9. user_id 반환
    return user_id


async def get_current_session_id(
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_database_session)
) -> str:
    """
    JWT 토큰에서 session_id(refresh_token)를 추출합니다.

    Heartbeat API에서 세션 ID만 필요할 때 사용합니다.
    세션 활동 시간 업데이트는 별도로 처리되므로 여기서는 업데이트하지 않습니다.

    사용법:
        @router.post("/heartbeat")
        async def heartbeat(session_id: str = Depends(get_current_session_id)):
            return {"session_id": session_id}

    Args:
        token: HTTPAuthorizationCredentials
        db: 데이터베이스 세션

    Returns:
        str: 세션 ID (refresh_token 문자열)

    Raises:
        HTTPException: 토큰이 유효하지 않은 경우
    """
    # 1. Authorization 헤더 및 스킴 확인 (HTTPBearer가 처리)

    # 3. JWT 디코딩 및 검증
    try:
        payload = decode_access_token(token.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. session_id 추출
    session_id: str = payload.get("session_id")

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session ID not found in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 5. 세션 존재 확인만 수행 (활동 시간 업데이트는 Heartbeat 서비스에서 처리)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.refresh_token == session_id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "SESSION_NOT_FOUND",
                "message": "세션을 찾을 수 없습니다"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    if session.revoked_yn == 'Y':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "SESSION_REVOKED",
                "message": "다른 기기에서 로그인하여 현재 세션이 종료되었습니다"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    return session_id


class AuthenticationChecker:
    """
    인증 검증 클래스 (Legacy, API 키 검증용으로만 사용)

    JWT 토큰 검증은 get_current_user_id() 함수를 사용하세요.
    """

    async def verify_token(self, authorization: Optional[str] = Header(None)) -> dict:
        """
        JWT 토큰을 검증합니다. (Deprecated)

        대신 get_current_user_id()를 사용하세요.
        """
        # get_current_user_id 함수로 위임
        db = next(get_db())
        user_id = await get_current_user_id(authorization, db)
        return {"user_id": user_id}

    async def verify_api_key(self, x_api_key: Optional[str] = Header(None)) -> dict:
        """
        API 키를 검증합니다.

        Args:
            x_api_key: X-API-Key 헤더

        Returns:
            dict: 검증된 클라이언트 정보

        Raises:
            HTTPException: API 키가 유효하지 않은 경우

        TODO: 실제 API 키 검증 로직 구현
            - API 키 형식 검증
            - 데이터베이스에서 키 조회
            - 키 만료 확인
            - 사용량 제한 확인
        """
        if not x_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key missing",
            )

        # TODO: API 키 검증 로직
        # api_key_info = await verify_api_key_in_db(x_api_key)
        # if not api_key_info:
        #     raise HTTPException(...)

        # 스텁: 임시 클라이언트 정보 반환
        return {"client_id": "test_client", "api_key": x_api_key}


# 전역 인증 체커 인스턴스
auth_checker = AuthenticationChecker()


# ====================
# Common Dependencies
# ====================


async def get_current_user(
    user_info: dict = Depends(auth_checker.verify_token),
) -> dict:
    """
    현재 인증된 사용자 정보를 반환합니다.

    사용법:
        @router.get("/me")
        async def get_me(user: dict = Depends(get_current_user)):
            return user

    Args:
        user_info: 검증된 사용자 정보

    Returns:
        dict: 사용자 정보
    """
    return user_info


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """
    선택적 인증: 토큰이 있으면 검증하고, 없으면 None 반환

    공개 API에서 인증된 사용자에게 추가 정보를 제공하고 싶을 때 사용합니다.

    사용법:
        @router.get("/items")
        async def get_items(user: Optional[dict] = Depends(get_optional_current_user)):
            if user:
                # 인증된 사용자용 로직
            else:
                # 비인증 사용자용 로직

    Args:
        authorization: Authorization 헤더

    Returns:
        Optional[dict]: 사용자 정보 또는 None
    """
    if not authorization:
        return None

    try:
        return await auth_checker.verify_token(authorization)
    except HTTPException:
        return None


# ====================
# Pagination Dependencies
# ====================


class PaginationParams:
    """
    페이지네이션 파라미터

    쿼리 파라미터로 전달되는 페이지네이션 정보를 관리합니다.
    """

    def __init__(
        self,
        skip: int = 0,
        limit: int = 100,
    ):
        """
        Args:
            skip: 건너뛸 항목 수 (기본값: 0)
            limit: 가져올 최대 항목 수 (기본값: 100)
        """
        self.skip = max(0, skip)
        self.limit = min(1000, max(1, limit))  # 최대 1000개로 제한


async def get_pagination(
    skip: int = 0,
    limit: int = 100,
) -> PaginationParams:
    """
    페이지네이션 의존성

    사용법:
        @router.get("/items")
        async def get_items(pagination: PaginationParams = Depends(get_pagination)):
            return await get_items_from_db(
                skip=pagination.skip,
                limit=pagination.limit
            )

    Args:
        skip: 건너뛸 항목 수
        limit: 가져올 최대 항목 수

    Returns:
        PaginationParams: 페이지네이션 파라미터
    """
    return PaginationParams(skip=skip, limit=limit)


# ====================
# Request Context Dependencies
# ====================


class RequestContext:
    """
    요청 컨텍스트

    요청과 관련된 메타 정보를 담는 컨텍스트 클래스입니다.
    서비스 계층에서 로깅, 추적 등에 사용할 수 있습니다.
    """

    def __init__(
        self,
        user_id: Optional[int] = None,
        request_id: Optional[str] = None,
        client_ip: Optional[str] = None,
    ):
        """
        Args:
            user_id: 요청한 사용자 ID
            request_id: 요청 추적 ID
            client_ip: 클라이언트 IP 주소
        """
        self.user_id = user_id
        self.request_id = request_id
        self.client_ip = client_ip


async def get_request_context(
    user: Optional[dict] = Depends(get_optional_current_user),
    x_request_id: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
) -> RequestContext:
    """
    요청 컨텍스트 의존성

    사용법:
        @router.post("/items")
        async def create_item(
            context: RequestContext = Depends(get_request_context)
        ):
            # context.user_id, context.request_id 등을 사용

    Args:
        user: 현재 사용자 정보 (선택)
        x_request_id: 요청 추적 ID
        x_forwarded_for: 클라이언트 IP (프록시 경유 시)

    Returns:
        RequestContext: 요청 컨텍스트
    """
    user_id = user.get("user_id") if user else None
    client_ip = x_forwarded_for.split(",")[0] if x_forwarded_for else None

    return RequestContext(
        user_id=user_id,
        request_id=x_request_id,
        client_ip=client_ip,
    )
