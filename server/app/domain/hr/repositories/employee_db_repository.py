"""
HR 도메인 - 직원 정보 DB Repository

SQLAlchemy를 사용하여 실제 DB에 접근하는 Repository 구현체입니다.
"""

from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import and_, func, literal, or_, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from server.app.domain.hr.repositories.employee_repository import IEmployeeRepository
from server.app.domain.hr.models import HRMgnt, HRMgntConcur, CMDepartment
from server.app.domain.common.models import CodeDetail


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
    ) -> Tuple[List[Dict[str, Any]], int]:
        """직원 목록을 조회합니다 (페이징 포함, 부서명·직책명 JOIN)"""

        # 필터링 조건
        conditions: list = []

        if search:
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

        # 전체 건수 조회 (JOIN 전 HRMgnt 기준)
        count_base = select(func.count(HRMgnt.emp_no))
        if conditions:
            count_base = count_base.where(*conditions)
        count_result = await self.db.execute(count_base)
        total = count_result.scalar_one()

        # 부서명·직책명 JOIN 쿼리
        # cm_department LEFT JOIN → dept_name
        # cm_codedetail(POSITION) LEFT JOIN → position_name
        stmt = (
            select(
                HRMgnt,
                CMDepartment.dept_name.label("dept_name"),
                CodeDetail.code_name.label("position_name"),
            )
            .join(
                CMDepartment,
                HRMgnt.dept_code == CMDepartment.dept_code,
                isouter=True,
            )
            .join(
                CodeDetail,
                and_(
                    CodeDetail.code_type == "POSITION",
                    CodeDetail.code == HRMgnt.position_code,
                ),
                isouter=True,
            )
        )

        if conditions:
            stmt = stmt.where(*conditions)

        stmt = stmt.offset(offset).limit(limit).order_by(HRMgnt.emp_no)

        result = await self.db.execute(stmt)
        rows = result.all()

        # Row → dict 변환 (HRMgnt 속성 + dept_name + position_name)
        employees: List[Dict[str, Any]] = []
        for row in rows:
            emp: HRMgnt = row[0]
            employees.append(
                {
                    "emp_no": emp.emp_no,
                    "user_id": emp.user_id,
                    "name_kor": emp.name_kor,
                    "dept_code": emp.dept_code,
                    "dept_name": row.dept_name,
                    "position_code": emp.position_code,
                    "position_name": row.position_name,
                    "on_work_yn": emp.on_work_yn,
                }
            )

        return employees, total

    async def find_all_expanded(
        self,
        search: Optional[str] = None,
        on_work_yn: Optional[str] = None,
        position_code: Optional[str] = None,
        dept_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        겸직 전개 직원 목록을 조회합니다 (CONCUR 기준 다중 ROW)

        - CONCUR 데이터가 없는 직원: HR_MGNT 기본 1 ROW (is_concurrent=False)
        - CONCUR 데이터가 있는 직원: CONCUR 각 레코드를 1 ROW씩 전개 (is_concurrent=True)

        Returns:
            (expanded_rows, total_employee_count)
            total은 전개 전 직원 수 (HR_MGNT 기준)
        """
        # ① 전체 직원 수 (전개 전, HR_MGNT 기준)
        count_stmt = select(func.count(HRMgnt.emp_no))
        if search:
            count_stmt = count_stmt.where(
                or_(
                    HRMgnt.name_kor.ilike(f"%{search}%"),
                    HRMgnt.emp_no.ilike(f"%{search}%"),
                )
            )
        if on_work_yn:
            count_stmt = count_stmt.where(HRMgnt.on_work_yn == on_work_yn)
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # ② CONCUR가 없는 직원 서브쿼리 (일반 1 ROW, is_concurrent=False)
        emp_no_with_concur_subq = select(HRMgntConcur.emp_no).distinct()

        no_concur_q = (
            select(
                HRMgnt.emp_no.label("emp_no"),
                HRMgnt.user_id.label("user_id"),
                HRMgnt.name_kor.label("name_kor"),
                HRMgnt.dept_code.label("dept_code"),
                CMDepartment.dept_name.label("dept_name"),
                HRMgnt.position_code.label("position_code"),
                CodeDetail.code_name.label("position_name"),
                HRMgnt.on_work_yn.label("on_work_yn"),
                literal(False).label("is_concurrent"),
                literal("Y").label("is_main"),
            )
            .join(
                CMDepartment,
                HRMgnt.dept_code == CMDepartment.dept_code,
                isouter=True,
            )
            .join(
                CodeDetail,
                and_(
                    CodeDetail.code_type == "POSITION",
                    CodeDetail.code == HRMgnt.position_code,
                ),
                isouter=True,
            )
            .where(~HRMgnt.emp_no.in_(emp_no_with_concur_subq))
        )
        if search:
            no_concur_q = no_concur_q.where(
                or_(
                    HRMgnt.name_kor.ilike(f"%{search}%"),
                    HRMgnt.emp_no.ilike(f"%{search}%"),
                )
            )
        if on_work_yn:
            no_concur_q = no_concur_q.where(HRMgnt.on_work_yn == on_work_yn)
        if position_code:
            no_concur_q = no_concur_q.where(HRMgnt.position_code == position_code)
        if dept_code:
            no_concur_q = no_concur_q.where(HRMgnt.dept_code == dept_code)

        # ③ CONCUR가 있는 직원 서브쿼리 (CONCUR 기준 전개, is_concurrent=True)
        ConcurDept = aliased(CMDepartment)
        ConcurCode = aliased(CodeDetail)

        has_concur_q = (
            select(
                HRMgnt.emp_no.label("emp_no"),
                HRMgnt.user_id.label("user_id"),
                HRMgnt.name_kor.label("name_kor"),
                HRMgntConcur.dept_code.label("dept_code"),
                ConcurDept.dept_name.label("dept_name"),
                HRMgntConcur.position_code.label("position_code"),
                ConcurCode.code_name.label("position_name"),
                HRMgnt.on_work_yn.label("on_work_yn"),
                literal(True).label("is_concurrent"),
                HRMgntConcur.is_main.label("is_main"),
            )
            .join(HRMgntConcur, HRMgnt.emp_no == HRMgntConcur.emp_no)
            .join(
                ConcurDept,
                HRMgntConcur.dept_code == ConcurDept.dept_code,
                isouter=True,
            )
            .join(
                ConcurCode,
                and_(
                    ConcurCode.code_type == "POSITION",
                    ConcurCode.code == HRMgntConcur.position_code,
                ),
                isouter=True,
            )
        )
        if search:
            has_concur_q = has_concur_q.where(
                or_(
                    HRMgnt.name_kor.ilike(f"%{search}%"),
                    HRMgnt.emp_no.ilike(f"%{search}%"),
                )
            )
        if on_work_yn:
            has_concur_q = has_concur_q.where(HRMgnt.on_work_yn == on_work_yn)
        if position_code:
            has_concur_q = has_concur_q.where(HRMgntConcur.position_code == position_code)
        if dept_code:
            has_concur_q = has_concur_q.where(HRMgntConcur.dept_code == dept_code)

        # ④ UNION ALL → 서브쿼리로 감싸서 페이징 적용
        union_subq = union_all(no_concur_q, has_concur_q).subquery()

        final_q = (
            select(union_subq)
            .order_by(union_subq.c.emp_no, union_subq.c.is_main.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(final_q)
        rows = result.all()

        expanded: List[Dict[str, Any]] = []
        for row in rows:
            expanded.append(
                {
                    "emp_no": row.emp_no,
                    "user_id": row.user_id,
                    "name_kor": row.name_kor,
                    "dept_code": row.dept_code,
                    "dept_name": row.dept_name,
                    "position_code": row.position_code,
                    "position_name": row.position_name,
                    "on_work_yn": row.on_work_yn,
                    "is_concurrent": row.is_concurrent,
                    "is_main": row.is_main,
                }
            )

        return expanded, total

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
