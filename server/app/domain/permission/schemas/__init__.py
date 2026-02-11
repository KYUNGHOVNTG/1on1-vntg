"""
Permission 도메인 Schemas (Request/Response DTO)

권한 관리 API의 요청/응답 데이터 구조를 정의합니다.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# 공통 응답 모델
# ============================================================================

class MenuForPermission(BaseModel):
    """
    권한 부여용 메뉴 정보
    
    권한 관리 화면에서 표시할 메뉴 정보를 담습니다.
    """
    menu_code: str = Field(..., description="메뉴 코드")
    menu_name: str = Field(..., description="메뉴명")
    menu_type: str = Field(..., description="메뉴 타입 (COMMON/ADMIN)")
    menu_level: int = Field(..., description="메뉴 레벨 (1: 상위, 2: 하위)")
    up_menu_code: Optional[str] = Field(None, description="상위 메뉴 코드")
    sort_seq: Optional[int] = Field(None, description="정렬 순서")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 직책 관련 모델
# ============================================================================

class PositionBasic(BaseModel):
    """
    직책 기본 정보
    
    공통코드(POSITION)에서 조회한 직책 정보입니다.
    """
    code: str = Field(..., description="직책 코드 (예: P001)")
    code_name: str = Field(..., description="직책명 (예: HR)")
    
    model_config = ConfigDict(from_attributes=True)


class PositionMenuPermissionResponse(BaseModel):
    """
    직책별 메뉴 권한 조회 응답
    
    특정 직책이 접근 가능한 메뉴 코드 목록을 반환합니다.
    """
    position_code: str = Field(..., description="직책 코드")
    menu_codes: List[str] = Field(default_factory=list, description="접근 가능한 메뉴 코드 목록")


class PositionMenuPermissionUpdateRequest(BaseModel):
    """
    직책별 메뉴 권한 수정 요청
    
    직책의 메뉴 권한을 일괄 수정합니다.
    기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
    """
    menu_codes: List[str] = Field(..., description="부여할 메뉴 코드 목록")


# ============================================================================
# 사용자 관련 모델
# ============================================================================

class UserBasic(BaseModel):
    """
    사용자 기본 정보
    
    권한 관리를 위한 최소한의 사용자 정보입니다.
    """
    user_id: str = Field(..., description="사용자 ID")
    email: str = Field(..., description="이메일")
    position_code: str = Field(..., description="직책 코드")
    
    model_config = ConfigDict(from_attributes=True)


class UserMenuPermissionResponse(BaseModel):
    """
    사용자별 메뉴 권한 조회 응답
    
    특정 사용자에게 추가로 부여된 메뉴 코드 목록을 반환합니다.
    (직책별 권한은 포함되지 않음)
    """
    user_id: str = Field(..., description="사용자 ID")
    menu_codes: List[str] = Field(default_factory=list, description="추가 부여된 메뉴 코드 목록")


class UserMenuPermissionUpdateRequest(BaseModel):
    """
    사용자별 메뉴 권한 수정 요청
    
    사용자의 추가 메뉴 권한을 일괄 수정합니다.
    기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
    """
    menu_codes: List[str] = Field(..., description="부여할 메뉴 코드 목록")


# ============================================================================
# Export
# ============================================================================

__all__ = [
    'MenuForPermission',
    'PositionBasic',
    'PositionMenuPermissionResponse',
    'PositionMenuPermissionUpdateRequest',
    'UserBasic',
    'UserMenuPermissionResponse',
    'UserMenuPermissionUpdateRequest',
]
