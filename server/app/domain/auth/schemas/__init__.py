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



class LogoutResponse(BaseModel):
    """로그아웃 응답"""

    success: bool = Field(default=True, description="로그아웃 성공 여부")
    message: str = Field(default="로그아웃되었습니다", description="응답 메시지")


class UserInfoResponse(BaseModel):
    """현재 사용자 정보 응답"""

    user_id: str = Field(..., description="사용자 ID")
    email: str | None = Field(None, description="사용자 이메일")
    name: str | None = Field(None, description="사용자 이름 (Google OAuth)")
    role_code: str | None = Field(None, description="역할 코드 (R001, R002 등)")
    position_code: str | None = Field(None, description="직급 코드 (P001, P002 등)")
    emp_no: str | None = Field(None, description="사번 (hr_mgnt)")
    dept_code: str | None = Field(None, description="부서 코드")
    dept_name: str | None = Field(None, description="부서명")
    name_kor: str | None = Field(None, description="한글 이름 (hr_mgnt)")
    message: str = Field(default="인증 성공", description="응답 메시지")


class HeartbeatResponse(BaseModel):
    """Heartbeat 응답"""

    success: bool = Field(..., description="Heartbeat 처리 성공 여부")
    last_activity_at: str | None = Field(None, description="마지막 활동 시간 (ISO 8601)")
    message: str = Field(default="Heartbeat 수신", description="응답 메시지")


class SessionStatsResponse(BaseModel):
    """세션 통계 응답"""

    active_sessions: int = Field(..., description="활성 세션 수")
    idle_sessions: int = Field(..., description="Idle 상태 세션 수 (15분 이상 비활동)")
    total_sessions: int = Field(..., description="전체 세션 수 (revoked 포함)")


class CleanupExpiredSessionsResponse(BaseModel):
    """만료 세션 정리 응답"""

    success: bool = Field(..., description="정리 성공 여부")
    cleaned_count: int = Field(..., description="정리된 세션 수")
    message: str = Field(default="", description="응답 메시지")


__all__ = [
    "GoogleAuthURLResponse",
    "GoogleAuthCallbackRequest",
    "GoogleAuthResponse",
    "LogoutResponse",
    "UserInfoResponse",
    "SessionInfo",
    "HeartbeatResponse",
    "SessionStatsResponse",
    "CleanupExpiredSessionsResponse",
]
