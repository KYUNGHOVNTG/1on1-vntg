"""
HR API 라우터

직원 및 부서 정보 조회 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.logging import get_logger
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
)
from server.app.domain.hr.service import DepartmentService, EmployeeService

logger = get_logger(__name__)

router = APIRouter(prefix="/hr", tags=["hr"])


# =============================================
# 직원 정보 API
# =============================================


@router.get(
    "/employees",
    response_model=EmployeeListResponse,
    summary="직원 목록 조회",
    description="직원 목록을 조회합니다 (검색, 필터링, 페이징 지원)",
)
async def get_employees(
    search: str | None = Query(None, description="검색어 (이름 또는 사번)"),
    on_work_yn: str | None = Query(None, description="재직 여부 (Y: 재직, N: 퇴직)"),
    position_code: str | None = Query(None, description="직책 코드 필터"),
    dept_code: str | None = Query(None, description="부서 코드 필터"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기 (1-100)"),
    db: AsyncSession = Depends(get_db),
) -> EmployeeListResponse:
    """
    직원 목록을 조회합니다.

    Args:
        search: 검색어 (이름 또는 사번)
        on_work_yn: 재직 여부 필터
        position_code: 직책 코드 필터
        dept_code: 부서 코드 필터
        page: 페이지 번호
        size: 페이지 크기
        db: 데이터베이스 세션

    Returns:
        EmployeeListResponse: 직원 목록 및 페이징 정보
    """
    logger.info(
        "직원 목록 조회",
        extra={
            "search": search,
            "on_work_yn": on_work_yn,
            "position_code": position_code,
            "dept_code": dept_code,
            "page": page,
            "size": size,
        },
    )

    service = EmployeeService(db)
    return await service.get_employee_list(
        search=search,
        on_work_yn=on_work_yn,
        position_code=position_code,
        dept_code=dept_code,
        page=page,
        size=size,
    )


@router.get(
    "/employees/{emp_no}",
    response_model=EmployeeDetailResponse,
    summary="직원 상세 조회",
    description="사번으로 직원 상세 정보를 조회합니다",
)
async def get_employee(
    emp_no: str,
    db: AsyncSession = Depends(get_db),
) -> EmployeeDetailResponse:
    """
    직원 상세 정보를 조회합니다.

    Args:
        emp_no: 사번
        db: 데이터베이스 세션

    Returns:
        EmployeeDetailResponse: 직원 상세 정보

    Raises:
        HTTPException(404): 직원을 찾을 수 없는 경우
    """
    logger.info("직원 상세 조회", extra={"emp_no": emp_no})

    service = EmployeeService(db)
    return await service.get_employee_detail(emp_no)


@router.get(
    "/employees/{emp_no}/concurrent-positions",
    response_model=list[ConcurrentPositionResponse],
    summary="직원 겸직 정보 조회",
    description="사번으로 직원의 겸직 정보를 조회합니다 (주소속 포함)",
)
async def get_concurrent_positions(
    emp_no: str,
    db: AsyncSession = Depends(get_db),
) -> list[ConcurrentPositionResponse]:
    """
    직원의 겸직 정보를 조회합니다.

    Args:
        emp_no: 사번
        db: 데이터베이스 세션

    Returns:
        list[ConcurrentPositionResponse]: 겸직 정보 목록 (주소속 포함)

    Raises:
        HTTPException(404): 직원을 찾을 수 없는 경우
    """
    logger.info("직원 겸직 정보 조회", extra={"emp_no": emp_no})

    service = EmployeeService(db)
    return await service.get_concurrent_positions(emp_no)


# =============================================
# 부서 정보 API
# =============================================


@router.get(
    "/departments",
    response_model=DepartmentListResponse,
    summary="부서 목록 조회",
    description="부서 목록을 조회합니다 (검색, 필터링 지원)",
)
async def get_departments(
    search: str | None = Query(None, description="검색어 (부서명 또는 부서 코드)"),
    use_yn: str | None = Query("Y", description="사용 여부 (Y: 사용, N: 미사용, null: 전체)"),
    upper_dept_code: str | None = Query(
        None, description="상위 부서 코드 (빈 문자열: 최상위, null: 전체)"
    ),
    db: AsyncSession = Depends(get_db),
) -> DepartmentListResponse:
    """
    부서 목록을 조회합니다.

    Args:
        search: 검색어 (부서명 또는 부서 코드)
        use_yn: 사용 여부 필터
        upper_dept_code: 상위 부서 코드 필터
        db: 데이터베이스 세션

    Returns:
        DepartmentListResponse: 부서 목록
    """
    logger.info(
        "부서 목록 조회",
        extra={
            "search": search,
            "use_yn": use_yn,
            "upper_dept_code": upper_dept_code,
        },
    )

    service = DepartmentService(db)
    return await service.get_department_list(
        search=search,
        use_yn=use_yn,
        upper_dept_code=upper_dept_code,
    )


@router.get(
    "/departments/{dept_code}",
    response_model=DepartmentDetailResponse,
    summary="부서 상세 조회",
    description="부서 코드로 부서 상세 정보를 조회합니다",
)
async def get_department(
    dept_code: str,
    db: AsyncSession = Depends(get_db),
) -> DepartmentDetailResponse:
    """
    부서 상세 정보를 조회합니다.

    Args:
        dept_code: 부서 코드
        db: 데이터베이스 세션

    Returns:
        DepartmentDetailResponse: 부서 상세 정보

    Raises:
        HTTPException(404): 부서를 찾을 수 없는 경우
    """
    logger.info("부서 상세 조회", extra={"dept_code": dept_code})

    service = DepartmentService(db)
    return await service.get_department_detail(dept_code)


# =============================================
# 조직도 API
# =============================================


@router.get(
    "/org-tree",
    response_model=OrgTreeResponse,
    summary="조직도 트리 조회",
    description=(
        "조직도를 계층형 트리 구조로 조회합니다. "
        "기준 연도를 지정하지 않으면 최신 연도를 자동으로 조회합니다."
    ),
)
async def get_org_tree(
    std_year: str | None = Query(
        None, description="기준 연도 (YYYY). 미지정 시 최신 연도 자동 조회"
    ),
    db: AsyncSession = Depends(get_db),
) -> OrgTreeResponse:
    """
    조직도 트리를 조회합니다.

    Args:
        std_year: 기준 연도 (YYYY)
        db: 데이터베이스 세션

    Returns:
        OrgTreeResponse: 조직도 트리

    Raises:
        HTTPException(404): 조직도 데이터가 없는 경우
    """
    logger.info("조직도 트리 조회", extra={"std_year": std_year})

    service = DepartmentService(db)
    return await service.get_org_tree(std_year=std_year)


@router.get(
    "/departments/{dept_code}/info",
    response_model=DepartmentInfo,
    summary="부서 상세 정보 조회 (부서장명, 직원 수 포함)",
    description=(
        "부서 코드로 부서 상세 정보를 조회합니다. "
        "부서장 성명과 소속 직원 수(겸직 포함)가 포함됩니다."
    ),
)
async def get_department_info(
    dept_code: str,
    db: AsyncSession = Depends(get_db),
) -> DepartmentInfo:
    """
    부서 상세 정보를 조회합니다 (부서장명, 직원 수 포함).

    Args:
        dept_code: 부서 코드
        db: 데이터베이스 세션

    Returns:
        DepartmentInfo: 부서 상세 정보

    Raises:
        HTTPException(404): 부서를 찾을 수 없는 경우
    """
    logger.info("부서 상세 정보 조회", extra={"dept_code": dept_code})

    service = DepartmentService(db)
    return await service.get_department_info(dept_code)


@router.get(
    "/departments/{dept_code}/employees",
    response_model=list[EmployeeDetailResponse],
    summary="부서별 직원 목록 조회",
    description=("특정 부서에 소속된 직원 목록을 조회합니다. " "기본적으로 겸직자도 포함됩니다."),
)
async def get_department_employees(
    dept_code: str,
    include_concurrent: bool = Query(
        True, description="겸직자 포함 여부 (True: 포함, False: 주소속만)"
    ),
    db: AsyncSession = Depends(get_db),
) -> list[EmployeeDetailResponse]:
    """
    부서별 직원 목록을 조회합니다.

    Args:
        dept_code: 부서 코드
        include_concurrent: 겸직자 포함 여부
        db: 데이터베이스 세션

    Returns:
        list[EmployeeDetailResponse]: 소속 직원 목록

    Raises:
        HTTPException(404): 부서를 찾을 수 없는 경우
    """
    logger.info(
        "부서별 직원 목록 조회",
        extra={"dept_code": dept_code, "include_concurrent": include_concurrent},
    )

    service = DepartmentService(db)
    return await service.get_department_employees(dept_code, include_concurrent=include_concurrent)
