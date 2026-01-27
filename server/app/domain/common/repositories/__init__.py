"""
Common Domain Repositories

공통코드 데이터 접근 계층입니다.
단순 CRUD 작업을 위한 Repository 패턴 구현.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.shared.exceptions import NotFoundException, RepositoryException
from server.app.domain.common.models import CodeMaster, CodeDetail


class CommonCodeRepository:
    """
    공통코드 Repository
    
    책임:
        - 데이터베이스에서 공통코드 조회
        - CRUD 작업
        - 데이터 존재 여부 확인
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def get_code_by_type_and_code(
        self, code_type: str, code: str
    ) -> Optional[CodeDetail]:
        """
        코드 타입과 코드로 상세 코드를 조회합니다.
        
        Args:
            code_type: 코드 타입 (ROLE, POSITION 등)
            code: 코드 값 (CD001, CD002 등)
            
        Returns:
            Optional[CodeDetail]: 조회된 코드 또는 None
        """
        stmt = select(CodeDetail).where(
            CodeDetail.code_type == code_type,
            CodeDetail.code == code,
            CodeDetail.use_yn == 'Y'
        )
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_masters(self) -> list[CodeMaster]:
        """
        모든 공통코드 마스터를 조회합니다.
        
        Returns:
            list[CodeMaster]: 마스터 코드 목록
        """
        stmt = select(CodeMaster).order_by(CodeMaster.code_type)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_details_by_type(self, code_type: str) -> list[CodeDetail]:
        """
        특정 코드 타입의 모든 상세 코드를 조회합니다.
        
        Args:
            code_type: 코드 타입
            
        Returns:
            list[CodeDetail]: 상세 코드 목록
        """
        stmt = select(CodeDetail).where(
            CodeDetail.code_type == code_type
        ).order_by(CodeDetail.sort_seq, CodeDetail.code)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_master_by_type(self, code_type: str) -> Optional[CodeMaster]:
        """
        코드 타입으로 마스터 코드를 조회합니다.
        
        Args:
            code_type: 코드 타입
            
        Returns:
            Optional[CodeMaster]: 마스터 코드 또는 None
        """
        stmt = select(CodeMaster).where(CodeMaster.code_type == code_type)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_master(self, master_data) -> CodeMaster:
        """
        공통코드 마스터를 생성합니다.
        
        Args:
            master_data: 마스터 생성 데이터
            
        Returns:
            CodeMaster: 생성된 마스터
            
        Raises:
            RepositoryException: 중복 또는 생성 실패
        """
        try:
            # 중복 체크
            existing = await self.get_master_by_type(master_data.code_type)
            if existing:
                raise RepositoryException(
                    f"Code Type '{master_data.code_type}' already exists."
                )

            new_master = CodeMaster(**master_data.model_dump())
            self.db.add(new_master)
            await self.db.commit()
            await self.db.refresh(new_master)
            return new_master
        except RepositoryException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to create master: {str(e)}",
                details={"code_type": master_data.code_type}
            )

    async def update_master(
        self, code_type: str, update_data
    ) -> Optional[CodeMaster]:
        """
        공통코드 마스터를 수정합니다.
        
        Args:
            code_type: 코드 타입
            update_data: 수정 데이터
            
        Returns:
            Optional[CodeMaster]: 수정된 마스터 또는 None
        """
        try:
            master = await self.get_master_by_type(code_type)
            if not master:
                return None

            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(master, key, value)

            await self.db.commit()
            await self.db.refresh(master)
            return master
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to update master: {str(e)}",
                details={"code_type": code_type}
            )

    async def delete_master(self, code_type: str) -> bool:
        """
        공통코드 마스터를 삭제합니다.
        
        Args:
            code_type: 코드 타입
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            master = await self.get_master_by_type(code_type)
            if not master:
                return False

            await self.db.delete(master)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to delete master: {str(e)}",
                details={"code_type": code_type}
            )

    async def create_detail(self, detail_data) -> CodeDetail:
        """
        공통코드 상세를 생성합니다.
        
        Args:
            detail_data: 상세 생성 데이터
            
        Returns:
            CodeDetail: 생성된 상세 코드
            
        Raises:
            RepositoryException: 중복 또는 생성 실패
        """
        try:
            # 중복 체크
            existing = await self.get_code_by_type_and_code(
                detail_data.code_type, detail_data.code
            )
            if existing:
                raise RepositoryException(
                    f"Code '{detail_data.code}' already exists in '{detail_data.code_type}'."
                )

            new_detail = CodeDetail(**detail_data.model_dump())
            self.db.add(new_detail)
            await self.db.commit()
            await self.db.refresh(new_detail)
            return new_detail
        except RepositoryException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to create detail: {str(e)}",
                details={"code_type": detail_data.code_type, "code": detail_data.code}
            )

    async def update_detail(
        self, code_type: str, code: str, update_data
    ) -> Optional[CodeDetail]:
        """
        공통코드 상세를 수정합니다.
        
        Args:
            code_type: 코드 타입
            code: 코드
            update_data: 수정 데이터
            
        Returns:
            Optional[CodeDetail]: 수정된 상세 코드 또는 None
        """
        try:
            detail = await self.get_code_by_type_and_code(code_type, code)
            if not detail:
                return None

            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(detail, key, value)

            await self.db.commit()
            await self.db.refresh(detail)
            return detail
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to update detail: {str(e)}",
                details={"code_type": code_type, "code": code}
            )

    async def delete_detail(self, code_type: str, code: str) -> bool:
        """
        공통코드 상세를 삭제합니다.
        
        Args:
            code_type: 코드 타입
            code: 코드
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            detail = await self.get_code_by_type_and_code(code_type, code)
            if not detail:
                return False

            await self.db.delete(detail)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            raise RepositoryException(
                f"Failed to delete detail: {str(e)}",
                details={"code_type": code_type, "code": code}
            )
