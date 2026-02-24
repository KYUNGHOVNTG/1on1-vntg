"""
R&R 도메인 Repository

책임:
    - DB에서 R&R 관련 데이터 조회/저장
    - Service 레이어에서 직접 DB 접근 금지 → 이 클래스로 위임

메서드 목록:
    - find_my_rr_list        : 내 R&R 목록 + 기간 + 상위 R&R명 조회
    - find_my_departments    : 본소속 + 겸직 부서 목록 조회
    - find_parent_rr_options : 상위 R&R 선택 목록 조회 (직책 기반)
    - find_parent_rr_by_dept : 상위 R&R 목록 조회 (dept_code 기준, 조직장 R&R)
    - find_employee_position : 직원 직책 코드 조회
    - create_rr              : R&R 등록 (tb_rr INSERT)
    - create_rr_periods      : 기간 등록 (tb_rr_period INSERT)
"""

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.app.core.logging import get_logger
from server.app.domain.hr.models.concurrent_position import HRMgntConcur
from server.app.domain.hr.models.department import CMDepartment
from server.app.domain.hr.models.employee import HRMgnt
from server.app.domain.rnr.models import Rr, RrLevel, RrPeriod
from server.app.domain.rnr.schemas import (
    MyDepartmentItem,
    MyDepartmentsResponse,
    ParentRrOption,
    ParentRrOptionsResponse,
    PeriodInput,
    RrCreateRequest,
    RrListResponse,
    RrPeriodSchema,
    RrResponse,
)
from server.app.shared.exceptions import NotFoundException, RepositoryException

logger = get_logger(__name__)

# 조직장 직책 코드 목록 (P001~P004)
LEADER_POSITION_CODES: list[str] = ["P001", "P002", "P003", "P004"]
# 팀원 직책 코드
MEMBER_POSITION_CODE: str = "P005"


