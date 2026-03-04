"""
Coaching 도메인 Repository

책임:
    - DB에서 Coaching 관련 데이터 조회
    - Service 레이어에서 직접 DB 접근 금지 → 이 클래스로 위임

메서드 목록 (Task 3):
    - find_emp_no_by_user_id   : user_id → emp_no 조회
    - find_leader_info         : 리더의 인사정보 조회
    - find_team_members_with_coaching : 팀원 목록 + 코칭 통계 LEFT JOIN 조회
"""

from typing import Any, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.domain.coaching.models import TbCoachingRelation
from server.app.domain.hr.models.department import CMDepartment
from server.app.domain.hr.models.employee import HRMgnt
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
