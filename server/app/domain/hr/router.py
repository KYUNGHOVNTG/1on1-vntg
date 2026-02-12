"""
HR API 라우터

직원 및 부서 정보 조회 엔드포인트를 제공합니다.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.logging import get_logger
from server.app.domain.hr.schemas.employee import (
    EmployeeListResponse,
    EmployeeDetailResponse,
    ConcurrentPositionResponse,
)
from server.app.domain.hr.schemas.department import (
    DepartmentListResponse,
    DepartmentDetailResponse,
)
from server.app.domain.hr.service import EmployeeService, DepartmentService

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
    search: Optional[str] = Query(None, description="검색어 (이름 또는 사번)"),
    on_work_yn: Optional[str] = Query(None, description="재직 여부 (Y: 재직, N: 퇴직)"),
    position_code: Optional[str] = Query(None, description="직책 코드 필터"),
    dept_code: Optional[str] = Query(None, description="부서 코드 필터"),
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
    search: Optional[str] = Query(None, description="검색어 (부서명 또는 부서 코드)"),
    use_yn: Optional[str] = Query("Y", description="사용 여부 (Y: 사용, N: 미사용, null: 전체)"),
    upper_dept_code: Optional[str] = Query(
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
