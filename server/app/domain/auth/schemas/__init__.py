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


class SessionInfo(BaseModel):
    """세션 정보"""

    device_info: str | None = Field(None, description="디바이스 정보 (User-Agent)")
    ip_address: str | None = Field(None, description="로그인 IP 주소")
    created_at: str | None = Field(None, description="세션 생성 시간 (ISO 8601)")
    last_activity_at: str | None = Field(None, description="마지막 활동 시간 (ISO 8601)")


class GoogleAuthResponse(BaseModel):
    """Google OAuth 로그인 응답"""

    success: bool = Field(..., description="로그인 성공 여부")
    access_token: str | None = Field(None, description="JWT Access Token")
    refresh_token: str | None = Field(None, description="JWT Refresh Token")
    token_type: str = Field(default="bearer", description="토큰 타입")
    user_id: str | None = Field(None, description="사용자 ID")
    email: str | None = Field(None, description="사용자 이메일")
    name: str | None = Field(None, description="사용자 이름")
    role: str | None = Field(None, description="역할 (HR, GENERAL 등)")
    position: str | None = Field(None, description="직급 (TEAM_LEADER, MEMBER 등)")
    role_code: str | None = Field(None, description="역할 코드 (R001, R002 등)")
    position_code: str | None = Field(None, description="직급 코드 (P001, P002 등)")
    has_active_session: bool = Field(default=False, description="기존 활성 세션 존재 여부")
    existing_session_info: SessionInfo | None = Field(None, description="기존 세션 정보")



class LogoutResponse(BaseModel):
    """로그아웃 응답"""

    success: bool = Field(default=True, description="로그아웃 성공 여부")
    message: str = Field(default="로그아웃되었습니다", description="응답 메시지")


class UserInfoResponse(BaseModel):
    """현재 사용자 정보 응답"""

    user_id: str = Field(..., description="사용자 ID")
    email: str | None = Field(None, description="사용자 이메일")
    name: str | None = Field(None, description="사용자 이름")
    message: str = Field(default="인증 성공", description="응답 메시지")


class CheckActiveSessionRequest(BaseModel):
    """활성 세션 확인 요청"""

    user_id: str = Field(..., description="사용자 ID")


class CheckActiveSessionResponse(BaseModel):
    """활성 세션 확인 응답"""

    has_active_session: bool = Field(..., description="활성 세션 존재 여부")
    session_info: SessionInfo | None = Field(None, description="세션 정보")


class RevokeSessionRequest(BaseModel):
    """세션 폐기 요청"""

    user_id: str = Field(..., description="사용자 ID")
    revoke_previous: bool = Field(default=True, description="기존 세션 폐기 여부")


class RevokeSessionResponse(BaseModel):
    """세션 폐기 응답"""

    success: bool = Field(..., description="폐기 성공 여부")
    message: str = Field(default="세션이 폐기되었습니다", description="응답 메시지")


__all__ = [
    "GoogleAuthURLResponse",
    "GoogleAuthCallbackRequest",
    "GoogleAuthResponse",
    "LogoutResponse",
    "UserInfoResponse",
    "SessionInfo",
    "CheckActiveSessionRequest",
    "CheckActiveSessionResponse",
    "RevokeSessionRequest",
    "RevokeSessionResponse",
]
