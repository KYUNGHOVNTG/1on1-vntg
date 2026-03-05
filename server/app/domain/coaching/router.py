"""
Coaching 도메인 라우터

엔드포인트:
    GET    /v1/coaching/dashboard                                              - 대시보드 (팀원 목록 + 면담 현황)
    POST   /v1/coaching/meetings                                               - 미팅 레코드 생성 (REQUESTED)
    GET    /v1/coaching/meetings/{meeting_id}/pre-meeting                      - 사전 준비 데이터 로드
    DELETE /v1/coaching/meetings/{meeting_id}                                  - 사전 준비 모달 취소 (REQUESTED 삭제)
    PATCH  /v1/coaching/meetings/{meeting_id}/start                            - 미팅 시작 (IN_PROGRESS)
    GET    /v1/coaching/meetings/{meeting_id}/active                           - 미팅 실행 화면 초기 데이터
    GET    /v1/coaching/members/{member_emp_no}/rnr                            - 팀원 R&R 계층 구조 조회
    POST   /v1/coaching/meetings/{meeting_id}/timelines                        - 타임라인 카드 생성
    PATCH  /v1/coaching/meetings/{meeting_id}/timelines/{timeline_id}          - 타임라인 카드 마감/편집
    PATCH  /v1/coaching/meetings/{meeting_id}/memo                             - 개인 메모 저장
    PATCH  /v1/coaching/meetings/{meeting_id}/agendas/{agenda_id}/complete     - 아젠다 완료 토글
    PATCH  /v1/coaching/meetings/{meeting_id}/action-items/{action_item_id}/complete - Action Item 완료 토글
    POST   /v1/coaching/meetings/{meeting_id}/agendas                          - 즉석 아젠다 추가
    GET    /v1/coaching/meetings/{meeting_id}/ai-questions                     - AI 스마트 아젠다 새로고침
    POST   /v1/coaching/meetings/{meeting_id}/presigned-url                    - GCS Presigned Upload URL 발급
    PATCH  /v1/coaching/meetings/{meeting_id}/complete                         - 미팅 종료 처리 (PROCESSING 전환)
    GET    /v1/coaching/members/{member_emp_no}/meetings                       - 팀원별 미팅 히스토리 목록
    GET    /v1/coaching/meetings/{meeting_id}/report                           - 미팅 상세 리포트 (Bento Grid 데이터)
    GET    /v1/coaching/meetings/{meeting_id}/audio-url                        - GCS Presigned Download URL 발급

인증:
    모든 엔드포인트는 JWT Bearer 토큰 필수 (get_current_user_id 의존성 사용)
"""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.database import get_db
from server.app.core.dependencies import get_current_user_id
from server.app.core.logging import get_logger
from server.app.domain.coaching.schemas import (
    ActiveMeetingResponse,
    AiQuestionsResponse,
    AudioUrlResponse,
    CompleteMeetingRequest,
    CreateAgendaRequest,
    CreateAgendaResponse,
    CreateMeetingRequest,
    CreateMeetingResponse,
    CreateTimelineRequest,
    CreateTimelineResponse,
    DashboardResponse,
    MeetingHistoryResponse,
    MeetingReportResponse,
    MeetingStartRequest,
    PatchMemoRequest,
    PatchTimelineRequest,
    PreMeetingResponse,
    PresignedUrlResponse,
    RrTreeResponse,
)
from server.app.domain.coaching.service import (
    CoachingActiveMeetingService,
    CoachingCompleteMeetingService,
    CoachingDashboardService,
    CoachingHistoryService,
    CoachingPreMeetingService,
)
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


# =============================================
# Task 5 — 미팅 실행 API
# =============================================


