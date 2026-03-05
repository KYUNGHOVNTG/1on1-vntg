"""
Coaching 도메인 Repository

책임:
    - DB에서 Coaching 관련 데이터 조회/저장
    - Service 레이어에서 직접 DB 접근 금지 → 이 클래스로 위임

메서드 목록 (Task 3):
    - find_emp_no_by_user_id   : user_id → emp_no 조회
    - find_leader_info         : 리더의 인사정보 조회
    - find_team_members_with_coaching : 팀원 목록 + 코칭 통계 LEFT JOIN 조회

메서드 목록 (Task 4):
    - find_member_info               : 팀원 인사정보 조회
    - create_meeting                 : 미팅 레코드 생성 (status=REQUESTED)
    - find_meeting_by_id             : 미팅 단건 조회
    - delete_meeting                 : 미팅 레코드 삭제
    - find_previous_completed_meetings : leader-member 간 이전 COMPLETED 미팅 조회
    - find_incomplete_action_items   : 미완료 Action Item 조회
    - find_member_rnr_titles         : 팀원 R&R 제목 목록 조회 (LLM 프롬프트용)

메서드 목록 (Task 5):
    - start_meeting                  : 미팅 IN_PROGRESS 전환 + started_at 기록
    - insert_agendas                 : 아젠다 일괄 INSERT
    - copy_action_items_as_carried_over : 이전 미팅 미완료 Action Item 이월 복사 INSERT
    - find_meeting_with_active_data  : 미팅 + 아젠다 + 액션아이템 + 타임라인 일괄 조회
    - find_member_rnr_tree           : 팀원 R&R 계층 구조 조회
    - create_timeline                : 타임라인 카드 생성
    - find_open_timeline             : end_time IS NULL 타임라인 조회
    - patch_timeline                 : 타임라인 카드 업데이트
    - update_meeting_memo            : 개인 메모 업데이트
    - toggle_agenda_complete         : 아젠다 완료 토글
    - toggle_action_item_complete    : Action Item 완료 토글
    - create_agenda                  : 즉석 아젠다 추가
    - find_agenda_max_order          : 현재 미팅 아젠다 최대 order 조회

메서드 목록 (Task 6):
    - complete_meeting                 : 미팅 PROCESSING 전환 + completed_at/actual_duration 기록
    - create_meeting_record            : TbMeetingRecord INSERT (audio_file_url 포함)
    - upsert_coaching_relation         : TbCoachingRelation UPSERT (없으면 INSERT, 있으면 UPDATE)
    - close_open_timeline_with_duration : 미팅 종료 시 마지막 활성 타임라인 자동 마감
    - mark_meeting_failed              : 미팅 status = FAILED 전환
    - find_stuck_processing_meetings   : 30분 이상 PROCESSING 고착 미팅 조회 (스케줄러용)

메서드 목록 (Task 7):
    - find_meetings_by_member          : 팀원별 미팅 히스토리 목록 조회 (최신순)
    - find_meeting_with_report_data    : 미팅 리포트용 데이터 조회 (record + timelines + action_items)
"""

import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import and_, desc, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.app.core.logging import get_logger
from server.app.domain.coaching.models import (
    TbCoachingRelation,
    TbMeeting,
    TbMeetingActionItem,
    TbMeetingAgenda,
    TbMeetingRecord,
    TbMeetingTimeline,
)
from server.app.domain.hr.models.department import CMDepartment
from server.app.domain.hr.models.employee import HRMgnt
from server.app.domain.rnr.models import Rr
from server.app.shared.exceptions import NotFoundException, RepositoryException

logger = get_logger(__name__)

# 팀원 직책 코드
MEMBER_POSITION_CODE: str = "P005"


