"""
Google OAuth 인증 서비스

Google OAuth 2.0 Authorization Code Flow를 구현합니다.
"""

import urllib.parse
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.core.logging import get_logger
from server.app.core.security import create_access_token
from server.app.domain.auth.schemas import (
    GoogleAuthCallbackRequest,
    GoogleAuthResponse,
    GoogleAuthURLResponse,
)
from server.app.domain.common.service import CommonCodeService
from server.app.domain.user.models import User
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
            3. CM_USER 테이블에서 사용자 검증 (존재 여부, use_yn 확인)
            4. 검증 성공 시 로그인 성공 처리

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

            email = user_info.get("email")
            if not email:
                logger.error("Google OAuth에서 이메일을 받지 못했습니다")
                return ServiceResult.fail("이메일 정보를 가져올 수 없습니다")

            # 3. CM_USER 테이블에서 사용자 검증
            user = await self._validate_user_registration(email)
            if user is None:
                logger.warning(
                    "로그인 실패: 등록되지 않은 사용자 또는 비활성 계정",
                    extra={"email": email}
                )
                return ServiceResult.fail("등록되지 않은 사용자이거나 비활성화된 계정입니다")

            # 4. 공통코드 조회 - role_code, position_code를 의미값으로 변환
            code_service = CommonCodeService(self.db)
            role_name = await code_service.get_role_name(user.role_code)
            position_name = await code_service.get_position_name(user.position_code)

            # 코드가 없는 경우 기본값 설정 (에러 방지)
            if not role_name:
                logger.warning(
                    f"역할 코드에 대한 코드명을 찾을 수 없습니다: {user.role_code}",
                    extra={"user_id": user.user_id}
                )
                role_name = user.role_code  # fallback to code itself

            if not position_name:
                logger.warning(
                    f"직급 코드에 대한 코드명을 찾을 수 없습니다: {user.position_code}",
                    extra={"user_id": user.user_id}
                )
                position_name = user.position_code  # fallback to code itself

            # 5. JWT 토큰 생성
            jwt_payload = {
                "user_id": user.user_id,
                "email": email,
                "role": role_name,
                "position": position_name,
            }
            access_token = create_access_token(data=jwt_payload)

            # 6. 로그인 성공 로그 출력
            logger.info(
                "로그인 성공",
                extra={
                    "user_id": user.user_id,
                    "email": email,
                    "user_name": user_info.get("name"),
                    "role": role_name,
                    "position": position_name,
                },
            )

            # 7. 성공 응답 반환
            return ServiceResult.ok(
                GoogleAuthResponse(
                    success=True,
                    access_token=access_token,
                    token_type="bearer",
                    user_id=user.user_id,
                    email=email,
                    name=user_info.get("name"),
                    role=role_name,
                    position=position_name,
                    # 메뉴 권한 조회를 위한 코드 추가
                    role_code=user.role_code,
                    position_code=user.position_code,
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

    async def _validate_user_registration(self, email: str) -> Optional[User]:
        """
        이메일을 기반으로 CM_USER 테이블에서 사용자를 검증합니다.

        검증 로직:
            1. 이메일에서 @ 앞 문자열을 추출하여 user_id 생성
            2. CM_USER 테이블에서 user_id로 사용자 조회
            3. 존재하지 않거나 use_yn='N'이면 None 반환
            4. 존재하고 use_yn='Y'이면 User 객체 반환

        Args:
            email: Google 계정 이메일 주소

        Returns:
            Optional[User]: 검증된 사용자 객체 또는 None
        """
        try:
            # 1. 이메일에서 user_id 추출 (@ 앞 문자열)
            if "@" not in email:
                logger.error(f"유효하지 않은 이메일 형식: {email}")
                return None

            user_id = email.split("@")[0]
            logger.info(f"이메일에서 user_id 추출: {user_id}", extra={"email": email})

            # 2. CM_USER 테이블에서 user_id로 조회
            stmt = select(User).where(User.user_id == user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            # 3. 사용자가 존재하지 않는 경우
            if user is None:
                logger.warning(f"CM_USER 테이블에 존재하지 않는 사용자: {user_id}")
                return None

            # 4. use_yn이 'N'인 경우 (비활성 계정)
            if user.use_yn.upper() != 'Y':
                logger.warning(
                    f"비활성화된 계정: {user_id}",
                    extra={"use_yn": user.use_yn}
                )
                return None

            # 5. 검증 성공
            logger.info(
                f"사용자 검증 성공: {user_id}",
                extra={
                    "email": email,
                    "role_code": user.role_code,
                    "position_code": user.position_code,
                }
            )
            return user

        except Exception as e:
            logger.error(
                f"사용자 검증 중 오류 발생: {str(e)}",
                extra={"email": email}
            )
            return None
