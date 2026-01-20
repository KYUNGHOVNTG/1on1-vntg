"""
Menu 도메인 Schemas (Pydantic DTO)

Request/Response 데이터 전송 객체를 정의합니다.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class MenuBase(BaseModel):
    """메뉴 기본 스키마"""

    menu_code: str = Field(..., description="메뉴 코드 (예: M001)")
    menu_name: str = Field(..., description="메뉴명")
    sort_seq: Optional[int] = Field(None, description="정렬순서")
    use_yn: str = Field(default='Y', description="사용여부 (Y/N)")
    rmk: Optional[str] = Field(None, description="비고")

    # 계층 구조 필드
    up_menu_code: Optional[str] = Field(None, description="상위 메뉴 코드 (NULL: 최상위)")
    menu_level: int = Field(default=1, description="메뉴 깊이 (1: 최상위, 2: 2차...)")
    menu_url: Optional[str] = Field(None, description="프론트엔드 라우팅 경로")

    model_config = ConfigDict(from_attributes=True)


class MenuResponse(MenuBase):
    """메뉴 응답 스키마"""

    in_user: Optional[str] = Field(None, description="등록자")
    in_date: datetime = Field(..., description="등록일시")
    up_user: Optional[str] = Field(None, description="수정자")
    up_date: Optional[datetime] = Field(None, description="수정일시")


class MenuHierarchyResponse(MenuBase):
    """계층 구조 메뉴 응답 스키마 (재귀적 구조)"""

    children: List["MenuHierarchyResponse"] = Field(
        default_factory=list,
        description="하위 메뉴 목록"
    )

    model_config = ConfigDict(from_attributes=True)


class UserMenuRequest(BaseModel):
    """사용자 메뉴 조회 요청 스키마"""

    user_id: str = Field(..., description="사용자 ID")
    position_code: str = Field(..., description="직책 코드 (예: P001)")

    model_config = ConfigDict(from_attributes=True)


class UserMenuResponse(BaseModel):
    """사용자 메뉴 조회 응답 스키마"""

    menus: List[MenuHierarchyResponse] = Field(
        default_factory=list,
        description="사용자가 접근 가능한 메뉴 목록"
    )
    total_count: int = Field(..., description="전체 메뉴 개수")

    model_config = ConfigDict(from_attributes=True)


class MenuCreateRequest(BaseModel):
    """메뉴 생성 요청 스키마"""

    menu_code: str = Field(..., description="메뉴 코드 (예: M005)")
    menu_name: str = Field(..., description="메뉴명")
    up_menu_code: Optional[str] = Field(None, description="상위 메뉴 코드")
    menu_level: int = Field(default=1, ge=1, le=5, description="메뉴 깊이 (1~5)")
    menu_url: Optional[str] = Field(None, description="프론트엔드 라우팅 경로")
    sort_seq: Optional[int] = Field(None, description="정렬순서")
    use_yn: str = Field(default='Y', pattern='^[YN]$', description="사용여부 (Y/N)")
    rmk: Optional[str] = Field(None, max_length=500, description="비고")

    model_config = ConfigDict(from_attributes=True)


class MenuUpdateRequest(BaseModel):
    """메뉴 수정 요청 스키마"""

    menu_name: Optional[str] = Field(None, description="메뉴명")
    up_menu_code: Optional[str] = Field(None, description="상위 메뉴 코드")
    menu_level: Optional[int] = Field(None, ge=1, le=5, description="메뉴 깊이 (1~5)")
    menu_url: Optional[str] = Field(None, description="프론트엔드 라우팅 경로")
    sort_seq: Optional[int] = Field(None, description="정렬순서")
    use_yn: Optional[str] = Field(None, pattern='^[YN]$', description="사용여부 (Y/N)")
    rmk: Optional[str] = Field(None, max_length=500, description="비고")

    model_config = ConfigDict(from_attributes=True)