class CoachingRepository:
    """
    Coaching 도메인 데이터 접근 클래스

    SQLAlchemy를 사용하여 실제 데이터베이스에 접근합니다.
    Service 레이어에서 직접 DB 쿼리 작성 금지.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def find_emp_no_by_user_id(self, user_id: str) -> str:
        """
        user_id(JWT 토큰)로 직원 사번(emp_no)을 조회합니다.

        Args:
            user_id: 로그인 사용자 ID (cm_user.user_id)

        Returns:
            str: 직원 사번 (emp_no)

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_emp_no_by_user_id called", extra={"user_id": user_id})

        stmt = select(HRMgnt.emp_no).where(HRMgnt.user_id == user_id)
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            raise NotFoundException(
                message="직원 정보를 찾을 수 없습니다",
                details={"user_id": user_id},
            )

        return row.emp_no

    async def find_leader_info(self, emp_no: str) -> dict[str, Any]:
        """
        리더의 인사정보(dept_code 포함)를 조회합니다.

        Args:
            emp_no: 리더 사번

        Returns:
            dict: emp_no, dept_code, name_kor

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_leader_info called", extra={"emp_no": emp_no})

        stmt = select(HRMgnt).where(HRMgnt.emp_no == emp_no)
        result = await self.db.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            raise NotFoundException(
                message="리더 정보를 찾을 수 없습니다",
                details={"emp_no": emp_no},
            )

        return {
            "emp_no": row.emp_no,
            "dept_code": row.dept_code,
            "name_kor": row.name_kor,
        }

    async def find_team_members_with_coaching(
        self,
        leader_emp_no: str,
        leader_dept_code: str,
        dept_code_filter: Optional[str] = None,
        search_name: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        팀원 목록과 코칭 통계를 함께 조회합니다 (LEFT JOIN).

        - position_code == 'P005' (팀원만)
        - on_work_yn == 'Y' (재직자만)
        - dept_code == leader_dept_code (같은 부서)
        - emp_no != leader_emp_no (리더 자신 제외)

        Args:
            leader_emp_no: 리더 사번 (자신 제외)
            leader_dept_code: 리더 부서 코드
            dept_code_filter: 부서 코드 추가 필터 (optional)
            search_name: 이름 검색어 (optional, 2자 미만 시 전체 조회)

        Returns:
            list[dict]: 팀원 목록 (emp_no, emp_name, dept_name, last_meeting_date, total_meeting_count)
        """
        logger.info(
            "find_team_members_with_coaching called",
            extra={
                "leader_emp_no": leader_emp_no,
                "leader_dept_code": leader_dept_code,
                "dept_code_filter": dept_code_filter,
                "search_name": search_name,
            },
        )

        try:
            # 기본 조건
            conditions = [
                HRMgnt.position_code == MEMBER_POSITION_CODE,
                HRMgnt.on_work_yn == "Y",
                HRMgnt.dept_code == leader_dept_code,
                HRMgnt.emp_no != leader_emp_no,
            ]

            # 부서 필터 (추가 필터)
            if dept_code_filter:
                conditions.append(HRMgnt.dept_code == dept_code_filter)

            # 이름 검색 (2자 이상인 경우에만 적용)
            if search_name and len(search_name) >= 2:
                conditions.append(HRMgnt.name_kor.ilike(f"%{search_name}%"))

            # HRMgnt + CMDepartment + TbCoachingRelation (LEFT JOIN)
            stmt = (
                select(
                    HRMgnt.emp_no,
                    HRMgnt.name_kor.label("emp_name"),
                    CMDepartment.dept_name,
                    TbCoachingRelation.last_meeting_date,
                    TbCoachingRelation.total_meeting_count,
                )
                .join(
                    CMDepartment,
                    HRMgnt.dept_code == CMDepartment.dept_code,
                    isouter=False,
                )
                .outerjoin(
                    TbCoachingRelation,
                    and_(
                        TbCoachingRelation.leader_emp_no == leader_emp_no,
                        TbCoachingRelation.member_emp_no == HRMgnt.emp_no,
                    ),
                )
                .where(and_(*conditions))
                .order_by(HRMgnt.name_kor)
            )

            result = await self.db.execute(stmt)
            rows = result.all()

            return [
                {
                    "emp_no": row.emp_no,
                    "emp_name": row.emp_name,
                    "dept_name": row.dept_name,
                    "last_meeting_date": row.last_meeting_date,
                    "total_meeting_count": row.total_meeting_count or 0,
                }
                for row in rows
            ]

        except NotFoundException:
            raise
        except Exception as exc:
            logger.error(
                "find_team_members_with_coaching 실패",
                extra={"leader_emp_no": leader_emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "팀원 목록 조회에 실패했습니다",
                details={"leader_emp_no": leader_emp_no},
            ) from exc

    # =============================================
    # Task 4 — 사전 준비 모달 Repository 메서드
    # =============================================

    async def find_member_info(self, member_emp_no: str) -> dict[str, Any]:
        """
        팀원 인사정보를 조회합니다.

        Args:
            member_emp_no: 팀원 사번

        Returns:
            dict: emp_no, emp_name, dept_name

        Raises:
            NotFoundException: 팀원 정보가 없을 때
        """
        logger.info("find_member_info called", extra={"member_emp_no": member_emp_no})

        stmt = (
            select(
                HRMgnt.emp_no,
                HRMgnt.name_kor.label("emp_name"),
                CMDepartment.dept_name,
            )
            .join(CMDepartment, HRMgnt.dept_code == CMDepartment.dept_code)
            .where(HRMgnt.emp_no == member_emp_no)
        )
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            raise NotFoundException(
                message="팀원 정보를 찾을 수 없습니다",
                details={"member_emp_no": member_emp_no},
            )

        return {
            "emp_no": row.emp_no,
            "emp_name": row.emp_name,
            "dept_name": row.dept_name,
        }

    async def create_meeting(self, leader_emp_no: str, member_emp_no: str) -> TbMeeting:
        """
        미팅 레코드를 생성합니다. (status=REQUESTED)

        Args:
            leader_emp_no: 리더 사번
            member_emp_no: 팀원 사번

        Returns:
            TbMeeting: 생성된 미팅 ORM 객체
        """
        logger.info(
            "create_meeting called",
            extra={"leader_emp_no": leader_emp_no, "member_emp_no": member_emp_no},
        )

        try:
            meeting = TbMeeting(
                meeting_id=uuid.uuid4(),
                leader_emp_no=leader_emp_no,
                member_emp_no=member_emp_no,
                status="REQUESTED",
            )
            self.db.add(meeting)
            await self.db.commit()
            await self.db.refresh(meeting)

            logger.info(
                "create_meeting 완료",
                extra={"meeting_id": str(meeting.meeting_id)},
            )
            return meeting

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "create_meeting 실패",
                extra={"leader_emp_no": leader_emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 생성에 실패했습니다",
                details={"leader_emp_no": leader_emp_no},
            ) from exc

    async def find_meeting_by_id(self, meeting_id: str) -> TbMeeting:
        """
        미팅 ID로 미팅을 단건 조회합니다.

        Args:
            meeting_id: 미팅 UUID 문자열

        Returns:
            TbMeeting: 미팅 ORM 객체

        Raises:
            NotFoundException: 미팅이 존재하지 않을 때
        """
        logger.info("find_meeting_by_id called", extra={"meeting_id": meeting_id})

        try:
            meeting_uuid = uuid.UUID(meeting_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 미팅 ID입니다",
                details={"meeting_id": meeting_id},
            ) from exc

        stmt = select(TbMeeting).where(TbMeeting.meeting_id == meeting_uuid)
        result = await self.db.execute(stmt)
        meeting = result.scalar_one_or_none()

        if meeting is None:
            raise NotFoundException(
                message="미팅을 찾을 수 없습니다",
                details={"meeting_id": meeting_id},
            )

        return meeting

    async def delete_meeting(self, meeting: TbMeeting) -> None:
        """
        미팅 레코드를 삭제합니다. (REQUESTED 상태 전용)

        Args:
            meeting: 삭제할 미팅 ORM 객체
        """
        logger.info(
            "delete_meeting called",
            extra={"meeting_id": str(meeting.meeting_id)},
        )

        try:
            await self.db.delete(meeting)
            await self.db.commit()
            logger.info(
                "delete_meeting 완료",
                extra={"meeting_id": str(meeting.meeting_id)},
            )

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "delete_meeting 실패",
                extra={"meeting_id": str(meeting.meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 삭제에 실패했습니다",
                details={"meeting_id": str(meeting.meeting_id)},
            ) from exc

    async def find_previous_completed_meetings(
        self,
        leader_emp_no: str,
        member_emp_no: str,
        limit: int = 2,
    ) -> list[TbMeeting]:
        """
        leader-member 간 이전 COMPLETED 미팅을 최신 순으로 조회합니다.

        이월 Action Item 및 사전 준비 데이터 로드에 사용합니다.

        Args:
            leader_emp_no: 리더 사번
            member_emp_no: 팀원 사번
            limit: 조회할 최대 건수 (기본 2건 — N-1, N-2)

        Returns:
            list[TbMeeting]: 최신 순 COMPLETED 미팅 목록
        """
        logger.info(
            "find_previous_completed_meetings called",
            extra={
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "limit": limit,
            },
        )

        stmt = (
            select(TbMeeting)
            .options(selectinload(TbMeeting.record))
            .where(
                and_(
                    TbMeeting.leader_emp_no == leader_emp_no,
                    TbMeeting.member_emp_no == member_emp_no,
                    TbMeeting.status == "COMPLETED",
                )
            )
            .order_by(desc(TbMeeting.completed_at))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_incomplete_action_items(
        self,
        meeting_ids: list[uuid.UUID],
    ) -> list[TbMeetingActionItem]:
        """
        지정된 미팅들의 미완료 Action Item을 조회합니다.

        Args:
            meeting_ids: 조회할 미팅 UUID 목록

        Returns:
            list[TbMeetingActionItem]: 미완료 Action Item 목록
        """
        if not meeting_ids:
            return []

        logger.info(
            "find_incomplete_action_items called",
            extra={"meeting_count": len(meeting_ids)},
        )

        stmt = select(TbMeetingActionItem).where(
            and_(
                TbMeetingActionItem.meeting_id.in_(meeting_ids),
                TbMeetingActionItem.is_completed.is_(False),
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_member_rnr_titles(self, member_emp_no: str) -> list[str]:
        """
        팀원의 R&R 제목 목록을 조회합니다. (LLM 프롬프트 구성용)

        현재 연도 기준, MEMBER 타입 R&R만 조회합니다.

        Args:
            member_emp_no: 팀원 사번

        Returns:
            list[str]: R&R 제목 목록
        """
        current_year = str(datetime.utcnow().year)

        logger.info(
            "find_member_rnr_titles called",
            extra={"member_emp_no": member_emp_no, "year": current_year},
        )

        stmt = (
            select(Rr.title)
            .where(
                and_(
                    Rr.emp_no == member_emp_no,
                    Rr.year == current_year,
                    Rr.rr_type == "MEMBER",
                )
            )
            .order_by(Rr.title)
        )
        result = await self.db.execute(stmt)
        return [row.title for row in result.all()]

    # =============================================
    # Task 5 — 미팅 실행 Repository 메서드
    # =============================================

    async def start_meeting(self, meeting: TbMeeting) -> TbMeeting:
        """
        미팅 상태를 IN_PROGRESS로 전환하고 started_at을 기록합니다.

        Args:
            meeting: 상태를 변경할 TbMeeting ORM 객체

        Returns:
            TbMeeting: 업데이트된 미팅 ORM 객체
        """
        logger.info("start_meeting called", extra={"meeting_id": str(meeting.meeting_id)})

        try:
            meeting.status = "IN_PROGRESS"
            meeting.started_at = datetime.utcnow()
            self.db.add(meeting)
            await self.db.commit()
            await self.db.refresh(meeting)

            logger.info("start_meeting 완료", extra={"meeting_id": str(meeting.meeting_id)})
            return meeting

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "start_meeting 실패",
                extra={"meeting_id": str(meeting.meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 시작 처리에 실패했습니다",
                details={"meeting_id": str(meeting.meeting_id)},
            ) from exc

    async def insert_agendas(
        self,
        meeting_id: uuid.UUID,
        agendas: list[dict[str, Any]],
    ) -> list[TbMeetingAgenda]:
        """
        아젠다 목록을 일괄 INSERT합니다.

        Args:
            meeting_id: 미팅 UUID
            agendas: [{"content": str, "source": str, "order": int}, ...] 형태의 아젠다 목록

        Returns:
            list[TbMeetingAgenda]: 생성된 아젠다 ORM 객체 목록
        """
        logger.info(
            "insert_agendas called",
            extra={"meeting_id": str(meeting_id), "count": len(agendas)},
        )

        try:
            agenda_objects = [
                TbMeetingAgenda(
                    agenda_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    content=item["content"],
                    source=item["source"],
                    order=item["order"],
                    is_completed=False,
                )
                for item in agendas
            ]
            self.db.add_all(agenda_objects)
            await self.db.commit()

            logger.info(
                "insert_agendas 완료",
                extra={"meeting_id": str(meeting_id), "inserted": len(agenda_objects)},
            )
            return agenda_objects

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "insert_agendas 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "아젠다 INSERT에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    async def copy_action_items_as_carried_over(
        self,
        meeting_id: uuid.UUID,
        source_items: list[TbMeetingActionItem],
    ) -> list[TbMeetingActionItem]:
        """
        이전 미팅의 미완료 Action Item을 현재 미팅으로 이월 복사 INSERT합니다.

        - is_carried_over = True
        - origin_meeting_id = 원본 meeting_id
        - assignee = 원본 값 그대로 복사
        - is_completed = False

        Args:
            meeting_id: 현재 미팅 UUID (이월 대상)
            source_items: 복사할 원본 Action Item 목록

        Returns:
            list[TbMeetingActionItem]: 이월 복사된 Action Item 목록
        """
        if not source_items:
            return []

        logger.info(
            "copy_action_items_as_carried_over called",
            extra={"meeting_id": str(meeting_id), "source_count": len(source_items)},
        )

        try:
            carried_items = [
                TbMeetingActionItem(
                    action_item_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    origin_meeting_id=item.meeting_id,
                    is_carried_over=True,
                    content=item.content,
                    assignee=item.assignee,
                    is_completed=False,
                )
                for item in source_items
            ]
            self.db.add_all(carried_items)
            await self.db.commit()

            logger.info(
                "copy_action_items_as_carried_over 완료",
                extra={"meeting_id": str(meeting_id), "copied": len(carried_items)},
            )
            return carried_items

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "copy_action_items_as_carried_over 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "Action Item 이월 복사에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    async def find_meeting_with_active_data(self, meeting_id: str) -> TbMeeting:
        """
        미팅 실행 화면에 필요한 데이터를 일괄 로드합니다.
        (아젠다, 액션아이템, 타임라인 eagerly loaded)

        Args:
            meeting_id: 미팅 UUID 문자열

        Returns:
            TbMeeting: 관계 데이터가 포함된 미팅 ORM 객체

        Raises:
            NotFoundException: 미팅이 존재하지 않을 때
        """
        logger.info("find_meeting_with_active_data called", extra={"meeting_id": meeting_id})

        try:
            meeting_uuid = uuid.UUID(meeting_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 미팅 ID입니다",
                details={"meeting_id": meeting_id},
            ) from exc

        stmt = (
            select(TbMeeting)
            .options(
                selectinload(TbMeeting.agendas),
                selectinload(TbMeeting.action_items),
                selectinload(TbMeeting.timelines),
            )
            .where(TbMeeting.meeting_id == meeting_uuid)
        )
        result = await self.db.execute(stmt)
        meeting = result.scalar_one_or_none()

        if meeting is None:
            raise NotFoundException(
                message="미팅을 찾을 수 없습니다",
                details={"meeting_id": meeting_id},
            )

        return meeting

    async def find_member_rnr_tree(self, member_emp_no: str) -> list[Rr]:
        """
        팀원의 R&R을 계층 구조로 조회합니다.

        현재 연도 기준 MEMBER 타입 R&R 전체를 조회하며,
        parent 관계를 eagerly load합니다.

        Args:
            member_emp_no: 팀원 사번

        Returns:
            list[Rr]: R&R ORM 객체 목록 (parent 포함)
        """
        current_year = str(datetime.utcnow().year)

        logger.info(
            "find_member_rnr_tree called",
            extra={"member_emp_no": member_emp_no, "year": current_year},
        )

        stmt = (
            select(Rr)
            .options(selectinload(Rr.parent))
            .where(
                and_(
                    Rr.emp_no == member_emp_no,
                    Rr.year == current_year,
                    Rr.rr_type == "MEMBER",
                )
            )
            .order_by(Rr.title)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_timeline(
        self,
        meeting_id: uuid.UUID,
        rr_id: Optional[uuid.UUID],
        start_time: int,
    ) -> TbMeetingTimeline:
        """
        타임라인 카드를 생성합니다.

        Args:
            meeting_id: 미팅 UUID
            rr_id: R&R UUID (None 가능)
            start_time: 녹음 시작 기준 상대 시간(초)

        Returns:
            TbMeetingTimeline: 생성된 타임라인 ORM 객체
        """
        logger.info(
            "create_timeline called",
            extra={"meeting_id": str(meeting_id), "rr_id": str(rr_id), "start_time": start_time},
        )

        try:
            timeline = TbMeetingTimeline(
                timeline_id=uuid.uuid4(),
                meeting_id=meeting_id,
                rr_id=rr_id,
                start_time=start_time,
                end_time=None,
                segment_summary=None,
            )
            self.db.add(timeline)
            await self.db.commit()
            await self.db.refresh(timeline)

            logger.info(
                "create_timeline 완료",
                extra={"timeline_id": str(timeline.timeline_id)},
            )
            return timeline

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "create_timeline 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "타임라인 생성에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    async def find_open_timeline(
        self, meeting_id: uuid.UUID
    ) -> Optional[TbMeetingTimeline]:
        """
        end_time IS NULL인 활성 타임라인 카드를 조회합니다.

        Args:
            meeting_id: 미팅 UUID

        Returns:
            TbMeetingTimeline | None: 활성 타임라인 (없으면 None)
        """
        logger.info("find_open_timeline called", extra={"meeting_id": str(meeting_id)})

        stmt = select(TbMeetingTimeline).where(
            and_(
                TbMeetingTimeline.meeting_id == meeting_id,
                TbMeetingTimeline.end_time.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_timeline_by_id(
        self,
        meeting_id: uuid.UUID,
        timeline_id: str,
    ) -> TbMeetingTimeline:
        """
        타임라인 ID로 단건 조회합니다.

        Args:
            meeting_id: 미팅 UUID (권한 체크용)
            timeline_id: 타임라인 UUID 문자열

        Returns:
            TbMeetingTimeline: 타임라인 ORM 객체

        Raises:
            NotFoundException: 타임라인이 없을 때
        """
        try:
            timeline_uuid = uuid.UUID(timeline_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 타임라인 ID입니다",
                details={"timeline_id": timeline_id},
            ) from exc

        stmt = select(TbMeetingTimeline).where(
            and_(
                TbMeetingTimeline.timeline_id == timeline_uuid,
                TbMeetingTimeline.meeting_id == meeting_id,
            )
        )
        result = await self.db.execute(stmt)
        timeline = result.scalar_one_or_none()

        if timeline is None:
            raise NotFoundException(
                message="타임라인을 찾을 수 없습니다",
                details={"timeline_id": timeline_id},
            )

        return timeline

    async def patch_timeline(
        self,
        timeline: TbMeetingTimeline,
        end_time: Optional[int] = None,
        segment_summary: Optional[str] = None,
    ) -> TbMeetingTimeline:
        """
        타임라인 카드를 업데이트합니다.

        end_time → 카드 마감 (미팅 실행 중)
        segment_summary → 구간 요약 수정 (히스토리 리포트에서 편집)

        Args:
            timeline: 업데이트할 TbMeetingTimeline ORM 객체
            end_time: 종료 시간 (optional)
            segment_summary: 구간 요약 (optional)

        Returns:
            TbMeetingTimeline: 업데이트된 타임라인 ORM 객체
        """
        logger.info(
            "patch_timeline called",
            extra={"timeline_id": str(timeline.timeline_id)},
        )

        try:
            if end_time is not None:
                timeline.end_time = end_time
            if segment_summary is not None:
                timeline.segment_summary = segment_summary
            self.db.add(timeline)
            await self.db.commit()
            await self.db.refresh(timeline)

            logger.info("patch_timeline 완료", extra={"timeline_id": str(timeline.timeline_id)})
            return timeline

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "patch_timeline 실패",
                extra={"timeline_id": str(timeline.timeline_id), "error": str(exc)},
            )
            raise RepositoryException(
                "타임라인 업데이트에 실패했습니다",
                details={"timeline_id": str(timeline.timeline_id)},
            ) from exc

    async def update_meeting_memo(
        self,
        meeting: TbMeeting,
        private_memo: str,
    ) -> TbMeeting:
        """
        미팅의 비공개 메모를 업데이트합니다.

        Args:
            meeting: 업데이트할 TbMeeting ORM 객체
            private_memo: 저장할 메모 내용

        Returns:
            TbMeeting: 업데이트된 미팅 ORM 객체
        """
        logger.info("update_meeting_memo called", extra={"meeting_id": str(meeting.meeting_id)})

        try:
            meeting.private_memo = private_memo
            self.db.add(meeting)
            await self.db.commit()
            await self.db.refresh(meeting)

            logger.info("update_meeting_memo 완료", extra={"meeting_id": str(meeting.meeting_id)})
            return meeting

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "update_meeting_memo 실패",
                extra={"meeting_id": str(meeting.meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "메모 업데이트에 실패했습니다",
                details={"meeting_id": str(meeting.meeting_id)},
            ) from exc

    async def find_agenda_by_id(
        self,
        meeting_id: uuid.UUID,
        agenda_id: str,
    ) -> TbMeetingAgenda:
        """
        아젠다 ID로 단건 조회합니다.

        Args:
            meeting_id: 미팅 UUID (권한 체크용)
            agenda_id: 아젠다 UUID 문자열

        Returns:
            TbMeetingAgenda: 아젠다 ORM 객체

        Raises:
            NotFoundException: 아젠다가 없을 때
        """
        try:
            agenda_uuid = uuid.UUID(agenda_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 아젠다 ID입니다",
                details={"agenda_id": agenda_id},
            ) from exc

        stmt = select(TbMeetingAgenda).where(
            and_(
                TbMeetingAgenda.agenda_id == agenda_uuid,
                TbMeetingAgenda.meeting_id == meeting_id,
            )
        )
        result = await self.db.execute(stmt)
        agenda = result.scalar_one_or_none()

        if agenda is None:
            raise NotFoundException(
                message="아젠다를 찾을 수 없습니다",
                details={"agenda_id": agenda_id},
            )

        return agenda

    async def toggle_agenda_complete(self, agenda: TbMeetingAgenda) -> TbMeetingAgenda:
        """
        아젠다의 완료 상태를 토글합니다.

        Args:
            agenda: 토글할 TbMeetingAgenda ORM 객체

        Returns:
            TbMeetingAgenda: 업데이트된 아젠다 ORM 객체
        """
        logger.info("toggle_agenda_complete called", extra={"agenda_id": str(agenda.agenda_id)})

        try:
            agenda.is_completed = not agenda.is_completed
            self.db.add(agenda)
            await self.db.commit()
            await self.db.refresh(agenda)

            logger.info(
                "toggle_agenda_complete 완료",
                extra={"agenda_id": str(agenda.agenda_id), "is_completed": agenda.is_completed},
            )
            return agenda

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "toggle_agenda_complete 실패",
                extra={"agenda_id": str(agenda.agenda_id), "error": str(exc)},
            )
            raise RepositoryException(
                "아젠다 완료 토글에 실패했습니다",
                details={"agenda_id": str(agenda.agenda_id)},
            ) from exc

    async def find_action_item_by_id(
        self,
        meeting_id: uuid.UUID,
        action_item_id: str,
    ) -> TbMeetingActionItem:
        """
        Action Item ID로 단건 조회합니다.

        Args:
            meeting_id: 미팅 UUID (권한 체크용)
            action_item_id: Action Item UUID 문자열

        Returns:
            TbMeetingActionItem: Action Item ORM 객체

        Raises:
            NotFoundException: Action Item이 없을 때
        """
        try:
            item_uuid = uuid.UUID(action_item_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 Action Item ID입니다",
                details={"action_item_id": action_item_id},
            ) from exc

        stmt = select(TbMeetingActionItem).where(
            and_(
                TbMeetingActionItem.action_item_id == item_uuid,
                TbMeetingActionItem.meeting_id == meeting_id,
            )
        )
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if item is None:
            raise NotFoundException(
                message="Action Item을 찾을 수 없습니다",
                details={"action_item_id": action_item_id},
            )

        return item

    async def toggle_action_item_complete(
        self, action_item: TbMeetingActionItem
    ) -> TbMeetingActionItem:
        """
        Action Item의 완료 상태를 토글합니다.
        이월 항목도 현재 미팅 row에서만 업데이트합니다 (원본 불변).

        Args:
            action_item: 토글할 TbMeetingActionItem ORM 객체

        Returns:
            TbMeetingActionItem: 업데이트된 Action Item ORM 객체
        """
        logger.info(
            "toggle_action_item_complete called",
            extra={"action_item_id": str(action_item.action_item_id)},
        )

        try:
            action_item.is_completed = not action_item.is_completed
            self.db.add(action_item)
            await self.db.commit()
            await self.db.refresh(action_item)

            logger.info(
                "toggle_action_item_complete 완료",
                extra={
                    "action_item_id": str(action_item.action_item_id),
                    "is_completed": action_item.is_completed,
                },
            )
            return action_item

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "toggle_action_item_complete 실패",
                extra={"action_item_id": str(action_item.action_item_id), "error": str(exc)},
            )
            raise RepositoryException(
                "Action Item 완료 토글에 실패했습니다",
                details={"action_item_id": str(action_item.action_item_id)},
            ) from exc

    async def find_agenda_max_order(self, meeting_id: uuid.UUID) -> int:
        """
        현재 미팅의 아젠다 최대 order 값을 조회합니다.

        Args:
            meeting_id: 미팅 UUID

        Returns:
            int: 최대 order 값 (아젠다 없으면 -1)
        """
        from sqlalchemy import func

        stmt = select(func.max(TbMeetingAgenda.order)).where(
            TbMeetingAgenda.meeting_id == meeting_id
        )
        result = await self.db.execute(stmt)
        max_order = result.scalar_one_or_none()
        return max_order if max_order is not None else -1

    async def create_agenda(
        self,
        meeting_id: uuid.UUID,
        content: str,
        order: int,
    ) -> TbMeetingAgenda:
        """
        리더 즉석 아젠다를 추가합니다. (source=LEADER_ADDED)

        Args:
            meeting_id: 미팅 UUID
            content: 아젠다 내용
            order: 정렬 순서

        Returns:
            TbMeetingAgenda: 생성된 아젠다 ORM 객체
        """
        logger.info("create_agenda called", extra={"meeting_id": str(meeting_id)})

        try:
            agenda = TbMeetingAgenda(
                agenda_id=uuid.uuid4(),
                meeting_id=meeting_id,
                content=content,
                source="LEADER_ADDED",
                order=order,
                is_completed=False,
            )
            self.db.add(agenda)
            await self.db.commit()
            await self.db.refresh(agenda)

            logger.info("create_agenda 완료", extra={"agenda_id": str(agenda.agenda_id)})
            return agenda

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "create_agenda 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "아젠다 추가에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    # =============================================
    # Task 6 — 미팅 종료 + GCS 업로드 Repository 메서드
    # =============================================

    async def close_open_timeline_with_duration(
        self,
        meeting_id: uuid.UUID,
        actual_duration_seconds: int,
    ) -> None:
        """
        end_time IS NULL인 활성 타임라인 카드를 actual_duration_seconds로 자동 마감합니다.

        미팅 종료 시 마지막 타임라인 카드가 열려있으면 실제 녹음 길이로 마감합니다.

        Args:
            meeting_id: 미팅 UUID
            actual_duration_seconds: 실제 녹음 길이(초)
        """
        logger.info(
            "close_open_timeline_with_duration called",
            extra={"meeting_id": str(meeting_id), "duration": actual_duration_seconds},
        )

        open_timeline = await self.find_open_timeline(meeting_id)
        if open_timeline is not None:
            await self.patch_timeline(timeline=open_timeline, end_time=actual_duration_seconds)
            logger.info(
                "close_open_timeline_with_duration 완료",
                extra={
                    "timeline_id": str(open_timeline.timeline_id),
                    "end_time": actual_duration_seconds,
                },
            )

    async def complete_meeting(
        self,
        meeting: TbMeeting,
        actual_duration_seconds: int,
        private_memo: Optional[str],
    ) -> TbMeeting:
        """
        미팅 상태를 PROCESSING으로 전환하고 완료 정보를 기록합니다.

        Args:
            meeting: 상태를 변경할 TbMeeting ORM 객체
            actual_duration_seconds: 실제 녹음 길이(초)
            private_memo: 비공개 메모 (None이면 기존 값 유지)

        Returns:
            TbMeeting: 업데이트된 미팅 ORM 객체
        """
        logger.info("complete_meeting called", extra={"meeting_id": str(meeting.meeting_id)})

        try:
            meeting.status = "PROCESSING"
            meeting.completed_at = datetime.utcnow()
            meeting.actual_duration_seconds = actual_duration_seconds
            if private_memo is not None:
                meeting.private_memo = private_memo

            self.db.add(meeting)
            await self.db.commit()
            await self.db.refresh(meeting)

            logger.info("complete_meeting 완료", extra={"meeting_id": str(meeting.meeting_id)})
            return meeting

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "complete_meeting 실패",
                extra={"meeting_id": str(meeting.meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 완료 처리에 실패했습니다",
                details={"meeting_id": str(meeting.meeting_id)},
            ) from exc

    async def create_meeting_record(
        self,
        meeting_id: uuid.UUID,
        audio_file_url: str,
    ) -> TbMeetingRecord:
        """
        TbMeetingRecord를 생성합니다. (GCS 오디오 경로 저장)

        Args:
            meeting_id: 미팅 UUID
            audio_file_url: GCS 오디오 파일 경로

        Returns:
            TbMeetingRecord: 생성된 레코드 ORM 객체
        """
        logger.info(
            "create_meeting_record called",
            extra={"meeting_id": str(meeting_id), "audio_file_url": audio_file_url},
        )

        try:
            record = TbMeetingRecord(
                record_id=uuid.uuid4(),
                meeting_id=meeting_id,
                audio_file_url=audio_file_url,
            )
            self.db.add(record)
            await self.db.commit()
            await self.db.refresh(record)

            logger.info(
                "create_meeting_record 완료",
                extra={"record_id": str(record.record_id)},
            )
            return record

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "create_meeting_record 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 레코드 생성에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    async def upsert_coaching_relation(
        self,
        leader_emp_no: str,
        member_emp_no: str,
        meeting_id: uuid.UUID,
        completed_at: datetime,
    ) -> None:
        """
        TbCoachingRelation을 UPSERT합니다.

        row가 없으면 INSERT, 있으면 UPDATE합니다.
        total_meeting_count는 INSERT 시 1, UPDATE 시 +1 증가합니다.

        Args:
            leader_emp_no: 리더 사번
            member_emp_no: 팀원 사번
            meeting_id: 완료된 미팅 UUID
            completed_at: 미팅 완료 일시 (UTC)
        """
        logger.info(
            "upsert_coaching_relation called",
            extra={
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "meeting_id": str(meeting_id),
            },
        )

        try:
            stmt = (
                pg_insert(TbCoachingRelation)
                .values(
                    relation_id=uuid.uuid4(),
                    leader_emp_no=leader_emp_no,
                    member_emp_no=member_emp_no,
                    last_meeting_id=meeting_id,
                    last_meeting_date=completed_at,
                    total_meeting_count=1,
                )
                .on_conflict_do_update(
                    constraint="uq_coaching_relation",
                    set_={
                        "last_meeting_id": meeting_id,
                        "last_meeting_date": completed_at,
                        "total_meeting_count": TbCoachingRelation.total_meeting_count + 1,
                        "up_date": datetime.utcnow(),
                    },
                )
            )
            await self.db.execute(stmt)
            await self.db.commit()

            logger.info(
                "upsert_coaching_relation 완료",
                extra={
                    "leader_emp_no": leader_emp_no,
                    "member_emp_no": member_emp_no,
                },
            )

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "upsert_coaching_relation 실패",
                extra={
                    "leader_emp_no": leader_emp_no,
                    "member_emp_no": member_emp_no,
                    "error": str(exc),
                },
            )
            raise RepositoryException(
                "코칭 관계 UPSERT에 실패했습니다",
                details={
                    "leader_emp_no": leader_emp_no,
                    "member_emp_no": member_emp_no,
                },
            ) from exc

    async def mark_meeting_failed(self, meeting_id: uuid.UUID) -> None:
        """
        미팅 status를 FAILED로 전환합니다.

        AI 파이프라인 실패 또는 gcs_path 누락 시 호출됩니다.

        Args:
            meeting_id: 실패 처리할 미팅 UUID
        """
        logger.info("mark_meeting_failed called", extra={"meeting_id": str(meeting_id)})

        try:
            stmt = (
                update(TbMeeting)
                .where(TbMeeting.meeting_id == meeting_id)
                .values(status="FAILED")
            )
            await self.db.execute(stmt)
            await self.db.commit()

            logger.info("mark_meeting_failed 완료", extra={"meeting_id": str(meeting_id)})

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "mark_meeting_failed 실패",
                extra={"meeting_id": str(meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 FAILED 처리에 실패했습니다",
                details={"meeting_id": str(meeting_id)},
            ) from exc

    async def find_stuck_processing_meetings(
        self, timeout_minutes: int = 30
    ) -> list[TbMeeting]:
        """
        지정된 시간 이상 PROCESSING 상태에 고착된 미팅을 조회합니다.

        스케줄러가 주기적으로 호출하여 고착 미팅을 FAILED로 전환하는 데 사용합니다.

        Args:
            timeout_minutes: PROCESSING 고착 기준 시간 (분, 기본 30분)

        Returns:
            list[TbMeeting]: 고착 미팅 목록
        """
        threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)

        stmt = select(TbMeeting).where(
            and_(
                TbMeeting.status == "PROCESSING",
                TbMeeting.completed_at < threshold,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # =============================================
    # Task 7 — 히스토리 및 리포트 Repository
    # =============================================

    async def find_meetings_by_member(
        self,
        leader_emp_no: str,
        member_emp_no: str,
    ) -> list[TbMeeting]:
        """
        특정 리더-팀원 쌍의 미팅 히스토리 목록을 최신순으로 조회합니다.

        Action Item 집계를 위해 action_items를 함께 로드합니다.
        REQUESTED 상태(사전 준비 중 취소된 미팅)는 제외합니다.

        Args:
            leader_emp_no: 리더 사원번호
            member_emp_no: 팀원 사원번호

        Returns:
            list[TbMeeting]: 미팅 목록 (최신순, REQUESTED 제외)
        """
        stmt = (
            select(TbMeeting)
            .where(
                and_(
                    TbMeeting.leader_emp_no == leader_emp_no,
                    TbMeeting.member_emp_no == member_emp_no,
                    TbMeeting.status != "REQUESTED",
                )
            )
            .options(selectinload(TbMeeting.action_items))
            .order_by(desc(TbMeeting.started_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_meeting_with_report_data(
        self,
        meeting_id: uuid.UUID,
    ) -> Optional[TbMeeting]:
        """
        미팅 리포트에 필요한 전체 데이터를 한 번에 조회합니다.

        record (ai_summary, audio_file_url), timelines, action_items 를 eager load합니다.

        Args:
            meeting_id: 미팅 UUID

        Returns:
            TbMeeting | None: 미팅 (없으면 None)
        """
        stmt = (
            select(TbMeeting)
            .where(TbMeeting.meeting_id == meeting_id)
            .options(
                selectinload(TbMeeting.record),
                selectinload(TbMeeting.timelines),
                selectinload(TbMeeting.action_items),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def find_rr_title_map(
        self,
        rr_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, str]:
        """
        rr_id 목록으로 R&R title 매핑을 조회합니다.

        타임라인 리포트에서 rr_id → rr_name(title) 변환에 사용합니다.

        Args:
            rr_ids: 조회할 R&R UUID 목록

        Returns:
            dict: { rr_id: title } 매핑
        """
        if not rr_ids:
            return {}

        stmt = select(Rr.rr_id, Rr.title).where(Rr.rr_id.in_(rr_ids))
        result = await self.db.execute(stmt)
        return {row.rr_id: row.title for row in result.all()}
