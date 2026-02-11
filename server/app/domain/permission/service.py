"""
Permission 도메인 Service

권한 관리 비즈니스 로직을 담당합니다.
"""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.permission.repositories import (
    PositionMenuRepository,
    UserMenuRepository,
    PermissionMenuRepository
)
from server.app.domain.permission.schemas import (
    PositionBasic,
    PositionMenuPermissionResponse,
    UserBasic,
    UserMenuPermissionResponse,
    MenuForPermission
)


class PermissionService:
    """
    권한 관리 서비스
    
    직책별/사용자별 메뉴 권한 조회 및 수정 기능을 제공합니다.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.position_menu_repo = PositionMenuRepository(db)
        self.user_menu_repo = UserMenuRepository(db)
        self.menu_repo = PermissionMenuRepository(db)
    
    # ========================================================================
    # 직책별 권한 관리
    # ========================================================================
    
    async def get_all_positions(self) -> List[PositionBasic]:
        """
        전체 직책 목록 조회
        
        Returns:
            List[PositionBasic]: 직책 목록
        """
        positions = await self.position_menu_repo.get_all_positions()
        return [
            PositionBasic(
                code=pos.code,
                code_name=pos.code_name
            )
            for pos in positions
        ]
    
    async def get_position_menus(self, position_code: str) -> PositionMenuPermissionResponse:
        """
        특정 직책의 메뉴 권한 조회
        
        Args:
            position_code: 직책 코드
        
        Returns:
            PositionMenuPermissionResponse: 메뉴 권한 정보
        """
        menu_codes = await self.position_menu_repo.provide(position_code)
        return PositionMenuPermissionResponse(
            position_code=position_code,
            menu_codes=menu_codes
        )
    
    async def update_position_menus(
        self,
        position_code: str,
        menu_codes: List[str],
        in_user: str
    ) -> PositionMenuPermissionResponse:
        """
        직책별 메뉴 권한 수정
        
        Args:
            position_code: 직책 코드
            menu_codes: 부여할 메뉴 코드 목록
            in_user: 등록자 ID
        
        Returns:
            PositionMenuPermissionResponse: 수정된 메뉴 권한 정보
        """
        await self.position_menu_repo.update_position_menus(
            position_code=position_code,
            menu_codes=menu_codes,
            in_user=in_user
        )
        
        return PositionMenuPermissionResponse(
            position_code=position_code,
            menu_codes=menu_codes
        )
    
    # ========================================================================
    # 사용자별 권한 관리
    # ========================================================================
    
    async def get_all_users(self) -> List[UserBasic]:
        """
        전체 사용자 목록 조회
        
        Returns:
            List[UserBasic]: 사용자 목록
        """
        users = await self.user_menu_repo.get_all_users()
        return [
            UserBasic(
                user_id=user.user_id,
                email=user.email,
                position_code=user.position_code
            )
            for user in users
        ]
    
    async def get_user_menus(self, user_id: str) -> UserMenuPermissionResponse:
        """
        특정 사용자의 추가 메뉴 권한 조회
        
        Args:
            user_id: 사용자 ID
        
        Returns:
            UserMenuPermissionResponse: 메뉴 권한 정보
        """
        menu_codes = await self.user_menu_repo.provide(user_id)
        return UserMenuPermissionResponse(
            user_id=user_id,
            menu_codes=menu_codes
        )
    
    async def update_user_menus(
        self,
        user_id: str,
        menu_codes: List[str],
        in_user: str
    ) -> UserMenuPermissionResponse:
        """
        사용자별 메뉴 권한 수정
        
        Args:
            user_id: 사용자 ID
            menu_codes: 부여할 메뉴 코드 목록
            in_user: 등록자 ID
        
        Returns:
            UserMenuPermissionResponse: 수정된 메뉴 권한 정보
        """
        await self.user_menu_repo.update_user_menus(
            user_id=user_id,
            menu_codes=menu_codes,
            in_user=in_user
        )
        
        return UserMenuPermissionResponse(
            user_id=user_id,
            menu_codes=menu_codes
        )
    
    # ========================================================================
    # 공통
    # ========================================================================
    
    async def get_all_menus(self) -> List[MenuForPermission]:
        """
        권한 부여 가능한 전체 메뉴 목록 조회
        
        Returns:
            List[MenuForPermission]: 메뉴 목록
        """
        menus = await self.menu_repo.provide()
        return [
            MenuForPermission(
                menu_code=menu.menu_code,
                menu_name=menu.menu_name,
                menu_type=menu.menu_type,
                menu_level=menu.menu_level,
                up_menu_code=menu.up_menu_code,
                sort_seq=menu.sort_seq
            )
            for menu in menus
        ]


# ============================================================================
# Export
# ============================================================================

__all__ = ['PermissionService']
