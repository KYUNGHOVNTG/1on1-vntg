"""
Coaching 도메인 라우터

엔드포인트:
    GET /v1/coaching/dashboard - 대시보드 (팀원 목록 + 면담 현황)

인증:
    모든 엔드포인트는 JWT Bearer 토큰 필수 (get_current_user_id 의존성 사용)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.coaching.schemas import DashboardResponse
from server.app.domain.coaching.service import CoachingDashboardService
from server.app.shared.exceptions import NotFoundException

logger = get_logger(__name__)

router = APIRouter(prefix="/coaching", tags=["coaching"])


# =============================================
# Task 3 — 대시보드 API
# =============================================


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="코칭 대시보드 조회",
    description=(
        "로그인한 리더의 팀원 목록과 면담 현황 통계를 조회합니다. "
        "position_code='P005'(팀원)이고 on_work_yn='Y'(재직)인 직원만 포함됩니다. "
        "dept_code 파라미터로 부서 필터링, search_name으로 이름 검색이 가능합니다."
    ),
)
async def get_coaching_dashboard(
    dept_code: Optional[str] = Query(None, description="부서 코드 필터 (미입력 시 리더 소속 부서 전체)"),
    search_name: Optional[str] = Query(None, description="이름 검색어 (2자 이상 입력 시 적용)"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """
    코칭 대시보드를 조회합니다.

    Args:
        dept_code: 부서 코드 필터 (optional)
        search_name: 이름 검색어 (optional, 2자 미만 시 전체 조회)
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        DashboardResponse: {
            summary: { requested_count, overdue_2month, due_1month, normal_count },
            items: [{ emp_no, emp_name, dept_name, last_meeting_date, total_meeting_count, meeting_status }, ...],
            total: int
        }

    Raises:
        HTTPException(404): 로그인 사용자의 직원 정보가 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/dashboard",
        extra={"user_id": user_id, "dept_code": dept_code, "search_name": search_name},
    )

    try:
        service = CoachingDashboardService(db)
        return await service.get_dashboard(
            user_id=user_id,
            dept_code_filter=dept_code,
            search_name=search_name,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "GET /coaching/dashboard 실패",
            extra={"user_id": user_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대시보드 조회 중 오류가 발생했습니다",
        ) from exc