@router.patch(
    "/meetings/{meeting_id}/start",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="미팅 시작",
    description=(
        "미팅 상태를 IN_PROGRESS로 전환하고 started_at을 기록합니다. "
        "REQUESTED 상태인 미팅만 시작 가능합니다 (중복 시작 방지). "
        "이전 N-1, N-2 미팅의 미완료 Action Item이 현재 미팅으로 이월됩니다. "
        "사전 준비 모달에서 선택한 아젠다(AI_SUGGESTED, LEADER_ADDED)를 INSERT합니다."
    ),
)
async def start_meeting(
    meeting_id: str,
    body: MeetingStartRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    미팅을 시작합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        body: { agendas: [{ content, source }, ...] }
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없거나 REQUESTED 상태가 아닐 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/start",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        await service.start_meeting(
            user_id=user_id,
            meeting_id=meeting_id,
            agendas=[a.model_dump() for a in body.agendas],
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
            "PATCH /coaching/meetings/{meeting_id}/start 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 시작 처리 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/meetings/{meeting_id}/active",
    response_model=ActiveMeetingResponse,
    summary="미팅 실행 화면 초기 데이터 조회",
    description=(
        "미팅 실행 화면에 필요한 초기 데이터를 반환합니다. "
        "아젠다, Action Item, 타임라인을 포함합니다. "
        "private_memo는 리더만 반환됩니다."
    ),
)
async def get_active_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ActiveMeetingResponse:
    """
    미팅 실행 화면 초기 데이터를 조회합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        ActiveMeetingResponse: 미팅 실행 화면 전체 데이터

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/meetings/{meeting_id}/active",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        return await service.get_active_meeting(user_id=user_id, meeting_id=meeting_id)
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
            "GET /coaching/meetings/{meeting_id}/active 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 실행 데이터 조회 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/members/{member_emp_no}/rnr",
    response_model=RrTreeResponse,
    summary="팀원 R&R 계층 구조 조회",
    description=(
        "팀원의 R&R을 계층 트리 구조로 반환합니다. "
        "현재 연도 기준 MEMBER 타입 R&R만 조회합니다. "
        "미팅 실행 화면의 R&R 패널에서 사용됩니다."
    ),
)
async def get_member_rnr_tree(
    member_emp_no: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RrTreeResponse:
    """
    팀원의 R&R 계층 구조를 조회합니다.

    Args:
        member_emp_no: 팀원 사번
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        RrTreeResponse: { items: [RrTreeNode, ...], total: int }

    Raises:
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/members/{member_emp_no}/rnr",
        extra={"user_id": user_id, "member_emp_no": member_emp_no},
    )

    try:
        service = CoachingActiveMeetingService(db)
        return await service.get_member_rnr_tree(
            user_id=user_id,
            member_emp_no=member_emp_no,
        )
    except Exception as exc:
        logger.error(
            "GET /coaching/members/{member_emp_no}/rnr 실패",
            extra={"user_id": user_id, "member_emp_no": member_emp_no, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="R&R 조회 중 오류가 발생했습니다",
        ) from exc


@router.post(
    "/meetings/{meeting_id}/timelines",
    response_model=CreateTimelineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="타임라인 카드 생성",
    description=(
        "R&R 클릭 시 타임라인 카드를 생성합니다. "
        "기존에 end_time IS NULL인 활성 카드가 있으면 start_time으로 자동 마감 후 신규 생성합니다."
    ),
)
async def create_timeline(
    meeting_id: str,
    body: CreateTimelineRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> CreateTimelineResponse:
    """
    타임라인 카드를 생성합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        body: { rr_id?, start_time }
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        CreateTimelineResponse: 생성된 타임라인 정보

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "POST /coaching/meetings/{meeting_id}/timelines",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        return await service.create_timeline(
            user_id=user_id,
            meeting_id=meeting_id,
            rr_id=body.rr_id,
            start_time=body.start_time,
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
            "POST /coaching/meetings/{meeting_id}/timelines 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="타임라인 생성 중 오류가 발생했습니다",
        ) from exc


@router.patch(
    "/meetings/{meeting_id}/timelines/{timeline_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="타임라인 카드 마감 또는 구간 요약 편집",
    description=(
        "end_time만 전달 시 → 카드 마감 (미팅 실행 중). "
        "segment_summary만 전달 시 → 구간 요약 수정 (히스토리 리포트에서 편집). "
        "Task 5와 Task 7 공용 엔드포인트입니다."
    ),
)
async def patch_timeline(
    meeting_id: str,
    timeline_id: str,
    body: PatchTimelineRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    타임라인 카드를 업데이트합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        timeline_id: 타임라인 UUID 문자열
        body: { end_time?, segment_summary? }
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅 또는 타임라인이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/timelines/{timeline_id}",
        extra={"user_id": user_id, "meeting_id": meeting_id, "timeline_id": timeline_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        await service.patch_timeline(
            user_id=user_id,
            meeting_id=meeting_id,
            timeline_id=timeline_id,
            body=body,
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
            "PATCH /coaching/meetings/{meeting_id}/timelines/{timeline_id} 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="타임라인 업데이트 중 오류가 발생했습니다",
        ) from exc


@router.patch(
    "/meetings/{meeting_id}/memo",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="개인 메모 저장",
    description=(
        "리더 전용 비공개 메모를 저장합니다. "
        "프론트엔드에서 2초 debounce 자동 저장으로 호출됩니다. "
        "리더가 아닌 경우 400 에러를 반환합니다."
    ),
)
async def update_memo(
    meeting_id: str,
    body: PatchMemoRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    개인 메모를 저장합니다. (리더 전용)

    Args:
        meeting_id: 미팅 UUID 문자열
        body: { private_memo }
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 리더가 아닐 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/memo",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        await service.update_memo(
            user_id=user_id,
            meeting_id=meeting_id,
            private_memo=body.private_memo,
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
            "PATCH /coaching/meetings/{meeting_id}/memo 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="메모 저장 중 오류가 발생했습니다",
        ) from exc


@router.patch(
    "/meetings/{meeting_id}/agendas/{agenda_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="아젠다 완료 토글",
    description="아젠다의 완료 상태를 토글합니다. (is_completed 반전)",
)
async def toggle_agenda_complete(
    meeting_id: str,
    agenda_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    아젠다의 완료 상태를 토글합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        agenda_id: 아젠다 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅 또는 아젠다가 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/agendas/{agenda_id}/complete",
        extra={"user_id": user_id, "meeting_id": meeting_id, "agenda_id": agenda_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        await service.toggle_agenda_complete(
            user_id=user_id,
            meeting_id=meeting_id,
            agenda_id=agenda_id,
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
            "PATCH /coaching/meetings/{meeting_id}/agendas/{agenda_id}/complete 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="아젠다 완료 처리 중 오류가 발생했습니다",
        ) from exc


@router.patch(
    "/meetings/{meeting_id}/action-items/{action_item_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Action Item 완료 토글",
    description=(
        "Action Item의 완료 상태를 토글합니다. "
        "이월 항목도 현재 미팅 row에서만 업데이트됩니다 (원본 미팅 불변)."
    ),
)
async def toggle_action_item_complete(
    meeting_id: str,
    action_item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Action Item의 완료 상태를 토글합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        action_item_id: Action Item UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅 또는 Action Item이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/action-items/{action_item_id}/complete",
        extra={
            "user_id": user_id,
            "meeting_id": meeting_id,
            "action_item_id": action_item_id,
        },
    )

    try:
        service = CoachingActiveMeetingService(db)
        await service.toggle_action_item_complete(
            user_id=user_id,
            meeting_id=meeting_id,
            action_item_id=action_item_id,
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
            "PATCH /coaching/meetings/{meeting_id}/action-items/{action_item_id}/complete 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Action Item 완료 처리 중 오류가 발생했습니다",
        ) from exc


@router.post(
    "/meetings/{meeting_id}/agendas",
    response_model=CreateAgendaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="즉석 아젠다 추가",
    description=(
        "리더가 미팅 실행 중 즉석으로 아젠다를 추가합니다. "
        "source=LEADER_ADDED로 자동 설정됩니다."
    ),
)
async def create_agenda(
    meeting_id: str,
    body: CreateAgendaRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> CreateAgendaResponse:
    """
    즉석 아젠다를 추가합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        body: { content }
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        CreateAgendaResponse: 생성된 아젠다 정보

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "POST /coaching/meetings/{meeting_id}/agendas",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        return await service.create_agenda(
            user_id=user_id,
            meeting_id=meeting_id,
            content=body.content,
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
            "POST /coaching/meetings/{meeting_id}/agendas 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="아젠다 추가 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/meetings/{meeting_id}/ai-questions",
    response_model=AiQuestionsResponse,
    summary="AI 스마트 아젠다 새로고침",
    description=(
        "LLM을 재호출하여 AI 추천 질문을 새로 생성합니다. "
        "LLM 실패 시 빈 배열을 반환합니다 (프론트에서 이전 질문 유지 + 에러 토스트 처리)."
    ),
)
async def get_ai_questions(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AiQuestionsResponse:
    """
    AI 추천 질문을 새로고침합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        AiQuestionsResponse: { ai_suggested_agendas: [str, ...] }

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/meetings/{meeting_id}/ai-questions",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingActiveMeetingService(db)
        return await service.get_ai_questions(user_id=user_id, meeting_id=meeting_id)
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
            "GET /coaching/meetings/{meeting_id}/ai-questions 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI 질문 조회 중 오류가 발생했습니다",
        ) from exc


# =============================================
# Task 6 — 미팅 종료 + GCS 업로드 API
# =============================================


@router.post(
    "/meetings/{meeting_id}/presigned-url",
    response_model=PresignedUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="GCS Presigned Upload URL 발급",
    description=(
        "미팅 종료 전 프론트엔드가 오디오 파일을 GCS에 직접 업로드하기 위한 "
        "Presigned URL을 발급합니다. "
        "URL 만료 시간은 1시간(3600초)입니다. "
        "리더만 호출 가능합니다."
    ),
)
async def get_presigned_url(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PresignedUrlResponse:
    """
    GCS Presigned Upload URL을 발급합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Returns:
        PresignedUrlResponse: { presigned_url, gcs_path, expires_at }

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): GCS 오류 또는 서버 내부 오류
    """
    logger.info(
        "POST /coaching/meetings/{meeting_id}/presigned-url",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingCompleteMeetingService(db)
        return await service.get_presigned_url(
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
            "POST /coaching/meetings/{meeting_id}/presigned-url 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Presigned URL 발급 중 오류가 발생했습니다",
        ) from exc


@router.patch(
    "/meetings/{meeting_id}/complete",
    status_code=status.HTTP_200_OK,
    summary="미팅 종료 처리",
    description=(
        "GCS 업로드 완료 후 미팅 종료를 처리합니다. "
        "status=PROCESSING으로 전환하고, TbMeetingRecord와 TbCoachingRelation을 갱신합니다. "
        "AI 파이프라인이 BackgroundTask로 트리거됩니다. "
        "이미 PROCESSING/COMPLETED 상태이면 멱등 처리(200 반환)합니다. "
        "gcs_path 누락 시 status=FAILED로 전환합니다."
    ),
)
async def complete_meeting(
    meeting_id: str,
    body: CompleteMeetingRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    미팅 종료를 처리합니다.

    Args:
        meeting_id: 미팅 UUID 문자열
        body: { actual_duration_seconds, gcs_path, private_memo? }
        background_tasks: FastAPI BackgroundTasks (AI 파이프라인 트리거용)
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없을 때
        HTTPException(400): 권한 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "PATCH /coaching/meetings/{meeting_id}/complete",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingCompleteMeetingService(db)
        await service.complete_meeting(
            user_id=user_id,
            meeting_id=meeting_id,
            body=body,
            background_tasks=background_tasks,
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
            "PATCH /coaching/meetings/{meeting_id}/complete 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 종료 처리 중 오류가 발생했습니다",
        ) from exc


# =============================================
# Task 7 — 히스토리 및 리포트 엔드포인트
# =============================================


@router.get(
    "/members/{member_emp_no}/meetings",
    response_model=MeetingHistoryResponse,
    summary="팀원별 미팅 히스토리 목록",
)
async def get_member_meetings(
    member_emp_no: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MeetingHistoryResponse:
    """
    특정 팀원과의 미팅 히스토리 목록을 최신순으로 반환합니다.

    REQUESTED 상태(모달 열기 취소된 미팅)는 제외합니다.

    Args:
        member_emp_no: 팀원 사원번호
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 팀원 정보를 찾을 수 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/members/{member_emp_no}/meetings",
        extra={"user_id": user_id, "member_emp_no": member_emp_no},
    )

    try:
        service = CoachingHistoryService(db)
        return await service.get_member_meetings(
            user_id=user_id,
            member_emp_no=member_emp_no,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "GET /coaching/members/{member_emp_no}/meetings 실패",
            extra={"user_id": user_id, "member_emp_no": member_emp_no, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 히스토리 조회 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/meetings/{meeting_id}/report",
    response_model=MeetingReportResponse,
    summary="미팅 상세 리포트",
)
async def get_meeting_report(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MeetingReportResponse:
    """
    미팅 상세 리포트(Bento Grid 데이터)를 반환합니다.

    권한:
        - 리더: private_memo 포함
        - 팀원: private_memo = None (DTO 레벨에서 원천 차단)

    audio_url은 포함되지 않으며, GET /audio-url 별도 호출을 사용합니다.

    PROCESSING 상태: 부분 데이터 허용 (ai_summary, timelines.segment_summary 등은 None)

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없거나 접근 권한이 없을 때
        HTTPException(500): 서버 내부 오류
    """
    logger.info(
        "GET /coaching/meetings/{meeting_id}/report",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingHistoryService(db)
        return await service.get_meeting_report(
            user_id=user_id,
            meeting_id=meeting_id,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "GET /coaching/meetings/{meeting_id}/report 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="미팅 리포트 조회 중 오류가 발생했습니다",
        ) from exc


@router.get(
    "/meetings/{meeting_id}/audio-url",
    response_model=AudioUrlResponse,
    summary="오디오 Presigned Download URL 발급",
)
async def get_audio_url(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AudioUrlResponse:
    """
    GCS Presigned Download URL을 발급합니다.

    매 요청마다 새로운 URL을 발급하며 캐싱하지 않습니다. (만료: 1시간)
    오디오 재생 중 URL 만료 시 이 엔드포인트를 재호출하여 갱신합니다.

    권한:
        - 리더(meeting.leader_emp_no): 접근 가능
        - 팀원(meeting.member_emp_no): 접근 가능
        - 그 외: 404 반환

    Args:
        meeting_id: 미팅 UUID 문자열
        user_id: JWT에서 추출한 로그인 사용자 ID
        db: 데이터베이스 세션

    Raises:
        HTTPException(404): 미팅이 없거나 녹음 파일이 없거나 권한이 없을 때
        HTTPException(500): GCS 오류 또는 서버 내부 오류
    """
    logger.info(
        "GET /coaching/meetings/{meeting_id}/audio-url",
        extra={"user_id": user_id, "meeting_id": meeting_id},
    )

    try:
        service = CoachingHistoryService(db)
        return await service.get_audio_url(
            user_id=user_id,
            meeting_id=meeting_id,
        )
    except NotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error(
            "GET /coaching/meetings/{meeting_id}/audio-url 실패",
            extra={"user_id": user_id, "meeting_id": meeting_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="오디오 URL 발급 중 오류가 발생했습니다",
        ) from exc
