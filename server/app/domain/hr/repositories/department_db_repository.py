"""
HR 도메인 - 부서 정보 DB Repository

SQLAlchemy를 사용하여 실제 DB에 접근하는 Repository 구현체입니다.
"""

from typing import List, Optional
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.hr.repositories.department_repository import IDepartmentRepository
from server.app.domain.hr.models import CMDepartment, CMDepartmentTree


class DepartmentDBRepository(IDepartmentRepository):
    """
    부서 정보 DB Repository

    SQLAlchemy를 사용하여 실제 데이터베이스에서 부서 정보를 조회합니다.
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def find_all(
        self,
        search: Optional[str] = None,
        use_yn: Optional[str] = None,
        upper_dept_code: Optional[str] = None,
    ) -> List[CMDepartment]:
        """부서 목록을 조회합니다"""
        stmt = select(CMDepartment)

        # 필터링
        conditions = []

        if search:
            # 부서명 또는 부서 코드로 검색
            conditions.append(
                or_(
                    CMDepartment.dept_name.ilike(f"%{search}%"),
                    CMDepartment.dept_code.ilike(f"%{search}%"),
                )
            )

        if use_yn:
            conditions.append(CMDepartment.use_yn == use_yn)

        if upper_dept_code is not None:
            if upper_dept_code == "":
                # 최상위 부서 조회 (upper_dept_code가 null)
                conditions.append(CMDepartment.upper_dept_code.is_(None))
            else:
                conditions.append(CMDepartment.upper_dept_code == upper_dept_code)

        if conditions:
            stmt = stmt.where(*conditions)

        # 정렬
        stmt = stmt.order_by(CMDepartment.dept_code)

        # 실행
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_by_dept_code(self, dept_code: str) -> Optional[CMDepartment]:
        """부서 코드로 부서 정보를 조회합니다"""
        stmt = select(CMDepartment).where(CMDepartment.dept_code == dept_code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_sub_departments(self, dept_code: str) -> List[CMDepartment]:
        """하위 부서 목록을 조회합니다"""
        stmt = (
            select(CMDepartment)
            .where(CMDepartment.upper_dept_code == dept_code)
            .order_by(CMDepartment.dept_code)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_org_tree_by_year(self, std_year: str) -> List[CMDepartmentTree]:
        """연도별 조직도 데이터를 조회합니다 (플랫 리스트)"""
        stmt = (
            select(CMDepartmentTree)
            .where(CMDepartmentTree.std_year == std_year)
            .order_by(CMDepartmentTree.disp_lvl, CMDepartmentTree.dept_code)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_org_tree_node(
        self, std_year: str, dept_code: str
    ) -> Optional[CMDepartmentTree]:
        """조직도에서 특정 부서 노드를 조회합니다"""
        stmt = select(CMDepartmentTree).where(
            CMDepartmentTree.std_year == std_year,
            CMDepartmentTree.dept_code == dept_code,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_year(self) -> Optional[str]:
        """조직도의 최신 연도를 조회합니다"""
        stmt = select(func.max(CMDepartmentTree.std_year))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
