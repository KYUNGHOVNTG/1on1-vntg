"""
Auth 스키마

Google OAuth 로그인 요청/응답 스키마를 정의합니다.
"""

from pydantic import BaseModel, Field


class GoogleAuthURLResponse(BaseModel):
    """Google OAuth 인증 URL 응답"""

    auth_url: str = Field(..., description="Google OAuth 인증 URL")


class GoogleAuthCallbackRequest(BaseModel):
    """Google OAuth 콜백 요청"""

    code: str = Field(..., description="Google OAuth 인증 코드")


class GoogleAuthResponse(BaseModel):
    """Google OAuth 로그인 응답"""

    success: bool = Field(..., description="로그인 성공 여부")
    email: str | None = Field(None, description="사용자 이메일")
    name: str | None = Field(None, description="사용자 이름")


__all__ = [
    "GoogleAuthURLResponse",
    "GoogleAuthCallbackRequest",
    "GoogleAuthResponse",
]