class RrRepository:
    """
    R&R Repository

    데이터베이스 접근을 담당합니다.
    Service 레이어는 이 클래스를 통해서만 DB에 접근합니다.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    # ------------------------------------------------------------------
    # 조회 메서드
    # ------------------------------------------------------------------

    async def find_my_rr_list(self, emp_no: str, year: str) -> RrListResponse:
        """
        나의 R&R 목록을 조회합니다.

        - 기간(periods)을 함께 로드 (selectinload)
        - 상위 R&R 명(parent_title)은 parent 관계에서 가져옴

        Args:
            emp_no: 사번
            year:   기준 연도 (YYYY)

        Returns:
            RrListResponse: { items: list[RrResponse], total: int }
        """
        logger.info("find_my_rr_list called", extra={"emp_no": emp_no, "year": year})

        try:
            stmt = (
                select(Rr)
                .where(Rr.emp_no == emp_no, Rr.year == year)
                .options(
                    selectinload(Rr.periods),
                    selectinload(Rr.parent),
                )
                .order_by(Rr.in_date.asc())
            )

            result = await self.db.execute(stmt)
            rr_list = result.scalars().all()

            items = [self._to_rr_response(rr) for rr in rr_list]
            return RrListResponse(items=items, total=len(items))

        except Exception as exc:
            logger.error(
                "find_my_rr_list 실패",
                extra={"emp_no": emp_no, "year": year, "error": str(exc)},
            )
            raise RepositoryException(
                "R&R 목록 조회에 실패했습니다",
                details={"emp_no": emp_no, "year": year},
            ) from exc

    async def find_my_departments(self, emp_no: str) -> MyDepartmentsResponse:
        """
        나의 부서 목록을 조회합니다 (본소속 + 겸직).

        - hr_mgnt에서 주소속 부서 조회
        - hr_mgnt_concur에서 겸직 부서 조회 (is_main='N')
        - cm_department에서 부서명 JOIN

        Args:
            emp_no: 사번

        Returns:
            MyDepartmentsResponse: { items: list[MyDepartmentItem], total: int }

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_my_departments called", extra={"emp_no": emp_no})

        try:
            # 주소속 조회 (hr_mgnt → cm_department JOIN)
            main_stmt = (
                select(HRMgnt.dept_code, CMDepartment.dept_name)
                .join(CMDepartment, HRMgnt.dept_code == CMDepartment.dept_code)
                .where(HRMgnt.emp_no == emp_no)
            )
            main_result = await self.db.execute(main_stmt)
            main_row = main_result.first()

            if main_row is None:
                raise NotFoundException(
                    message="직원 정보를 찾을 수 없습니다",
                    details={"emp_no": emp_no},
                )

            items: list[MyDepartmentItem] = [
                MyDepartmentItem(
                    dept_code=main_row.dept_code,
                    dept_name=main_row.dept_name,
                    is_main=True,
                )
            ]

            # 겸직 조회 (hr_mgnt_concur → cm_department JOIN, is_main='N')
            concur_stmt = (
                select(HRMgntConcur.dept_code, CMDepartment.dept_name)
                .join(CMDepartment, HRMgntConcur.dept_code == CMDepartment.dept_code)
                .where(
                    HRMgntConcur.emp_no == emp_no,
                    HRMgntConcur.is_main == "N",
                )
            )
            concur_result = await self.db.execute(concur_stmt)
            for row in concur_result.all():
                items.append(
                    MyDepartmentItem(
                        dept_code=row.dept_code,
                        dept_name=row.dept_name,
                        is_main=False,
                    )
                )

            return MyDepartmentsResponse(items=items, total=len(items))

        except NotFoundException:
            raise
        except Exception as exc:
            logger.error(
                "find_my_departments 실패",
                extra={"emp_no": emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "부서 목록 조회에 실패했습니다",
                details={"emp_no": emp_no},
            ) from exc

    async def find_parent_rr_options(
        self, dept_code: str, year: str, position_code: str
    ) -> ParentRrOptionsResponse:
        """
        상위 R&R 선택 목록을 조회합니다.

        직책 코드에 따라 조회 범위가 달라집니다:
        - P005 (팀원) : 동일 부서(dept_code)에서 조직장(LEADER) R&R 조회
        - P001~P004 (조직장): 상위 부서에서 LEADER R&R 조회
                               (cm_department.upper_dept_code 활용)

        Args:
            dept_code:      현재 선택 부서 코드
            year:           기준 연도 (YYYY)
            position_code:  직책 코드

        Returns:
            ParentRrOptionsResponse: { items: list[ParentRrOption], total: int }
        """
        logger.info(
            "find_parent_rr_options called",
            extra={"dept_code": dept_code, "year": year, "position_code": position_code},
        )

        try:
            if position_code == MEMBER_POSITION_CODE:
                # 팀원: 동일 부서의 LEADER R&R 조회
                target_dept_code: str | None = dept_code
            else:
                # 조직장: 상위 부서 R&R 조회
                target_dept_code = await self._find_upper_dept_code(dept_code)

            if target_dept_code is None:
                # 상위 부서가 없으면 빈 목록 반환
                return ParentRrOptionsResponse(items=[], total=0)

            # LEADER R&R 조회 + 등록자 이름 JOIN
            stmt = (
                select(
                    Rr.rr_id,
                    Rr.title,
                    Rr.emp_no,
                    HRMgnt.name_kor.label("emp_name"),
                )
                .join(HRMgnt, Rr.emp_no == HRMgnt.emp_no)
                .where(
                    Rr.dept_code == target_dept_code,
                    Rr.year == year,
                    Rr.rr_type == "LEADER",
                )
                .order_by(Rr.in_date.asc())
            )

            result = await self.db.execute(stmt)
            rows = result.all()

            items = [
                ParentRrOption(
                    rr_id=row.rr_id,
                    title=row.title,
                    emp_no=row.emp_no,
                    emp_name=row.emp_name,
                )
                for row in rows
            ]
            return ParentRrOptionsResponse(items=items, total=len(items))

        except Exception as exc:
            logger.error(
                "find_parent_rr_options 실패",
                extra={"dept_code": dept_code, "year": year, "error": str(exc)},
            )
            raise RepositoryException(
                "상위 R&R 목록 조회에 실패했습니다",
                details={"dept_code": dept_code, "year": year},
            ) from exc

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

    async def find_rr_by_id(self, rr_id: uuid.UUID) -> RrResponse:
        """
        R&R ID로 단건 R&R을 조회합니다 (periods, parent 포함).

        Args:
            rr_id: R&R UUID

        Returns:
            RrResponse: 조회된 R&R 응답

        Raises:
            NotFoundException: 해당 R&R이 없을 때
        """
        logger.info("find_rr_by_id called", extra={"rr_id": str(rr_id)})

        stmt = (
            select(Rr)
            .where(Rr.rr_id == rr_id)
            .options(
                selectinload(Rr.periods),
                selectinload(Rr.parent),
            )
        )
        result = await self.db.execute(stmt)
        rr = result.scalar_one_or_none()

        if rr is None:
            raise NotFoundException(
                message="R&R을 찾을 수 없습니다",
                details={"rr_id": str(rr_id)},
            )

        return self._to_rr_response(rr)

    async def find_employee_position(self, emp_no: str) -> str:
        """
        직원의 직책 코드를 조회합니다.

        Args:
            emp_no: 사번

        Returns:
            str: 직책 코드 (예: P001, P005)

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_employee_position called", extra={"emp_no": emp_no})

        stmt = select(HRMgnt.position_code).where(HRMgnt.emp_no == emp_no)
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            raise NotFoundException(
                message="직원 정보를 찾을 수 없습니다",
                details={"emp_no": emp_no},
            )

        return row.position_code

    # ------------------------------------------------------------------
    # 생성 메서드
    # ------------------------------------------------------------------

    async def create_rr(self, data: RrCreateRequest, emp_no: str, rr_type: str) -> Rr:
        """
        R&R을 등록합니다 (tb_rr INSERT).

        rr_type은 Service 레이어에서 직책 코드를 기반으로 결정하여 전달합니다.
        저장 시 in_date는 UTC 기준으로 처리합니다.

        Args:
            data:     등록 요청 데이터 (RrCreateRequest)
            emp_no:   현재 로그인 사용자 사번
            rr_type:  R&R 유형 (COMPANY | LEADER | MEMBER) — Service에서 결정

        Returns:
            Rr: 생성된 R&R ORM 객체

        Raises:
            RepositoryException: DB 저장 실패
        """
        logger.info(
            "create_rr called",
            extra={"emp_no": emp_no, "year": data.year, "rr_type": rr_type},
        )

        try:
            # level_id는 year와 rr_type을 기반으로 결정
            # 팀(LV{year}_4) 또는 상위 레벨은 Service에서 결정하여 전달할 수 있으나,
            # 이번 구현에서는 rr_type 기반으로 기본 레벨을 적용
            level_id = await self._resolve_level_id(data.year, rr_type)

            new_rr = Rr(
                rr_id=uuid.uuid4(),
                year=data.year,
                level_id=level_id,
                emp_no=emp_no,
                dept_code=data.dept_code,
                rr_type=rr_type,
                parent_rr_id=data.parent_rr_id,
                title=data.title,
                content=data.content,
                status="R",          # 저장 시 '작성중' 상태
                in_user=emp_no,
                in_date=datetime.utcnow(),
            )
            self.db.add(new_rr)
            await self.db.flush()    # rr_id 확정 (기간 INSERT 전 필요)
            return new_rr

        except Exception as exc:
            logger.error(
                "create_rr 실패",
                extra={"emp_no": emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "R&R 등록에 실패했습니다",
                details={"emp_no": emp_no, "year": data.year},
            ) from exc

    async def create_rr_periods(
        self, rr_id: uuid.UUID, periods: list[PeriodInput]
    ) -> list[RrPeriod]:
        """
        R&R 수행 기간을 등록합니다 (tb_rr_period INSERT).

        Args:
            rr_id:   R&R ID
            periods: 기간 목록 (PeriodInput 리스트)

        Returns:
            list[RrPeriod]: 생성된 기간 ORM 객체 목록

        Raises:
            RepositoryException: DB 저장 실패
        """
        logger.info(
            "create_rr_periods called",
            extra={"rr_id": str(rr_id), "period_count": len(periods)},
        )

        try:
            created: list[RrPeriod] = []
            for idx, period in enumerate(periods, start=1):
                rr_period = RrPeriod(
                    rr_id=rr_id,
                    seq=idx,
                    start_date=period.start_date,
                    end_date=period.end_date,
                )
                self.db.add(rr_period)
                created.append(rr_period)

            await self.db.flush()
            return created

        except Exception as exc:
            logger.error(
                "create_rr_periods 실패",
                extra={"rr_id": str(rr_id), "error": str(exc)},
            )
            raise RepositoryException(
                "R&R 기간 등록에 실패했습니다",
                details={"rr_id": str(rr_id)},
            ) from exc

    # ------------------------------------------------------------------
    # 내부 헬퍼
    # ------------------------------------------------------------------

    def _to_rr_response(self, rr: Rr) -> RrResponse:
        """
        Rr ORM 객체를 RrResponse 스키마로 변환합니다.

        Args:
            rr: Rr ORM 객체 (periods, parent 로드된 상태)

        Returns:
            RrResponse
        """
        periods = [
            RrPeriodSchema(
                seq=p.seq,
                start_date=p.start_date,
                end_date=p.end_date,
            )
            for p in (rr.periods or [])
        ]

        parent_title: str | None = None
        if rr.parent is not None:
            parent_title = rr.parent.title

        return RrResponse(
            rr_id=rr.rr_id,
            year=rr.year,
            level_id=rr.level_id,
            emp_no=rr.emp_no,
            dept_code=rr.dept_code,
            rr_type=rr.rr_type,
            parent_rr_id=rr.parent_rr_id,
            parent_title=parent_title,
            title=rr.title,
            content=rr.content,
            status=rr.status,
            in_date=rr.in_date,
            periods=periods,
        )

    async def _find_upper_dept_code(self, dept_code: str) -> str | None:
        """
        상위 부서 코드를 조회합니다 (cm_department.upper_dept_code).

        Args:
            dept_code: 현재 부서 코드

        Returns:
            Optional[str]: 상위 부서 코드 (최상위인 경우 None)
        """
        stmt = select(CMDepartment.upper_dept_code).where(
            CMDepartment.dept_code == dept_code
        )
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            return None
        return row.upper_dept_code

    async def _resolve_level_id(self, year: str, rr_type: str) -> str:
        """
        rr_type과 year를 기반으로 level_id를 결정합니다.

        - COMPANY → LV{year}_0 (전사)
        - LEADER  → LV{year}_4 (팀)
        - MEMBER  → LV{year}_4 (팀)

        해당 레벨이 tb_rr_level에 없으면 NotFoundException을 발생시킵니다.

        Args:
            year:    기준 연도 (YYYY)
            rr_type: R&R 유형 (COMPANY | LEADER | MEMBER)

        Returns:
            str: level_id (예: LV2026_4)

        Raises:
            NotFoundException: 해당 레벨이 없을 때
        """
        step_map: dict[str, int] = {
            "COMPANY": 0,
            "LEADER": 4,
            "MEMBER": 4,
        }
        level_step = step_map.get(rr_type, 4)
        level_id = f"LV{year}_{level_step}"

        stmt = select(RrLevel.level_id).where(RrLevel.level_id == level_id)
        result = await self.db.execute(stmt)
        if result.first() is None:
            raise NotFoundException(
                message="R&R 레벨 정보를 찾을 수 없습니다",
                details={"level_id": level_id},
            )

        return level_id


__all__ = ["RrRepository", "LEADER_POSITION_CODES", "MEMBER_POSITION_CODE"]
