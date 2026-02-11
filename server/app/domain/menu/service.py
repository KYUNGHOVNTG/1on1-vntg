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
    MenuCreateRequest,
    MenuUpdateRequest,
    MenuResponse,
)
from server.app.shared.exceptions import (
    ValidationException,
    NotFoundException,
    BusinessLogicException,
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
            request: 사용자 메뉴 조회 요청 (user_id, position_code, role_code)
            **kwargs: 추가 컨텍스트 정보

        Returns:
            ServiceResult[UserMenuResponse]: 메뉴 목록 및 개수
        """
        try:
            # 1. 사용자가 접근 가능한 메뉴 조회 (역할 기반 분기 포함)
            menus = await self.repository.get_menus_by_user(
                user_id=request.user_id,
                position_code=request.position_code,
                role_code=request.role_code
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
                    "role_code": request.role_code,
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
                    "role_code": request.role_code,
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
            # 1. 모든 메뉴 조회 (계층 구조 빌드를 위해 필요)
            # provide()는 selectinload(Menu.children)을 포함하고 있어 모든 레벨의 관계가 로드됩니다.
            all_menus = await self.repository.provide()

            # 2. 계층 구조 빌드
            # (이 과정에서 menu.children이 리스트로 채워지며, SQLAlchemy의 Lazy Loading을 방지합니다)
            full_hierarchy = self._build_menu_hierarchy(all_menus)

            # 3. 요청된 메뉴 코드가 있으면 필터링 (최상위 레벨 기준)
            if menu_codes:
                top_level_menus = [
                    menu for menu in full_hierarchy
                    if menu.menu_code in menu_codes
                ]
            else:
                top_level_menus = full_hierarchy

            # 4. 응답 변환
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

    async def create_menu(
        self,
        request: MenuCreateRequest
    ) -> ServiceResult[MenuResponse]:
        """
        메뉴를 생성합니다.

        Args:
            request: 메뉴 생성 요청 데이터

        Returns:
            ServiceResult[MenuResponse]: 생성된 메뉴 정보
        """
        try:
            # 1. 중복 확인
            existing_menu = await self.repository.get_menu_by_code(request.menu_code)
            if existing_menu:
                raise ValidationException(f"이미 존재하는 메뉴 코드입니다: {request.menu_code}")

            # 2. 상위 메뉴 확인
            if request.up_menu_code:
                parent_menu = await self.repository.get_menu_by_code(request.up_menu_code)
                if not parent_menu:
                    raise ValidationException(f"상위 메뉴를 찾을 수 없습니다: {request.up_menu_code}")
                
                # 레벨 검증 (상위 메뉴 레벨 + 1)
                if request.menu_level != parent_menu.menu_level + 1:
                    raise ValidationException(
                        f"메뉴 레벨이 올바르지 않습니다. 상위 메뉴 레벨: {parent_menu.menu_level}, 요청 레벨: {request.menu_level}"
                    )
            elif request.menu_level != 1:
                 raise ValidationException("상위 메뉴가 없는 경우 메뉴 레벨은 1이어야 합니다.")

            # 3. 메뉴 생성
            menu = Menu(
                menu_code=request.menu_code,
                menu_name=request.menu_name,
                sort_seq=request.sort_seq,
                use_yn=request.use_yn,
                rmk=request.rmk,
                up_menu_code=request.up_menu_code,
                menu_level=request.menu_level,
                menu_url=request.menu_url,
                menu_type='COMMON'  # 기본값, 필요 시 request에 추가
            )

            created_menu = await self.repository.create(menu)
            
            logger.info(
                f"Menu created successfully: {menu.menu_code}",
                extra={"menu_code": menu.menu_code, "menu_name": menu.menu_name}
            )

            return ServiceResult.ok(MenuResponse.model_validate(created_menu))

        except ApplicationException:
            raise
        except Exception as e:
            logger.error(f"Failed to create menu: {str(e)}", extra={"error": str(e)})
            return ServiceResult.fail(f"메뉴 생성 중 오류가 발생했습니다: {str(e)}")

    async def update_menu(
        self,
        menu_code: str,
        request: MenuUpdateRequest
    ) -> ServiceResult[MenuResponse]:
        """
        메뉴를 수정합니다.

        Args:
            menu_code: 수정할 메뉴 코드
            request: 메뉴 수정 요청 데이터

        Returns:
            ServiceResult[MenuResponse]: 수정된 메뉴 정보
        """
        try:
            # 1. 메뉴 조회
            menu = await self.repository.get_menu_by_code(menu_code)
            if not menu:
                raise NotFoundException(f"메뉴를 찾을 수 없습니다: {menu_code}")

            # 2. 상위 메뉴 변경 시 유효성 검사
            if request.up_menu_code and request.up_menu_code != menu.up_menu_code:
                # 자기 자신이나 하위 메뉴를 상위 메뉴로 설정 불가
                if request.up_menu_code == menu_code:
                     raise ValidationException("자기 자신을 상위 메뉴로 설정할 수 없습니다.")
                
                # 순환 참조 방지 로직 필요하나 2단계 제한이므로 간단히 처리
                parent_menu = await self.repository.get_menu_by_code(request.up_menu_code)
                if not parent_menu:
                    raise ValidationException(f"상위 메뉴를 찾을 수 없습니다: {request.up_menu_code}")
                
                # 레벨 자동 조정 또는 검증
                # 여기서는 request.menu_level이 주어지면 검증, 아니면 자동 조정도 가능하지만
                # 명확성을 위해 request 값 우선 검증
                if request.menu_level and request.menu_level != parent_menu.menu_level + 1:
                     raise ValidationException(
                        f"메뉴 레벨이 상위 메뉴와 일치하지 않습니다. 상위: {parent_menu.menu_level}, 요청: {request.menu_level}"
                    )

            # 3. 데이터 업데이트
            update_data = request.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(menu, key, value)
            
            # 4. 저장
            updated_menu = await self.repository.update(menu)

            logger.info(
                f"Menu updated successfully: {menu_code}",
                extra={"menu_code": menu_code, "updates": update_data}
            )

            return ServiceResult.ok(MenuResponse.model_validate(updated_menu))

        except ApplicationException:
            raise
        except Exception as e:
            logger.error(f"Failed to update menu: {str(e)}", extra={"error": str(e)})
            return ServiceResult.fail(f"메뉴 수정 중 오류가 발생했습니다: {str(e)}")

    async def delete_menu(self, menu_code: str) -> ServiceResult[None]:
        """
        메뉴를 삭제합니다.

        Args:
            menu_code: 삭제할 메뉴 코드

        Returns:
            ServiceResult[None]: 성공 여부
        """
        try:
            # 1. 메뉴 조회
            menu = await self.repository.get_menu_by_code(menu_code)
            if not menu:
                raise NotFoundException(f"메뉴를 찾을 수 없습니다: {menu_code}")

            # 2. 하위 메뉴 존재 여부 확인
            children = await self.repository.get_children_menus(menu_code)
            if children:
                raise BusinessLogicException(
                    f"하위 메뉴가 존재하여 삭제할 수 없습니다. 하위 메뉴: {[c.menu_name for c in children]}"
                )

            # 3. 삭제
            await self.repository.delete(menu)

            logger.info(f"Menu deleted successfully: {menu_code}")

            return ServiceResult.ok(None)

        except ApplicationException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete menu: {str(e)}", extra={"error": str(e)})
            return ServiceResult.fail(f"메뉴 삭제 중 오류가 발생했습니다: {str(e)}")
