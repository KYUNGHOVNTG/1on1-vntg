"""
R&R 도메인 Service

책임:
    - 비즈니스 로직 흐름 제어 및 트랜잭션 관리
    - Repository 조율 (직접 DB 접근 금지)
    - RR_TYPE 자동 결정 (직책 코드 기반)

RR_TYPE 결정 규칙:
    P005           → MEMBER (팀원)
    P001 ~ P004    → LEADER (조직장)
    그 외 직책     → MEMBER (fallback)
"""

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.domain.rnr.repositories import (
    LEADER_POSITION_CODES,
    MEMBER_POSITION_CODE,
    RrRepository,
)
from server.app.domain.rnr.schemas import (
    MyDepartmentsResponse,
    ParentRrOptionsResponse,
    RrCreateRequest,
    RrListResponse,
    RrResponse,
)

logger = get_logger(__name__)


class RrService:
    """
    R&R 서비스

    비즈니스 로직 흐름을 제어합니다.
    DB 접근은 RrRepository를 통해서만 수행합니다.
    Service에서 직접 DB 쿼리 작성 금지.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repo = RrRepository(db)

    # ------------------------------------------------------------------
    # 조회
    # ------------------------------------------------------------------

    async def get_my_rr_list(self, user_id: str, year: str) -> RrListResponse:
        """
        나의 R&R 목록을 조회합니다.

        Args:
            user_id: 로그인 사용자 ID (JWT에서 추출)
            year:    기준 연도 (YYYY)

        Returns:
            RrListResponse: { items: list[RrResponse], total: int }
        """
        logger.info(
            "get_my_rr_list called",
            extra={"user_id": user_id, "year": year},
        )
        emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        return await self.repo.find_my_rr_list(emp_no, year)

    async def get_my_departments(self, user_id: str) -> MyDepartmentsResponse:
        """
        나의 부서 목록을 조회합니다 (본소속 + 겸직).

        Args:
            user_id: 로그인 사용자 ID (JWT에서 추출)

        Returns:
            MyDepartmentsResponse: { items: list[MyDepartmentItem], total: int }
        """
        logger.info("get_my_departments called", extra={"user_id": user_id})
        emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        return await self.repo.find_my_departments(emp_no)

    async def get_parent_rr_options(
        self, user_id: str, dept_code: str, year: str
    ) -> ParentRrOptionsResponse:
        """
        상위 R&R 선택 목록을 조회합니다.

        직책 코드에 따라 조회 범위가 달라집니다:
        - P005 (팀원)     : 동일 부서(dept_code)에서 LEADER R&R 조회
        - P001~P004 (조직장): 상위 부서에서 LEADER R&R 조회

        Args:
            user_id:   로그인 사용자 ID (JWT에서 추출)
            dept_code: 선택된 부서 코드
            year:      기준 연도 (YYYY)

        Returns:
            ParentRrOptionsResponse: { items: list[ParentRrOption], total: int }
        """
        logger.info(
            "get_parent_rr_options called",
            extra={"user_id": user_id, "dept_code": dept_code, "year": year},
        )
        emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        position_code = await self.repo.find_employee_position(emp_no)
        return await self.repo.find_parent_rr_options(dept_code, year, position_code)

    # ------------------------------------------------------------------
    # 등록
    # ------------------------------------------------------------------

    async def create_rr(self, user_id: str, request: RrCreateRequest) -> RrResponse:
        """
        R&R을 등록합니다.

        직책 코드를 기반으로 RR_TYPE을 자동 결정합니다:
        - P005 (팀원)     → MEMBER
        - P001~P004 (조직장) → LEADER
        - 그 외           → MEMBER (fallback)

        처리 순서:
            1. user_id → emp_no 조회
            2. emp_no → position_code 조회
            3. position_code → rr_type 자동 결정
            4. R&R 등록 (flush)
            5. 기간 등록 (flush)
            6. 트랜잭션 커밋
            7. 등록된 R&R 반환 (periods, parent 포함)

        Args:
            user_id: 로그인 사용자 ID (JWT에서 추출)
            request: R&R 등록 요청 데이터

        Returns:
            RrResponse: 등록된 R&R 응답
        """
        logger.info(
            "create_rr called",
            extra={"user_id": user_id, "year": request.year, "title": request.title},
        )

        # 1. user_id → emp_no
        emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. emp_no → position_code
        position_code = await self.repo.find_employee_position(emp_no)

        # 3. RR_TYPE 자동 결정
        if position_code == MEMBER_POSITION_CODE:
            rr_type = "MEMBER"
        elif position_code in LEADER_POSITION_CODES:
            rr_type = "LEADER"
        else:
            # 그 외 직책은 MEMBER로 처리
            rr_type = "MEMBER"
            logger.warning(
                "알 수 없는 직책 코드 - MEMBER로 처리",
                extra={"position_code": position_code, "emp_no": emp_no},
            )

        # 4. R&R 등록 (flush: rr_id 확정)
        new_rr = await self.repo.create_rr(request, emp_no, rr_type)

        # 5. 기간 등록 (flush)
        await self.repo.create_rr_periods(new_rr.rr_id, request.periods)

        # 6. 트랜잭션 커밋
        await self.db.commit()

        # 7. 등록된 R&R 조회 후 반환 (periods, parent 포함)
        return await self.repo.find_rr_by_id(new_rr.rr_id)


__all__ = ["RrService"]
