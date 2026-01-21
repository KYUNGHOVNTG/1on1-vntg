"""
공통코드 서비스

공통코드 조회 및 변환 기능을 제공합니다.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.common.models import CodeDetail


class CommonCodeService:
    """공통코드 조회 서비스"""

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def get_code_name(self, code_type: str, code: str) -> Optional[str]:
        """
        공통코드의 code_name (의미값)을 조회합니다.

        Args:
            code_type: 코드 타입 (ROLE, POSITION 등)
            code: 코드 (CD001, CD002 등)

        Returns:
            str | None: 코드명 (HR, TEAM_LEADER 등) 또는 None
        """
        stmt = select(CodeDetail).where(
            CodeDetail.code_type == code_type,
            CodeDetail.code == code,
            CodeDetail.use_yn == 'Y'
        )

        result = await self.db.execute(stmt)
        code_detail = result.scalar_one_or_none()

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
        from server.app.domain.common.models import CodeMaster

        stmt = select(CodeMaster).order_by(CodeMaster.code_type)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_details_by_master_id(self, code_type: str) -> list[object]:
        """
        특정 마스터 코드에 속한 상세 코드 목록을 조회합니다.

        Args:
            code_type: 마스터 코드 타입

        Returns:
            list[CodeDetail]: 상세 코드 목록
        """
        stmt = select(CodeDetail).where(
            CodeDetail.code_type == code_type
        ).order_by(CodeDetail.sort_seq, CodeDetail.code)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()
