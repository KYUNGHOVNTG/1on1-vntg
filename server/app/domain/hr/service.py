"""
HR 도메인 서비스

직원 및 부서 정보 조회 기능을 제공합니다.

아키텍처:
    - Service: 흐름 제어 및 트랜잭션 관리
    - Repository: DB 조회 로직
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.hr.repositories import (
    EmployeeDBRepository,
    DepartmentDBRepository,
)
from server.app.domain.hr.schemas.employee import (
    EmployeeListResponse,
    EmployeeDetailResponse,
    ConcurrentPositionResponse,
)
from server.app.domain.hr.schemas.department import (
    DepartmentListResponse,
    DepartmentDetailResponse,
)
from server.app.shared.exceptions import NotFoundException


class EmployeeService:
    """
    직원 정보 조회 서비스

    책임:
        - 직원 정보 조회 흐름 제어
        - 트랜잭션 관리
        - Repository 조율

    원칙:
        - Repository에 DB 조회 로직 위임
        - 비즈니스 로직은 Calculator로 분리 (필요 시)
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.employee_repo = EmployeeDBRepository(db)
        self.department_repo = DepartmentDBRepository(db)

    async def get_employee_list(
        self,
        search: Optional[str] = None,
        on_work_yn: Optional[str] = None,
        position_code: Optional[str] = None,
        dept_code: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> EmployeeListResponse:
        """
        직원 목록을 조회합니다 (페이징 포함)

        Args:
            search: 검색어 (이름 또는 사번)
            on_work_yn: 재직 여부 (Y: 재직, N: 퇴직)
            position_code: 직책 코드 필터
            dept_code: 부서 코드 필터
            page: 페이지 번호 (1부터 시작)
            size: 페이지 크기

        Returns:
            EmployeeListResponse: 직원 목록 및 페이징 정보
        """
        # 페이징 계산
        offset = (page - 1) * size

        # Repository 호출
        employees, total = await self.employee_repo.find_all(
            search=search,
            on_work_yn=on_work_yn,
            position_code=position_code,
            dept_code=dept_code,
            offset=offset,
            limit=size,
        )

        # 응답 변환
        items = [
            EmployeeDetailResponse(
                emp_no=emp.emp_no,
                user_id=emp.user_id,
                name_kor=emp.name_kor,
                dept_code=emp.dept_code,
                position_code=emp.position_code,
                on_work_yn=emp.on_work_yn,
            )
            for emp in employees
        ]

        return EmployeeListResponse(
            items=items, total=total, page=page, size=size, pages=(total + size - 1) // size
        )

    async def get_employee_detail(self, emp_no: str) -> EmployeeDetailResponse:
        """
        직원 상세 정보를 조회합니다

        Args:
            emp_no: 사번

        Returns:
            EmployeeDetailResponse: 직원 상세 정보

        Raises:
            NotFoundException: 직원을 찾을 수 없는 경우
        """
        # Repository 호출
        employee = await self.employee_repo.find_by_emp_no(emp_no)

        if not employee:
            raise NotFoundException(f"직원을 찾을 수 없습니다: {emp_no}")

        # 응답 변환
        return EmployeeDetailResponse(
            emp_no=employee.emp_no,
            user_id=employee.user_id,
            name_kor=employee.name_kor,
            dept_code=employee.dept_code,
            position_code=employee.position_code,
            on_work_yn=employee.on_work_yn,
        )

    async def get_concurrent_positions(self, emp_no: str) -> list[ConcurrentPositionResponse]:
        """
        직원의 겸직 정보를 조회합니다

        Args:
            emp_no: 사번

        Returns:
            list[ConcurrentPositionResponse]: 겸직 정보 목록 (주소속 포함)
        """
        # 직원 존재 여부 확인
        employee = await self.employee_repo.find_by_emp_no(emp_no)
        if not employee:
            raise NotFoundException(f"직원을 찾을 수 없습니다: {emp_no}")

        # 겸직 정보 조회
        concurrent_positions = await self.employee_repo.find_concurrent_positions_by_emp_no(
            emp_no
        )

        # 응답 변환
        return [
            ConcurrentPositionResponse(
                emp_no=cp.emp_no,
                dept_code=cp.dept_code,
                is_main=cp.is_main,
                position_code=cp.position_code,
            )
            for cp in concurrent_positions
        ]


class DepartmentService:
    """
    부서 정보 조회 서비스

    책임:
        - 부서 정보 조회 흐름 제어
        - 트랜잭션 관리
        - Repository 조율
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.department_repo = DepartmentDBRepository(db)

    async def get_department_list(
        self,
        search: Optional[str] = None,
        use_yn: Optional[str] = "Y",
        upper_dept_code: Optional[str] = None,
    ) -> DepartmentListResponse:
        """
        부서 목록을 조회합니다

        Args:
            search: 검색어 (부서명 또는 부서 코드)
            use_yn: 사용 여부 (Y: 사용, N: 미사용, None: 전체)
            upper_dept_code: 상위 부서 코드 (빈 문자열: 최상위, None: 전체)

        Returns:
            DepartmentListResponse: 부서 목록
        """
        # Repository 호출
        departments = await self.department_repo.find_all(
            search=search, use_yn=use_yn, upper_dept_code=upper_dept_code
        )

        # 응답 변환
        items = [
            DepartmentDetailResponse(
                dept_code=dept.dept_code,
                dept_name=dept.dept_name,
                upper_dept_code=dept.upper_dept_code,
                dept_head_emp_no=dept.dept_head_emp_no,
                use_yn=dept.use_yn,
            )
            for dept in departments
        ]

        return DepartmentListResponse(items=items, total=len(items))

    async def get_department_detail(self, dept_code: str) -> DepartmentDetailResponse:
        """
        부서 상세 정보를 조회합니다

        Args:
            dept_code: 부서 코드

        Returns:
            DepartmentDetailResponse: 부서 상세 정보

        Raises:
            NotFoundException: 부서를 찾을 수 없는 경우
        """
        # Repository 호출
        department = await self.department_repo.find_by_dept_code(dept_code)

        if not department:
            raise NotFoundException(f"부서를 찾을 수 없습니다: {dept_code}")

        # 응답 변환
        return DepartmentDetailResponse(
            dept_code=department.dept_code,
            dept_name=department.dept_name,
            upper_dept_code=department.upper_dept_code,
            dept_head_emp_no=department.dept_head_emp_no,
            use_yn=department.use_yn,
        )
