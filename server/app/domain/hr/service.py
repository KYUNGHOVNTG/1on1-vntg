"""
HR 도메인 서비스

직원 및 부서 정보 조회 기능을 제공합니다.

아키텍처:
    - Service: 흐름 제어 및 트랜잭션 관리
    - Repository: DB 조회 로직
    - Calculator: 순수 비즈니스 로직 (조직도 트리 변환 등)
"""

from datetime import datetime

from sqlalchemy import delete as sa_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.hr.calculators import OrgTreeCalculator
from server.app.domain.hr.models import (
    CMDepartment,
    CMDepartmentTree,
    HRMgnt,
    HRMgntConcur,
    HRSyncHistory,
)
from server.app.domain.hr.repositories import (
    DepartmentDBRepository,
    EmployeeDBRepository,
)
from server.app.domain.hr.schemas.department import (
    DepartmentDetailResponse,
    DepartmentInfo,
    DepartmentListResponse,
    OrgTreeResponse,
)
from server.app.domain.hr.schemas.employee import (
    ConcurrentPositionResponse,
    EmployeeDetailResponse,
    EmployeeListResponse,
    EmployeeRowListResponse,
    EmployeeRowResponse,
)
from server.app.domain.hr.schemas.sync import (
    ConcurrentPositionSyncRequest,
    DepartmentSyncRequest,
    EmployeeSyncRequest,
    SyncExecutionResponse,
    SyncHistoryListResponse,
    SyncHistoryResponse,
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
        search: str | None = None,
        on_work_yn: str | None = None,
        position_code: str | None = None,
        dept_code: str | None = None,
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

        # 응답 변환 (dept_name, position_name 포함)
        items = [
            EmployeeDetailResponse(
                emp_no=emp["emp_no"],
                user_id=emp["user_id"],
                name_kor=emp["name_kor"],
                dept_code=emp["dept_code"],
                dept_name=emp.get("dept_name"),
                position_code=emp["position_code"],
                position_name=emp.get("position_name"),
                on_work_yn=emp["on_work_yn"],
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

    async def get_employee_row_list(
        self,
        search: str | None = None,
        on_work_yn: str | None = None,
        position_code: str | None = None,
        dept_code: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> EmployeeRowListResponse:
        """
        겸직 전개 직원 목록을 조회합니다 (CONCUR 기준 다중 ROW)

        CONCUR 데이터가 없는 직원은 1 ROW, 있는 직원은 CONCUR 건수만큼 ROW가 전개됩니다.

        Args:
            search: 검색어 (이름 또는 사번)
            on_work_yn: 재직 여부 (Y/N)
            position_code: 직책 코드 필터
            dept_code: 부서 코드 필터
            page: 페이지 번호 (1부터 시작)
            size: 페이지 크기

        Returns:
            EmployeeRowListResponse: 겸직 전개된 직원 ROW 목록 및 페이징 정보
        """
        offset = (page - 1) * size

        rows, total = await self.employee_repo.find_all_expanded(
            search=search,
            on_work_yn=on_work_yn,
            position_code=position_code,
            dept_code=dept_code,
            offset=offset,
            limit=size,
        )

        items = [
            EmployeeRowResponse(
                emp_no=row["emp_no"],
                user_id=row["user_id"],
                name_kor=row["name_kor"],
                dept_code=row["dept_code"],
                dept_name=row.get("dept_name"),
                position_code=row["position_code"],
                position_name=row.get("position_name"),
                on_work_yn=row["on_work_yn"],
                is_concurrent=row["is_concurrent"],
                is_main=row["is_main"],
            )
            for row in rows
        ]

        return EmployeeRowListResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size,
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
        concurrent_positions = await self.employee_repo.find_concurrent_positions_by_emp_no(emp_no)

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
        - 조직도 트리 조회
        - 트랜잭션 관리
        - Repository/Calculator 조율
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.department_repo = DepartmentDBRepository(db)
        self.employee_repo = EmployeeDBRepository(db)

    async def get_department_list(
        self,
        search: str | None = None,
        use_yn: str | None = "Y",
        upper_dept_code: str | None = None,
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

    async def get_org_tree(self, std_year: str | None = None) -> OrgTreeResponse:
        """
        조직도 트리를 조회합니다

        Args:
            std_year: 기준 연도 (YYYY). None이면 최신 연도 자동 조회

        Returns:
            OrgTreeResponse: 조직도 트리

        Raises:
            NotFoundException: 조직도 데이터가 없는 경우
        """
        # 연도 결정
        if not std_year:
            std_year = await self.department_repo.get_latest_year()
            if not std_year:
                raise NotFoundException("조직도 데이터가 존재하지 않습니다")

        # 플랫 리스트 조회
        flat_nodes = await self.department_repo.find_org_tree_by_year(std_year)
        if not flat_nodes:
            raise NotFoundException(f"해당 연도의 조직도 데이터가 없습니다: {std_year}")

        # 부서별 직원 수 집계
        employee_counts: dict[str, int] = {}
        for node in flat_nodes:
            count = await self.employee_repo.count_by_dept_code(node.dept_code)
            employee_counts[node.dept_code] = count

        # Calculator로 트리 변환
        tree = OrgTreeCalculator.build_tree(flat_nodes, employee_counts)

        return OrgTreeResponse(std_year=std_year, tree=tree)

    async def get_department_info(self, dept_code: str) -> DepartmentInfo:
        """
        부서 상세 정보를 조회합니다 (부서장명, 직원 수 포함)

        Args:
            dept_code: 부서 코드

        Returns:
            DepartmentInfo: 부서 상세 정보 (부서장명, 소속 직원 수 포함)

        Raises:
            NotFoundException: 부서를 찾을 수 없는 경우
        """
        # 부서 정보 조회
        department = await self.department_repo.find_by_dept_code(dept_code)
        if not department:
            raise NotFoundException(f"부서를 찾을 수 없습니다: {dept_code}")

        # 부서장 이름 조회
        dept_head_name: str | None = None
        if department.dept_head_emp_no:
            dept_head = await self.employee_repo.find_by_emp_no(department.dept_head_emp_no)
            if dept_head:
                dept_head_name = dept_head.name_kor

        # 소속 직원 수 집계
        employee_count = await self.employee_repo.count_by_dept_code(dept_code)

        return DepartmentInfo(
            dept_code=department.dept_code,
            dept_name=department.dept_name,
            upper_dept_code=department.upper_dept_code,
            use_yn=department.use_yn,
            dept_head_emp_no=department.dept_head_emp_no,
            dept_head_name=dept_head_name,
            employee_count=employee_count,
            in_date=department.in_date,
            up_date=department.up_date,
        )

    async def get_department_employees(
        self,
        dept_code: str,
        include_concurrent: bool = True,
    ) -> list[EmployeeDetailResponse]:
        """
        부서별 소속 직원 목록을 조회합니다

        Args:
            dept_code: 부서 코드
            include_concurrent: 겸직자 포함 여부

        Returns:
            List[EmployeeDetailResponse]: 소속 직원 목록

        Raises:
            NotFoundException: 부서를 찾을 수 없는 경우
        """
        # 부서 존재 여부 확인
        department = await self.department_repo.find_by_dept_code(dept_code)
        if not department:
            raise NotFoundException(f"부서를 찾을 수 없습니다: {dept_code}")

        # 소속 직원 조회
        employees = await self.employee_repo.find_by_dept_code(
            dept_code, include_concurrent=include_concurrent
        )

        return [
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


class SyncService:
    """
    동기화 서비스

    외부 시스템(오라클)과의 데이터 동기화 기능을 제공합니다.

    책임:
        - 직원 정보 Bulk Insert/Update
        - 부서 정보 Bulk Insert/Update
        - 동기화 이력 기록 및 조회
        - 트랜잭션 관리
    """

    def __init__(self, db: AsyncSession):
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def sync_employees(
        self,
        employees: list[EmployeeSyncRequest],
        in_user: str | None = None,
    ) -> SyncExecutionResponse:
        """
        직원 정보 동기화 (Bulk Insert/Update)

        외부 시스템에서 전달받은 직원 데이터를 Bulk로 업데이트합니다.

        Args:
            employees: 동기화할 직원 목록
            in_user: 실행자

        Returns:
            SyncExecutionResponse: 동기화 실행 결과
        """
        sync_start_time = datetime.utcnow()
        total_count = len(employees)
        success_count = 0
        failure_count = 0
        error_messages: list[str] = []

        # 동기화 이력 레코드 생성
        sync_history = HRSyncHistory(
            sync_type="employees",
            sync_status="in_progress",
            total_count=total_count,
            success_count=0,
            failure_count=0,
            sync_start_time=sync_start_time,
            in_user=in_user,
        )
        self.db.add(sync_history)
        await self.db.flush()  # sync_id 생성

        # Bulk Insert/Update
        for emp_req in employees:
            try:
                # 기존 직원 조회
                result = await self.db.execute(
                    select(HRMgnt).where(HRMgnt.emp_no == emp_req.emp_no)
                )
                existing = result.scalar_one_or_none()

                if existing:
                    # Update
                    existing.user_id = emp_req.user_id
                    existing.name_kor = emp_req.name_kor
                    existing.dept_code = emp_req.dept_code
                    existing.position_code = emp_req.position_code
                    existing.on_work_yn = emp_req.on_work_yn
                    existing.up_user = in_user
                    existing.up_date = datetime.utcnow()
                else:
                    # Insert
                    new_employee = HRMgnt(
                        emp_no=emp_req.emp_no,
                        user_id=emp_req.user_id,
                        name_kor=emp_req.name_kor,
                        dept_code=emp_req.dept_code,
                        position_code=emp_req.position_code,
                        on_work_yn=emp_req.on_work_yn,
                        in_user=in_user,
                    )
                    self.db.add(new_employee)

                # =============================================
                # 겸직 정보 동기화 (HR_MGNT_CONCUR) - Full Replace 방식
                # concurrent_positions 값에 관계없이 항상 기존 레코드를 삭제 후 재삽입
                # - 빈 배열([])이면 기존 겸직 레코드만 삭제 (겸직→비겸직 전환 처리)
                # - 값이 있으면 삭제 후 새 레코드 삽입
                # =============================================
                await self.db.flush()  # hr_mgnt PK가 먼저 저장되어야 FK 제약 통과

                # 기존 겸직 레코드 전체 삭제 (Full Replace)
                await self.db.execute(
                    sa_delete(HRMgntConcur).where(
                        HRMgntConcur.emp_no == emp_req.emp_no
                    )
                )

                # 새 겸직 레코드 삽입 (concurrent_positions가 있을 때만)
                for concur in emp_req.concurrent_positions:
                    new_concur = HRMgntConcur(
                        emp_no=emp_req.emp_no,
                        dept_code=concur.dept_code,
                        is_main=concur.is_main,
                        position_code=concur.position_code,
                        in_user=in_user,
                    )
                    self.db.add(new_concur)

                success_count += 1

            except Exception as e:
                failure_count += 1
                error_messages.append(f"emp_no={emp_req.emp_no}: {str(e)}")

        # 동기화 결과 업데이트
        sync_history.success_count = success_count
        sync_history.failure_count = failure_count
        sync_history.sync_status = "success" if failure_count == 0 else "partial" if success_count > 0 else "failure"
        sync_history.error_message = "\n".join(error_messages) if error_messages else None
        sync_history.sync_end_time = datetime.utcnow()

        await self.db.commit()

        return SyncExecutionResponse(
            sync_id=sync_history.sync_id,
            sync_type="employees",
            sync_status=sync_history.sync_status,
            total_count=total_count,
            success_count=success_count,
            failure_count=failure_count,
            message=f"직원 정보 동기화 완료: 성공 {success_count}건, 실패 {failure_count}건",
        )

    async def sync_departments(
        self,
        departments: list[DepartmentSyncRequest],
        in_user: str | None = None,
    ) -> SyncExecutionResponse:
        """
        부서 정보 동기화 (Bulk Insert/Update)

        외부 시스템에서 전달받은 부서 데이터를 Bulk로 업데이트합니다.

        Args:
            departments: 동기화할 부서 목록
            in_user: 실행자

        Returns:
            SyncExecutionResponse: 동기화 실행 결과
        """
        sync_start_time = datetime.utcnow()
        total_count = len(departments)
        success_count = 0
        failure_count = 0
        error_messages: list[str] = []

        # 동기화 이력 레코드 생성
        sync_history = HRSyncHistory(
            sync_type="departments",
            sync_status="in_progress",
            total_count=total_count,
            success_count=0,
            failure_count=0,
            sync_start_time=sync_start_time,
            in_user=in_user,
        )
        self.db.add(sync_history)
        await self.db.flush()  # sync_id 생성

        # 현재 연도 (조직도 기준 연도)
        current_year = str(datetime.utcnow().year)

        # Bulk Insert/Update
        for dept_req in departments:
            try:
                # =============================================
                # 1. cm_department INSERT/UPDATE
                # =============================================
                result = await self.db.execute(
                    select(CMDepartment).where(CMDepartment.dept_code == dept_req.dept_code)
                )
                existing_dept = result.scalar_one_or_none()

                if existing_dept:
                    # Update
                    existing_dept.dept_name = dept_req.dept_name
                    existing_dept.upper_dept_code = dept_req.upper_dept_code
                    existing_dept.dept_head_emp_no = dept_req.dept_head_emp_no
                    existing_dept.use_yn = dept_req.use_yn
                    existing_dept.up_user = in_user
                    existing_dept.up_date = datetime.utcnow()
                else:
                    # Insert
                    new_department = CMDepartment(
                        dept_code=dept_req.dept_code,
                        dept_name=dept_req.dept_name,
                        upper_dept_code=dept_req.upper_dept_code,
                        dept_head_emp_no=dept_req.dept_head_emp_no,
                        use_yn=dept_req.use_yn,
                        in_user=in_user,
                    )
                    self.db.add(new_department)

                await self.db.flush()  # cm_department 먼저 저장

                # =============================================
                # 2. 부서장 정보 조회 (hr_mgnt 테이블)
                # =============================================
                dept_head_name = None
                if dept_req.dept_head_emp_no:
                    head_result = await self.db.execute(
                        select(HRMgnt.name_kor).where(
                            HRMgnt.emp_no == dept_req.dept_head_emp_no
                        )
                    )
                    dept_head_name = head_result.scalar_one_or_none()

                # =============================================
                # 3. cm_department_tree INSERT/UPDATE (조직도 표시용)
                # =============================================
                tree_result = await self.db.execute(
                    select(CMDepartmentTree).where(
                        CMDepartmentTree.std_year == current_year,
                        CMDepartmentTree.dept_code == dept_req.dept_code,
                    )
                )
                existing_tree = tree_result.scalar_one_or_none()

                # disp_lvl 계산: upper_dept_code가 NULL이면 1 (최상위), 아니면 2
                disp_lvl = 1 if dept_req.upper_dept_code is None else 2

                if existing_tree:
                    # Update
                    existing_tree.dept_name = dept_req.dept_name
                    existing_tree.upper_dept_code = dept_req.upper_dept_code
                    existing_tree.disp_lvl = disp_lvl
                    existing_tree.dept_head_emp_no = dept_req.dept_head_emp_no
                    existing_tree.name_kor = dept_head_name
                    existing_tree.up_user = in_user
                    existing_tree.up_date = datetime.utcnow()
                else:
                    # Insert
                    new_tree = CMDepartmentTree(
                        std_year=current_year,
                        dept_code=dept_req.dept_code,
                        upper_dept_code=dept_req.upper_dept_code,
                        dept_name=dept_req.dept_name,
                        disp_lvl=disp_lvl,
                        dept_head_emp_no=dept_req.dept_head_emp_no,
                        name_kor=dept_head_name,
                        in_user=in_user,
                    )
                    self.db.add(new_tree)

                success_count += 1

            except Exception as e:
                failure_count += 1
                error_messages.append(f"dept_code={dept_req.dept_code}: {str(e)}")

        # 동기화 결과 업데이트
        sync_history.success_count = success_count
        sync_history.failure_count = failure_count
        sync_history.sync_status = "success" if failure_count == 0 else "partial" if success_count > 0 else "failure"
        sync_history.error_message = "\n".join(error_messages) if error_messages else None
        sync_history.sync_end_time = datetime.utcnow()

        await self.db.commit()

        return SyncExecutionResponse(
            sync_id=sync_history.sync_id,
            sync_type="departments",
            sync_status=sync_history.sync_status,
            total_count=total_count,
            success_count=success_count,
            failure_count=failure_count,
            message=f"부서 정보 동기화 완료: 성공 {success_count}건, 실패 {failure_count}건",
        )

    async def get_sync_history(
        self,
        sync_type: str | None = None,
        limit: int = 50,
    ) -> SyncHistoryListResponse:
        """
        동기화 이력을 조회합니다

        Args:
            sync_type: 동기화 타입 필터 (employees/departments/org_tree)
            limit: 최대 조회 건수

        Returns:
            SyncHistoryListResponse: 동기화 이력 목록
        """
        query = select(HRSyncHistory).order_by(HRSyncHistory.sync_id.desc()).limit(limit)

        if sync_type:
            query = query.where(HRSyncHistory.sync_type == sync_type)

        result = await self.db.execute(query)
        histories = result.scalars().all()

        items = [
            SyncHistoryResponse(
                sync_id=history.sync_id,
                sync_type=history.sync_type,
                sync_status=history.sync_status,
                total_count=history.total_count,
                success_count=history.success_count,
                failure_count=history.failure_count,
                error_message=history.error_message,
                sync_start_time=history.sync_start_time,
                sync_end_time=history.sync_end_time,
                in_user=history.in_user,
                in_date=history.in_date,
            )
            for history in histories
        ]

        return SyncHistoryListResponse(items=items, total=len(items))
