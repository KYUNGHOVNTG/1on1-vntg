"""
Google OAuth 인증 서비스

Google OAuth 2.0 Authorization Code Flow를 구현합니다.
"""

import urllib.parse
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.core.logging import get_logger
from server.app.domain.auth.schemas import (
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
)
from server.app.shared.base.service import BaseService
from server.app.shared.exceptions import (
    ExternalServiceException,
    UnauthorizedException,
)
from server.app.shared.types import ServiceResult

logger = get_logger(__name__)


class GoogleAuthService(BaseService[GoogleAuthCallbackRequest, GoogleAuthResponse]):
    """
    Google OAuth 인증 서비스

    책임:
        - Google OAuth 인증 URL 생성
        - Authorization Code를 Access Token으로 교환
        - Access Token으로 사용자 정보 조회
    """

    # Google OAuth 2.0 엔드포인트
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 데이터베이스 세션 (현재는 사용하지 않음)
        """
        super().__init__(db)

    def get_authorization_url(self) -> ServiceResult[GoogleAuthURLResponse]:
        """
        Google OAuth 인증 URL을 생성합니다.

        Returns:
            ServiceResult[GoogleAuthURLResponse]: 인증 URL
        """
        try:
            params = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "response_type": "code",
                "scope": "openid email profile",
                "access_type": "offline",
                "prompt": "consent",
            }

            auth_url = f"{self.GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

            logger.info("Google OAuth 인증 URL 생성 성공")

            return ServiceResult.ok(GoogleAuthURLResponse(auth_url=auth_url))

        except Exception as e:
            logger.error(f"Google OAuth 인증 URL 생성 실패: {str(e)}")
            return ServiceResult.fail(f"인증 URL 생성 실패: {str(e)}")

    async def execute(
        self, request: GoogleAuthCallbackRequest, **kwargs: Any
    ) -> ServiceResult[GoogleAuthResponse]:
        """
        Google OAuth 콜백을 처리하고 사용자 정보를 반환합니다.

        흐름:
            1. Authorization Code를 Access Token으로 교환
            2. Access Token으로 사용자 정보 조회
            3. 성공 여부 반환

        Args:
            request: Google OAuth 콜백 요청 (authorization code 포함)
            **kwargs: 추가 컨텍스트 정보

        Returns:
            ServiceResult[GoogleAuthResponse]: 로그인 결과
        """
        try:
            # 1. Authorization Code → Access Token 교환
            access_token = await self._exchange_code_for_token(request.code)

            # 2. Access Token → 사용자 정보 조회
            user_info = await self._get_user_info(access_token)

            # 3. 성공 로그 출력 (작업 요구사항)
            logger.info(
                "google_login_success",
                extra={
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                },
            )

            # 4. 성공 응답 반환
            return ServiceResult.ok(
                GoogleAuthResponse(
                    success=True,
                    email=user_info.get("email"),
                    name=user_info.get("name"),
                )
            )

        except UnauthorizedException as e:
            logger.warning(f"Google OAuth 인증 실패: {e.message}")
            return ServiceResult.fail(e.message)

        except ExternalServiceException as e:
            logger.error(f"Google OAuth 서비스 오류: {e.message}")
            return ServiceResult.fail(e.message)

        except Exception as e:
            logger.error(f"Google OAuth 처리 중 예상치 못한 오류: {str(e)}")
            return ServiceResult.fail(f"로그인 처리 실패: {str(e)}")

    async def _exchange_code_for_token(self, code: str) -> str:
        """
        Authorization Code를 Access Token으로 교환합니다.

        Args:
            code: Google OAuth Authorization Code

        Returns:
            str: Access Token

        Raises:
            UnauthorizedException: 인증 코드가 유효하지 않은 경우
            ExternalServiceException: Google API 호출 실패
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.GOOGLE_TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                        "grant_type": "authorization_code",
                    },
                    timeout=10.0,
                )

                if response.status_code != 200:
                    raise UnauthorizedException(
                        "유효하지 않은 인증 코드입니다",
                        details={"status_code": response.status_code},
                    )

                token_data = response.json()
                access_token = token_data.get("access_token")

                if not access_token:
                    raise ExternalServiceException(
                        "Access Token을 받지 못했습니다",
                        details={"response": token_data},
                    )

                logger.info("Access Token 교환 성공")
                return access_token

        except httpx.TimeoutException:
            raise ExternalServiceException(
                "Google 인증 서버 응답 시간 초과",
                details={"timeout": 10.0},
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(
                f"Google 인증 서버 연결 실패: {str(e)}",
                details={"error": str(e)},
            )

    async def _get_user_info(self, access_token: str) -> dict[str, Any]:
        """
        Access Token으로 사용자 정보를 조회합니다.

        Args:
            access_token: Google OAuth Access Token

        Returns:
            dict: 사용자 정보 (email, name 등)

        Raises:
            ExternalServiceException: Google API 호출 실패
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )

                if response.status_code != 200:
                    raise ExternalServiceException(
                        "사용자 정보 조회 실패",
                        details={"status_code": response.status_code},
                    )

                user_info = response.json()

                logger.info("사용자 정보 조회 성공", extra={"email": user_info.get("email")})

                return user_info

        except httpx.TimeoutException:
            raise ExternalServiceException(
                "Google API 응답 시간 초과",
                details={"timeout": 10.0},
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(
                f"Google API 연결 실패: {str(e)}",
                details={"error": str(e)},
            )
