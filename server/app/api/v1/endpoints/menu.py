"""
Menu API 엔드포인트
메뉴 조회 및 권한 기반 메뉴 필터링 API
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.menu.schemas import (
    MenuHierarchyResponse,
    UserMenuRequest,
    UserMenuResponse,
)
from server.app.domain.menu.service import MenuService

logger = get_logger(__name__)

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get(
    "/user/{user_id}",
    response_model=UserMenuResponse,
    summary="사용자별 메뉴 조회",
    description="사용자가 접근 가능한 메뉴를 계층 구조로 조회합니다. 직책별 권한과 개인별 예외 권한을 결합하여 반환합니다.",
)
async def get_user_menus(
    user_id: str,
    position_code: str = Query(..., description="직책 코드 (예: P001)"),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),  # 세션 검증
) -> UserMenuResponse:
    """
    사용자별 메뉴 조회

    사용자의 직책(position_code)에 따른 메뉴 권한과
    개인별 예외 메뉴 권한을 결합하여 조회합니다.

    Args:
        user_id: 사용자 ID
        position_code: 직책 코드 (예: P001)
        db: 데이터베이스 세션 (자동 주입)

    Returns:
        UserMenuResponse: 메뉴 목록 및 개수

    Raises:
        HTTPException: 메뉴 조회 실패 시 500 에러
    """
    try:
        service = MenuService(db)
        request = UserMenuRequest(
            user_id=user_id,
            position_code=position_code
        )

        result = await service.execute(request)

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=result.error or "메뉴 조회에 실패했습니다."
            )

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_user_menus: {str(e)}",
            extra={
                "user_id": user_id,
                "position_code": position_code,
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"메뉴 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get(
    "/hierarchy",
    response_model=List[MenuHierarchyResponse],
    summary="메뉴 계층 구조 조회",
    description="전체 메뉴 또는 특정 메뉴들의 계층 구조를 조회합니다. 최상위 메뉴만 반환되며, 하위 메뉴는 children 필드에 포함됩니다.",
)
async def get_menu_hierarchy(
    menu_codes: Optional[str] = Query(
        None,
        description="조회할 메뉴 코드 (쉼표로 구분, 예: M001,M002)"
    ),
    db: AsyncSession = Depends(get_db),
) -> List[MenuHierarchyResponse]:
    """
    메뉴 계층 구조 조회

    전체 메뉴 또는 특정 메뉴 코드들의 계층 구조를 조회합니다.
    최상위 메뉴만 반환되며, 하위 메뉴는 children 필드에 재귀적으로 포함됩니다.

    Args:
        menu_codes: 조회할 메뉴 코드 (쉼표로 구분, 선택사항)
        db: 데이터베이스 세션 (자동 주입)

    Returns:
        List[MenuHierarchyResponse]: 계층 구조 메뉴 목록

    Raises:
        HTTPException: 메뉴 조회 실패 시 500 에러
    """
    try:
        service = MenuService(db)

        # 쉼표로 구분된 메뉴 코드를 리스트로 변환
        menu_code_list = None
        if menu_codes:
            menu_code_list = [code.strip() for code in menu_codes.split(",")]

        result = await service.get_menu_hierarchy_by_codes(menu_code_list)

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=result.error or "메뉴 계층 구조 조회에 실패했습니다."
            )

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_menu_hierarchy: {str(e)}",
            extra={
                "menu_codes": menu_codes,
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"메뉴 계층 구조 조회 중 오류가 발생했습니다: {str(e)}"
        )
