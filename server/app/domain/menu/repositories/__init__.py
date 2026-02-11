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
        position_code: str,
        role_code: str = 'R002'
    ) -> List[Menu]:
        """
        사용자가 접근 가능한 메뉴 조회

        역할(role_code)에 따라 메뉴를 분기합니다:
        - 일반 사용자(R002): COMMON 메뉴만 (직책별 + 개인별 예외)
        - 시스템 관리자(R001): COMMON 메뉴 (직책별 + 개인별 예외) + ADMIN 메뉴 전체

        Args:
            user_id: 사용자 ID
            position_code: 직책 코드 (예: P001)
            role_code: 역할 코드 (예: R001=시스템 관리자, R002=일반 사용자)

        Returns:
            List[Menu]: 사용자가 접근 가능한 메뉴 목록
        """
        # 1. COMMON 메뉴: 직책별 메뉴 조회
        position_menu_stmt = (
            select(Menu.menu_code)
            .join(PositionMenu, Menu.menu_code == PositionMenu.menu_code)
            .where(
                and_(
                    PositionMenu.position_code == position_code,
                    Menu.menu_type == 'COMMON'
                )
            )
        )

        # 2. COMMON 메뉴: 개인별 예외 메뉴 조회
        user_menu_stmt = (
            select(Menu.menu_code)
            .join(UserMenu, Menu.menu_code == UserMenu.menu_code)
            .where(
                and_(
                    UserMenu.user_id == user_id,
                    Menu.menu_type == 'COMMON'
                )
            )
        )

        # 3. COMMON 메뉴 코드 결합
        common_menu_codes_stmt = position_menu_stmt.union(user_menu_stmt)
        common_menu_codes_result = await self.db.execute(common_menu_codes_stmt)
        menu_codes = [row[0] for row in common_menu_codes_result.all()]

        # 4. ADMIN 메뉴: 시스템 관리자(R001)인 경우 전체 ADMIN 메뉴 추가
        if role_code == 'R001':
            admin_menu_stmt = (
                select(Menu.menu_code)
                .where(
                    and_(
                        Menu.menu_type == 'ADMIN',
                        Menu.use_yn == 'Y'
                    )
                )
            )
            admin_menu_result = await self.db.execute(admin_menu_stmt)
            admin_menu_codes = [row[0] for row in admin_menu_result.all()]
            menu_codes = list(set(menu_codes + admin_menu_codes))

        # 5. 메뉴 코드로 메뉴 정보 조회
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
            .order_by(Menu.menu_type, Menu.menu_level, Menu.sort_seq)
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

    async def create(self, menu: Menu) -> Menu:
        """
        메뉴 생성

        Args:
            menu: 생성할 메뉴 객체

        Returns:
            Menu: 생성된 메뉴 객체
        """
        self.db.add(menu)
        await self.db.commit()
        await self.db.refresh(menu)
        return menu

    async def update(self, menu: Menu) -> Menu:
        """
        메뉴 수정

        Args:
            menu: 수정할 메뉴 객체

        Returns:
            Menu: 수정된 메뉴 객체 (변경된 값 반영됨)
        """
        # SQLAlchemy 객체가 세션에 attach되어 있다면 commit 시 자동 반영됨
        if menu not in self.db:
             await self.db.merge(menu)
        await self.db.commit()
        await self.db.refresh(menu)
        return menu

    async def delete(self, menu: Menu) -> None:
        """
        메뉴 삭제

        Args:
            menu: 삭제할 메뉴 객체
        """
        await self.db.delete(menu)
        await self.db.commit()
