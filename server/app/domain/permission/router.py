"""
Permission 도메인 Router

권한 관리 API 엔드포인트를 정의합니다.
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.domain.permission.service import PermissionService
from server.app.domain.permission.schemas import (
    PositionBasic,
    PositionMenuPermissionResponse,
    PositionMenuPermissionUpdateRequest,
    UserBasic,
    UserMenuPermissionResponse,
    UserMenuPermissionUpdateRequest,
    MenuForPermission
)

router = APIRouter(prefix="/permissions", tags=["permissions"])


# ============================================================================
# 직책별 권한 관리
# ============================================================================

@router.get(
    "/positions",
    response_model=List[PositionBasic],
    summary="전체 직책 목록 조회",
    description="권한 관리를 위한 전체 직책 목록을 조회합니다."
)
async def get_positions(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    전체 직책 목록 조회
    
    공통코드(POSITION)에서 사용 가능한 직책 목록을 조회합니다.
    """
    service = PermissionService(db)
    return await service.get_all_positions()


@router.get(
    "/positions/{position_code}/menus",
    response_model=PositionMenuPermissionResponse,
    summary="직책별 메뉴 권한 조회",
    description="특정 직책이 접근 가능한 메뉴 목록을 조회합니다."
)
async def get_position_menus(
    position_code: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    직책별 메뉴 권한 조회
    
    Args:
        position_code: 직책 코드 (예: P001)
    
    Returns:
        PositionMenuPermissionResponse: 메뉴 권한 정보
    """
    service = PermissionService(db)
    return await service.get_position_menus(position_code)


@router.put(
    "/positions/{position_code}/menus",
    response_model=PositionMenuPermissionResponse,
    status_code=status.HTTP_200_OK,
    summary="직책별 메뉴 권한 수정",
    description="직책의 메뉴 권한을 일괄 수정합니다. 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다."
)
async def update_position_menus(
    position_code: str,
    request: PositionMenuPermissionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    직책별 메뉴 권한 수정
    
    Args:
        position_code: 직책 코드 (예: P001)
        request: 메뉴 권한 수정 요청
    
    Returns:
        PositionMenuPermissionResponse: 수정된 메뉴 권한 정보
    """
    service = PermissionService(db)
    return await service.update_position_menus(
        position_code=position_code,
        menu_codes=request.menu_codes,
        in_user=current_user_id
    )


# ============================================================================
# 사용자별 권한 관리
# ============================================================================

@router.get(
    "/users",
    response_model=List[UserBasic],
    summary="전체 사용자 목록 조회",
    description="권한 관리를 위한 전체 사용자 목록을 조회합니다."
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    전체 사용자 목록 조회
    
    Returns:
        List[UserBasic]: 사용자 목록
    """
    service = PermissionService(db)
    return await service.get_all_users()


@router.get(
    "/users/{user_id}/menus",
    response_model=UserMenuPermissionResponse,
    summary="사용자별 메뉴 권한 조회",
    description="특정 사용자에게 추가로 부여된 메뉴 목록을 조회합니다. (직책별 권한은 포함되지 않음)"
)
async def get_user_menus(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    사용자별 메뉴 권한 조회
    
    Args:
        user_id: 사용자 ID
    
    Returns:
        UserMenuPermissionResponse: 메뉴 권한 정보
    """
    service = PermissionService(db)
    return await service.get_user_menus(user_id)


@router.put(
    "/users/{user_id}/menus",
    response_model=UserMenuPermissionResponse,
    status_code=status.HTTP_200_OK,
    summary="사용자별 메뉴 권한 수정",
    description="사용자의 추가 메뉴 권한을 일괄 수정합니다. 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다."
)
async def update_user_menus(
    user_id: str,
    request: UserMenuPermissionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    사용자별 메뉴 권한 수정
    
    Args:
        user_id: 사용자 ID
        request: 메뉴 권한 수정 요청
    
    Returns:
        UserMenuPermissionResponse: 수정된 메뉴 권한 정보
    """
    service = PermissionService(db)
    return await service.update_user_menus(
        user_id=user_id,
        menu_codes=request.menu_codes,
        in_user=current_user_id
    )


# ============================================================================
# 공통
# ============================================================================

@router.get(
    "/menus",
    response_model=List[MenuForPermission],
    summary="권한 부여 가능한 전체 메뉴 조회",
    description="권한 관리 화면에서 표시할 전체 메뉴 목록을 조회합니다."
)
async def get_menus(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    권한 부여 가능한 전체 메뉴 조회
    
    Returns:
        List[MenuForPermission]: 메뉴 목록
    """
    service = PermissionService(db)
    return await service.get_all_menus()


# ============================================================================
# Export
# ============================================================================

__all__ = ['router']
