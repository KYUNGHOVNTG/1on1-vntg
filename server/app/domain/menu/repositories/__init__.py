"""
Menu 도메인 Repositories
메뉴 데이터 조회 로직
"""

from typing import List, Optional

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.app.domain.menu.models import Menu, PositionMenu, UserMenu
from server.app.shared.base.repository import BaseRepository


class MenuRepository(BaseRepository[Optional[str], List[Menu]]):
    """
    메뉴 데이터 조회 Repository

    사용자 권한에 따른 메뉴 조회 및 계층 구조 메뉴를 제공합니다.
    """

    def __init__(self, db: AsyncSession):
        super().__init__(db)

    async def provide(self, input_data: Optional[str] = None) -> List[Menu]:
        """
        전체 메뉴 목록 조회 (사용 가능한 메뉴만)

        Args:
            input_data: 사용하지 않음

        Returns:
            List[Menu]: 전체 메뉴 목록
        """
        stmt = (
            select(Menu)
            .where(Menu.use_yn == 'Y')
            .order_by(Menu.menu_level, Menu.sort_seq)
            .options(selectinload(Menu.children))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_menu_by_code(self, menu_code: str) -> Optional[Menu]:
        """
        메뉴 코드로 단일 메뉴 조회

        Args:
            menu_code: 메뉴 코드 (예: M001)

        Returns:
            Optional[Menu]: 메뉴 객체 또는 None
        """
        stmt = (
            select(Menu)
            .where(Menu.menu_code == menu_code)
            .options(selectinload(Menu.children), selectinload(Menu.parent))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_menus_by_user(
        self,
        user_id: str,
        position_code: str
    ) -> List[Menu]:
        """
        사용자가 접근 가능한 메뉴 조회

        직책별 메뉴 권한(cm_position_menu)과
        개인별 예외 권한(cm_user_menu)을 결합하여 조회합니다.

        Args:
            user_id: 사용자 ID
            position_code: 직책 코드 (예: P001)

        Returns:
            List[Menu]: 사용자가 접근 가능한 메뉴 목록
        """
        # 1. 직책별 메뉴 조회
        position_menu_stmt = (
            select(Menu.menu_code)
            .join(PositionMenu, Menu.menu_code == PositionMenu.menu_code)
            .where(PositionMenu.position_code == position_code)
        )

        # 2. 개인별 예외 메뉴 조회
        user_menu_stmt = (
            select(Menu.menu_code)
            .join(UserMenu, Menu.menu_code == UserMenu.menu_code)
            .where(UserMenu.user_id == user_id)
        )

        # 3. 두 조건을 OR로 결합
        menu_codes_stmt = position_menu_stmt.union(user_menu_stmt)
        menu_codes_result = await self.db.execute(menu_codes_stmt)
        menu_codes = [row[0] for row in menu_codes_result.all()]

        # 4. 메뉴 코드로 메뉴 정보 조회
        if not menu_codes:
            return []

        menus_stmt = (
            select(Menu)
            .where(
                and_(
                    Menu.menu_code.in_(menu_codes),
                    Menu.use_yn == 'Y'
                )
            )
            .order_by(Menu.menu_level, Menu.sort_seq)
            .options(selectinload(Menu.children))
        )
        result = await self.db.execute(menus_stmt)
        return list(result.scalars().all())

    async def get_menu_hierarchy(
        self,
        menu_codes: Optional[List[str]] = None
    ) -> List[Menu]:
        """
        계층 구조 메뉴 트리 조회 (최상위 메뉴만 반환, 하위 메뉴는 children에 포함)

        Args:
            menu_codes: 필터링할 메뉴 코드 목록 (None이면 전체 조회)

        Returns:
            List[Menu]: 최상위 메뉴 목록 (children에 하위 메뉴 포함)
        """
        conditions = [
            Menu.use_yn == 'Y',
            Menu.menu_level == 1  # 최상위 메뉴만
        ]

        if menu_codes:
            conditions.append(Menu.menu_code.in_(menu_codes))

        stmt = (
            select(Menu)
            .where(and_(*conditions))
            .order_by(Menu.sort_seq)
            .options(selectinload(Menu.children))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_children_menus(
        self,
        parent_menu_code: str
    ) -> List[Menu]:
        """
        특정 메뉴의 하위 메뉴 조회

        Args:
            parent_menu_code: 상위 메뉴 코드

        Returns:
            List[Menu]: 하위 메뉴 목록
        """
        stmt = (
            select(Menu)
            .where(
                and_(
                    Menu.up_menu_code == parent_menu_code,
                    Menu.use_yn == 'Y'
                )
            )
            .order_by(Menu.sort_seq)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
