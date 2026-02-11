"""
Permission 도메인 Repositories

직책별/사용자별 메뉴 권한 데이터 조회 및 관리 로직을 담당합니다.
"""

from typing import List, Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.menu.models import PositionMenu, UserMenu, Menu
from server.app.domain.common.models import CodeDetail
from server.app.domain.user.models import User
from server.app.shared.base.repository import BaseRepository


class PositionMenuRepository(BaseRepository[str, List[str]]):
    """
    직책별 메뉴 권한 Repository
    
    직책별로 부여된 메뉴 권한을 조회하고 관리합니다.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def provide(self, position_code: str) -> List[str]:
        """
        특정 직책의 메뉴 권한 조회
        
        Args:
            position_code: 직책 코드 (예: P001)
        
        Returns:
            List[str]: 메뉴 코드 목록
        """
        stmt = (
            select(PositionMenu.menu_code)
            .where(PositionMenu.position_code == position_code)
            .order_by(PositionMenu.menu_code)
        )
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]
    
    async def get_all_positions(self) -> List[CodeDetail]:
        """
        전체 직책 목록 조회
        
        공통코드(POSITION)에서 사용 가능한 직책 목록을 조회합니다.
        
        Returns:
            List[CodeDetail]: 직책 코드 목록
        """
        stmt = (
            select(CodeDetail)
            .where(
                CodeDetail.code_type == 'POSITION',
                CodeDetail.use_yn == 'Y'
            )
            .order_by(CodeDetail.sort_seq, CodeDetail.code)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def update_position_menus(
        self,
        position_code: str,
        menu_codes: List[str],
        in_user: str
    ) -> None:
        """
        직책별 메뉴 권한 일괄 수정
        
        기존 권한을 모두 삭제하고 새로운 권한으로 대체합니다.
        
        Args:
            position_code: 직책 코드
            menu_codes: 부여할 메뉴 코드 목록
            in_user: 등록자 ID
        """
        # 1. 기존 권한 삭제
        delete_stmt = delete(PositionMenu).where(
            PositionMenu.position_code == position_code
        )
        await self.db.execute(delete_stmt)
        
        # 2. 새로운 권한 추가
        if menu_codes:
            new_permissions = [
                PositionMenu(
                    position_code=position_code,
                    menu_code=menu_code,
                    in_user=in_user
                )
                for menu_code in menu_codes
            ]
            self.db.add_all(new_permissions)
        
        await self.db.commit()
    
    async def delete_position_menus(self, position_code: str) -> None:
        """
        특정 직책의 모든 메뉴 권한 삭제
        
        Args:
            position_code: 직책 코드
        """
        delete_stmt = delete(PositionMenu).where(
            PositionMenu.position_code == position_code
        )
        await self.db.execute(delete_stmt)
        await self.db.commit()


class UserMenuRepository(BaseRepository[str, List[str]]):
    """
    사용자별 메뉴 권한 Repository
    
    개별 사용자에게 추가로 부여된 메뉴 권한을 조회하고 관리합니다.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def provide(self, user_id: str) -> List[str]:
        """
        특정 사용자의 추가 메뉴 권한 조회
        
        Args:
            user_id: 사용자 ID
        
        Returns:
            List[str]: 메뉴 코드 목록
        """
        stmt = (
            select(UserMenu.menu_code)
            .where(UserMenu.user_id == user_id)
            .order_by(UserMenu.menu_code)
        )
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]
    
    async def get_all_users(self) -> List[User]:
        """
        전체 사용자 목록 조회
        
        Returns:
            List[User]: 사용자 목록
        """
        stmt = (
            select(User)
            .order_by(User.user_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def update_user_menus(
        self,
        user_id: str,
        menu_codes: List[str],
        in_user: str
    ) -> None:
        """
        사용자별 메뉴 권한 일괄 수정
        
        기존 권한을 모두 삭제하고 새로운 권한으로 대체합니다.
        
        Args:
            user_id: 사용자 ID
            menu_codes: 부여할 메뉴 코드 목록
            in_user: 등록자 ID
        """
        # 1. 기존 권한 삭제
        delete_stmt = delete(UserMenu).where(
            UserMenu.user_id == user_id
        )
        await self.db.execute(delete_stmt)
        
        # 2. 새로운 권한 추가
        if menu_codes:
            new_permissions = [
                UserMenu(
                    user_id=user_id,
                    menu_code=menu_code,
                    in_user=in_user
                )
                for menu_code in menu_codes
            ]
            self.db.add_all(new_permissions)
        
        await self.db.commit()
    
    async def delete_user_menus(self, user_id: str) -> None:
        """
        특정 사용자의 모든 추가 메뉴 권한 삭제
        
        Args:
            user_id: 사용자 ID
        """
        delete_stmt = delete(UserMenu).where(
            UserMenu.user_id == user_id
        )
        await self.db.execute(delete_stmt)
        await self.db.commit()


class PermissionMenuRepository(BaseRepository[None, List[Menu]]):
    """
    권한 부여용 메뉴 Repository
    
    권한 관리 화면에서 표시할 전체 메뉴 목록을 조회합니다.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def provide(self, input_data: None = None) -> List[Menu]:
        """
        권한 부여 가능한 전체 메뉴 목록 조회
        
        사용 가능한(use_yn='Y') 모든 메뉴를 조회합니다.
        
        Returns:
            List[Menu]: 메뉴 목록
        """
        stmt = (
            select(Menu)
            .where(Menu.use_yn == 'Y')
            .order_by(Menu.menu_type, Menu.menu_level, Menu.sort_seq)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


# ============================================================================
# Export
# ============================================================================

__all__ = [
    'PositionMenuRepository',
    'UserMenuRepository',
    'PermissionMenuRepository',
]
