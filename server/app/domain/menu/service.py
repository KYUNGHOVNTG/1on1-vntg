"""
Menu 도메인 Service

메뉴 조회 및 권한 기반 메뉴 필터링 비즈니스 로직을 제공합니다.
"""

from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.domain.menu.models import Menu
from server.app.domain.menu.repositories import MenuRepository
from server.app.domain.menu.schemas import (
    MenuHierarchyResponse,
    UserMenuRequest,
    UserMenuResponse,
)
from server.app.shared.base.service import BaseService
from server.app.shared.types import ServiceResult

logger = get_logger(__name__)


class MenuService(BaseService[UserMenuRequest, UserMenuResponse]):
    """
    메뉴 서비스

    사용자 권한에 따른 메뉴 조회 및 계층 구조 메뉴를 제공합니다.
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 데이터베이스 세션
        """
        super().__init__(db)
        self.repository = MenuRepository(db)

    async def execute(
        self,
        request: UserMenuRequest,
        **kwargs
    ) -> ServiceResult[UserMenuResponse]:
        """
        사용자가 접근 가능한 메뉴를 조회합니다.

        직책별 메뉴 권한과 개인별 예외 권한을 결합하여
        계층 구조 메뉴 트리를 반환합니다.

        Args:
            request: 사용자 메뉴 조회 요청 (user_id, position_code)
            **kwargs: 추가 컨텍스트 정보

        Returns:
            ServiceResult[UserMenuResponse]: 메뉴 목록 및 개수
        """
        try:
            # 1. 사용자가 접근 가능한 메뉴 조회
            menus = await self.repository.get_menus_by_user(
                user_id=request.user_id,
                position_code=request.position_code
            )

            # 2. 계층 구조로 변환
            hierarchy = self._build_menu_hierarchy(menus)

            # 3. 응답 생성
            response = UserMenuResponse(
                menus=[
                    MenuHierarchyResponse.model_validate(menu)
                    for menu in hierarchy
                ],
                total_count=len(menus)
            )

            logger.info(
                f"Successfully retrieved {len(menus)} menus for user",
                extra={
                    "user_id": request.user_id,
                    "position_code": request.position_code,
                    "menu_count": len(menus)
                }
            )

            return ServiceResult.ok(response)

        except Exception as e:
            logger.error(
                f"Failed to retrieve menus for user: {str(e)}",
                extra={
                    "user_id": request.user_id,
                    "position_code": request.position_code,
                    "error": str(e)
                }
            )
            return ServiceResult.fail(f"메뉴 조회 중 오류가 발생했습니다: {str(e)}")

    async def get_menu_hierarchy_by_codes(
        self,
        menu_codes: Optional[List[str]] = None
    ) -> ServiceResult[List[MenuHierarchyResponse]]:
        """
        특정 메뉴 코드들의 계층 구조를 조회합니다.

        Args:
            menu_codes: 조회할 메뉴 코드 목록 (None이면 전체 조회)

        Returns:
            ServiceResult[List[MenuHierarchyResponse]]: 계층 구조 메뉴 목록
        """
        try:
            # 1. 최상위 메뉴 조회 (children 포함)
            top_level_menus = await self.repository.get_menu_hierarchy(menu_codes)

            # 2. 응답 변환
            hierarchy = [
                MenuHierarchyResponse.model_validate(menu)
                for menu in top_level_menus
            ]

            logger.info(
                f"Successfully retrieved menu hierarchy",
                extra={
                    "menu_codes": menu_codes,
                    "top_level_count": len(top_level_menus)
                }
            )

            return ServiceResult.ok(hierarchy)

        except Exception as e:
            logger.error(
                f"Failed to retrieve menu hierarchy: {str(e)}",
                extra={
                    "menu_codes": menu_codes,
                    "error": str(e)
                }
            )
            return ServiceResult.fail(f"메뉴 계층 구조 조회 중 오류가 발생했습니다: {str(e)}")

    def _build_menu_hierarchy(self, menus: List[Menu]) -> List[Menu]:
        """
        Flat한 메뉴 리스트를 계층 구조로 변환합니다.

        Args:
            menus: 메뉴 리스트

        Returns:
            List[Menu]: 최상위 메뉴 목록 (children에 하위 메뉴 포함)
        """
        # 메뉴 코드로 빠른 조회를 위한 딕셔너리
        menu_dict = {menu.menu_code: menu for menu in menus}

        # 최상위 메뉴만 필터링 (menu_level == 1 또는 up_menu_code가 None)
        top_level_menus = [
            menu for menu in menus
            if menu.menu_level == 1 or menu.up_menu_code is None
        ]

        # 각 메뉴의 children 재구성
        for menu in menus:
            if menu.up_menu_code and menu.up_menu_code in menu_dict:
                parent = menu_dict[menu.up_menu_code]
                # children이 리스트가 아니면 초기화
                if not isinstance(parent.children, list):
                    parent.children = []
                # 중복 방지
                if menu not in parent.children:
                    parent.children.append(menu)

        # sort_seq 순서로 정렬
        for menu in menus:
            if hasattr(menu, 'children') and menu.children:
                menu.children.sort(key=lambda x: x.sort_seq or 0)

        # 최상위 메뉴도 정렬
        top_level_menus.sort(key=lambda x: x.sort_seq or 0)

        return top_level_menus
