"""
R&R 도메인 라우터

엔드포인트:
    GET  /v1/rnr/my                                - 나의 R&R 목록 조회
    GET  /v1/rnr/my-departments                    - 내 부서 목록 조회 (겸직 포함)
    GET  /v1/rnr/departments/{dept_code}/parent-rr - 상위 R&R 선택 목록
    POST /v1/rnr                                   - R&R 등록

인증:
    모든 엔드포인트는 JWT Bearer 토큰 필수 (get_current_user_id 의존성 사용)
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.rnr.schemas import (
    MyDepartmentsResponse,
    ParentRrOptionsResponse,
    RrCreateRequest,
    RrListResponse,
    RrResponse,
)
from server.app.domain.rnr.service import RrService

logger = get_logger(__name__)

router = APIRouter(prefix="/rnr", tags=["rnr"])

# 현재 연도 (기본값으로 사용)
_CURRENT_YEAR: str = str(datetime.utcnow().year)


# =============================================
# 조회 API
# =============================================


@router.get(
    "/my",
    response_model=RrListResponse,
    summary="나의 R&R 목록 조회",
    description=(
        "로그인한 사용자의 R&R 목록을 조회합니다. "
        "year 파라미터를 지정하지 않으면 현재 연도를 기준으로 조회합니다."
    ),
)
async def get_my_rr_list(
    year: str = Query(
        default=_CURRENT_YEAR,
        description="기준 연도 (YYYY)",
        pattern=r"^\d{4}$",
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RrListResponse:
    """
    나의 R&R 목록을 조회합니다.

    Args:
        year:    기준 연도 (YYYY, 기본값: 현재 연도)
        user_id: JWT에서 추출한 로그인 사용자 ID
        db:      데이터베이스 세션

    Returns:
        RrListResponse: { items: list[RrResponse], total: int }
    """
    logger.info(
        "GET /rnr/my",
        extra={"user_id": user_id, "year": year},
    )
    service = RrService(db)
    return await service.get_my_rr_list(user_id, year)


@router.get(
    "/my-departments",
    response_model=MyDepartmentsResponse,
    summary="내 부서 목록 조회",
    description="로그인한 사용자의 소속 부서 목록을 조회합니다 (주소속 + 겸직 부서 포함).",
)
async def get_my_departments(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MyDepartmentsResponse:
    """
    나의 부서 목록을 조회합니다.

    Args:
        user_id: JWT에서 추출한 로그인 사용자 ID
        db:      데이터베이스 세션

    Returns:
        MyDepartmentsResponse: { items: list[MyDepartmentItem], total: int }
    """
    logger.info("GET /rnr/my-departments", extra={"user_id": user_id})
    service = RrService(db)
    return await service.get_my_departments(user_id)


@router.get(
    "/departments/{dept_code}/parent-rr",
    response_model=ParentRrOptionsResponse,
    summary="상위 R&R 선택 목록 조회",
    description=(
        "부서 코드를 기준으로 상위 R&R 선택 목록을 조회합니다. "
        "직책에 따라 조회 범위가 달라집니다: "
        "P005(팀원)는 동일 부서의 LEADER R&R을, "
        "P001~P004(조직장)는 상위 부서의 LEADER R&R을 반환합니다."
    ),
)
async def get_parent_rr_options(
    dept_code: str,
    year: str = Query(
        default=_CURRENT_YEAR,
        description="기준 연도 (YYYY)",
        pattern=r"^\d{4}$",
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ParentRrOptionsResponse:
    """
    상위 R&R 선택 목록을 조회합니다.

    Args:
        dept_code: 부서 코드 (Path Parameter)
        year:      기준 연도 (YYYY, 기본값: 현재 연도)
        user_id:   JWT에서 추출한 로그인 사용자 ID
        db:        데이터베이스 세션

    Returns:
        ParentRrOptionsResponse: { items: list[ParentRrOption], total: int }
    """
    logger.info(
        "GET /rnr/departments/{dept_code}/parent-rr",
        extra={"user_id": user_id, "dept_code": dept_code, "year": year},
    )
    service = RrService(db)
    return await service.get_parent_rr_options(user_id, dept_code, year)


# =============================================
# 등록 API
# =============================================


@router.post(
    "",
    response_model=RrResponse,
    status_code=status.HTTP_201_CREATED,
    summary="R&R 등록",
    description=(
        "새로운 R&R을 등록합니다. "
        "RR_TYPE은 직책 코드에 따라 자동 결정됩니다 "
        "(P005 → MEMBER, P001~P004 → LEADER). "
        "수행 기간은 최소 1개 이상 입력해야 합니다."
    ),
)
async def create_rr(
    request: RrCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RrResponse:
    """
    R&R을 등록합니다.

    Args:
        request: R&R 등록 요청 데이터
        user_id: JWT에서 추출한 로그인 사용자 ID
        db:      데이터베이스 세션

    Returns:
        RrResponse: 등록된 R&R 정보
    """
    logger.info(
        "POST /rnr",
        extra={"user_id": user_id, "year": request.year, "title": request.title},
    )
    service = RrService(db)
    return await service.create_rr(user_id, request)
