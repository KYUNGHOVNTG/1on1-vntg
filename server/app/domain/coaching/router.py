"""
Coaching 도메인 라우터

엔드포인트:
    GET    /v1/coaching/dashboard                          - 대시보드 (팀원 목록 + 면담 현황)
    POST   /v1/coaching/meetings                           - 미팅 레코드 생성 (REQUESTED)
    GET    /v1/coaching/meetings/{meeting_id}/pre-meeting  - 사전 준비 데이터 로드
    DELETE /v1/coaching/meetings/{meeting_id}              - 사전 준비 모달 취소 (REQUESTED 삭제)

인증:
    모든 엔드포인트는 JWT Bearer 토큰 필수 (get_current_user_id 의존성 사용)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.coaching.schemas import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    DashboardResponse,
    PreMeetingResponse,
)
from server.app.domain.coaching.service import CoachingDashboardService, CoachingPreMeetingService
from server.app.shared.exceptions import BusinessLogicException, NotFoundException

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


# =============================================
# Task 4 — 사전 준비 모달 API
# =============================================


@router.post(
    "/meetings",
    response_model=CreateMeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="미팅 레코드 생성",
    description=(
        "사전 준비 모달 열림 시 미팅 레코드를 생성합니다. "
        "status=REQUESTED 상태로 생성되며, "
        "모달 취소 시 DELETE /meetings/{meeting_id}로 삭제해야 합니다."
    ),
)
async def create_meeting(
    body: CreateMeetingRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> CreateMeetingResponse:
    """
    미팅 레코드를 생성합니다.

    Args:
        body: { member_emp_no }
        user_id: JWT에서 추출한 로그인 사용자 ID (리더)
        db: 데이터베이스 세션

    Returns:
        CreateMeetingResponse: { meeting_id, member_emp_no, status }

    Raises:
        HTTPException(404): 팀원 정보가 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "POST /coaching/meetings",
        extra={"user_id": user_id, "member_emp_no": body.member_emp_no},
    )

    try:
        service = CoachingPreMeetingService(db)
        return await service.create_meeting(
            user_id=user_id,
            member_emp_no=body.member_emp_no,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "POST /coaching/meetings 실패",
            extra={"user_id": user_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 생성 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/meetings/{meeting_id}/pre-meeting",
    response_model=PreMeetingResponse,
    summary="사전 준비 데이터 조회",
    description=(
        "사전 준비 모달에 필요한 데이터를 로드합니다. "
        "팀원 정보, 이전 미팅 미완료 Action Item, AI 추천 질문을 반환합니다. "
        "AI 추천 질문 생성은 최대 15초 내 완료되며, 타임아웃 시 빈 배열을 반환합니다."
    ),
)
async def get_pre_meeting_data(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PreMeetingResponse:
    """
    사전 준비 모달 데이터를 조회합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        PreMeetingResponse: {
            meeting_id, member_info, is_first_meeting,
            previous_action_items, ai_suggested_agendas, member_preset_agendas
        }

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/meetings/{meeting_id}/pre-meeting",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingPreMeetingService(db)
        return await service.get_pre_meeting_data(
            user_id=user_id,
            meeting_id=meeting_id,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except BusinessLogicException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "GET /coaching/meetings/{meeting_id}/pre-meeting 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사전 준비 데이터 조회 중 오류가 발생했습니다",
        ) from exc


@router.delete(
    "/meetings/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="미팅 취소 삭제",
    description=(
        "사전 준비 모달 [취소] 버튼 클릭 시 REQUESTED 상태의 미팅을 삭제합니다. "
        "IN_PROGRESS 이상의 미팅은 삭제를 거부합니다(400 반환)."
    ),
)
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    사전 준비 모달 취소 시 미팅을 삭제합니다.

    Args:
        meeting_id: 삭제할 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없거나 REQUESTED 상태가 아닐 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "DELETE /coaching/meetings/{meeting_id}",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingPreMeetingService(db)
        await service.delete_meeting(
            user_id=user_id,
            meeting_id=meeting_id,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except BusinessLogicException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "DELETE /coaching/meetings/{meeting_id} 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 삭제 중 오류가 발생했습니다",
        ) from exc
