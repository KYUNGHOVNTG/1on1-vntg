"""
공통코드 서비스

공통코드 조회 및 변환 기능을 제공합니다.

아키텍처:
    - Service: 흐름 제어 및 트랜잭션 관리
    - Repository: DB 조회 로직
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.common.repositories import CommonCodeRepository


class CommonCodeService:
    """
    공통코드 조회 서비스
    
    책임:
        - 공통코드 조회 흐름 제어
        - 트랜잭션 관리
        - Repository 조율
        
    원칙:
        - Repository에 DB 조회 로직 위임
        - 비즈니스 로직은 최소화 (단순 CRUD)
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repository = CommonCodeRepository(db)

    async def get_code_name(self, code_type: str, code: str) -> Optional[str]:
        """
        공통코드의 code_name (의미값)을 조회합니다.

        Args:
            code_type: 코드 타입 (ROLE, POSITION 등)
            code: 코드 (CD001, CD002 등)

        Returns:
            str | None: 코드명 (HR, TEAM_LEADER 등) 또는 None
        """
        code_detail = await self.repository.get_code_by_type_and_code(code_type, code)
        return code_detail.code_name if code_detail else None

    async def get_role_name(self, role_code: str) -> Optional[str]:
        """
        역할 코드의 의미값을 조회합니다.

        Args:
            role_code: 역할 코드 (CD001 등)

        Returns:
            str | None: 역할명 (HR, GENERAL 등) 또는 None
        """
        return await self.get_code_name("ROLE", role_code)

    async def get_position_name(self, position_code: str) -> Optional[str]:
        """
        직급 코드의 의미값을 조회합니다.

        Args:
            position_code: 직급 코드 (CD101 등)

        Returns:
            str | None: 직급명 (TEAM_LEADER, MEMBER 등) 또는 None
        """
        return await self.get_code_name("POSITION", position_code)

    async def get_all_masters(self) -> list[object]:
        """
        모든 공통코드 마스터 목록을 조회합니다.

        Returns:
            list[CodeMaster]: 마스터 코드 목록
        """
        return await self.repository.get_all_masters()

    async def get_details_by_master_id(self, code_type: str) -> list[object]:
        """
        특정 마스터 코드에 속한 상세 코드 목록을 조회합니다.

        Args:
            code_type: 마스터 코드 타입

        Returns:
            list[CodeDetail]: 상세 코드 목록
        """
        return await self.repository.get_details_by_type(code_type)

    async def create_master(self, full_data) -> object:
        """
        공통코드 마스터를 생성합니다.
        
        Args:
            full_data: 마스터 생성 데이터
            
        Returns:
            CodeMaster: 생성된 마스터
        """
        return await self.repository.create_master(full_data)

    async def update_master(self, code_type: str, update_data) -> Optional[object]:
        """
        공통코드 마스터를 수정합니다.
        
        Args:
            code_type: 코드 타입
            update_data: 수정 데이터
            
        Returns:
            Optional[CodeMaster]: 수정된 마스터 또는 None
        """
        return await self.repository.update_master(code_type, update_data)

    async def delete_master(self, code_type: str) -> bool:
        """
        공통코드 마스터를 삭제합니다.
        
        Args:
            code_type: 코드 타입
            
        Returns:
            bool: 삭제 성공 여부
        """
        return await self.repository.delete_master(code_type)

    async def create_detail(self, full_data) -> object:
        """
        공통코드 상세를 생성합니다.
        
        Args:
            full_data: 상세 생성 데이터
            
        Returns:
            CodeDetail: 생성된 상세 코드
        """
        return await self.repository.create_detail(full_data)

    async def update_detail(self, code_type: str, code: str, update_data) -> Optional[object]:
        """
        공통코드 상세를 수정합니다.
        
        Args:
            code_type: 코드 타입
            code: 코드
            update_data: 수정 데이터
            
        Returns:
            Optional[CodeDetail]: 수정된 상세 코드 또는 None
        """
        return await self.repository.update_detail(code_type, code, update_data)

    async def delete_detail(self, code_type: str, code: str) -> bool:
        """
        공통코드 상세를 삭제합니다.
        
        Args:
            code_type: 코드 타입
            code: 코드
            
        Returns:
            bool: 삭제 성공 여부
        """
        return await self.repository.delete_detail(code_type, code)
