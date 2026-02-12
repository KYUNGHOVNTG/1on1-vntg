"""
HR 도메인 - 직원 정보 DB Repository

SQLAlchemy를 사용하여 실제 DB에 접근하는 Repository 구현체입니다.
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.app.domain.hr.repositories.employee_repository import IEmployeeRepository
from server.app.domain.hr.models import HRMgnt, HRMgntConcur


class EmployeeDBRepository(IEmployeeRepository):
    """
    직원 정보 DB Repository

    SQLAlchemy를 사용하여 실제 데이터베이스에서 직원 정보를 조회합니다.
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
        on_work_yn: Optional[str] = None,
        position_code: Optional[str] = None,
        dept_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[HRMgnt], int]:
        """직원 목록을 조회합니다 (페이징 포함)"""
        # 기본 쿼리
        stmt = select(HRMgnt)

        # 필터링
        conditions = []

        if search:
            # 이름 또는 사번으로 검색
            conditions.append(
                or_(
                    HRMgnt.name_kor.ilike(f"%{search}%"),
                    HRMgnt.emp_no.ilike(f"%{search}%"),
                )
            )

        if on_work_yn:
            conditions.append(HRMgnt.on_work_yn == on_work_yn)

        if position_code:
            conditions.append(HRMgnt.position_code == position_code)

        if dept_code:
            conditions.append(HRMgnt.dept_code == dept_code)

        if conditions:
            stmt = stmt.where(*conditions)

        # 전체 건수 조회
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # 페이징 적용
        stmt = stmt.offset(offset).limit(limit).order_by(HRMgnt.emp_no)

        # 실행
        result = await self.db.execute(stmt)
        employees = list(result.scalars().all())

        return employees, total

    async def find_by_emp_no(self, emp_no: str) -> Optional[HRMgnt]:
        """사번으로 직원 정보를 조회합니다"""
        stmt = select(HRMgnt).where(HRMgnt.emp_no == emp_no)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_concurrent_positions_by_emp_no(
        self, emp_no: str
    ) -> List[HRMgntConcur]:
        """사번으로 겸직 정보를 조회합니다"""
        stmt = (
            select(HRMgntConcur)
            .where(HRMgntConcur.emp_no == emp_no)
            .order_by(HRMgntConcur.is_main.desc(), HRMgntConcur.dept_code)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> List[HRMgnt]:
        """부서 코드로 소속 직원을 조회합니다"""
        # 주소속 직원 조회
        stmt = select(HRMgnt).where(HRMgnt.dept_code == dept_code)
        result = await self.db.execute(stmt)
        employees = list(result.scalars().all())

        # 겸직자 포함
        if include_concurrent:
            # 겸직 부서로 등록된 직원의 사번 조회
            concurrent_stmt = select(HRMgntConcur.emp_no).where(
                HRMgntConcur.dept_code == dept_code, HRMgntConcur.is_main == "N"
            )
            concurrent_result = await self.db.execute(concurrent_stmt)
            concurrent_emp_nos = [row[0] for row in concurrent_result.all()]

            # 겸직 직원 정보 조회 (주소속이 해당 부서가 아닌 경우만)
            if concurrent_emp_nos:
                concurrent_employees_stmt = select(HRMgnt).where(
                    HRMgnt.emp_no.in_(concurrent_emp_nos),
                    HRMgnt.dept_code != dept_code,
                )
                concurrent_employees_result = await self.db.execute(
                    concurrent_employees_stmt
                )
                employees.extend(list(concurrent_employees_result.scalars().all()))

        return employees

    async def count_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> int:
        """부서별 소속 직원 수를 집계합니다"""
        employees = await self.find_by_dept_code(dept_code, include_concurrent)
        return len(employees)
