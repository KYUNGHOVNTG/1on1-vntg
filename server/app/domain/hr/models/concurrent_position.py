"""
HR 도메인 - 겸직 정보 모델

HR_MGNT_CONCUR 테이블: 직원의 겸직 정보를 관리합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, CHAR, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class HRMgntConcur(Base):
    """
    겸직 정보 테이블 (hr_mgnt_concur)

    직원의 겸직 정보를 관리합니다.
    한 직원이 여러 부서에서 근무할 수 있으며, IS_MAIN='Y'인 레코드가 주소속입니다.
    """

    __tablename__ = "hr_mgnt_concur"

    # Composite Primary Key
    emp_no: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("hr_mgnt.emp_no"),
        primary_key=True,
        comment="사번"
    )

    dept_code: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("cm_department.dept_code"),
        primary_key=True,
        comment="부서 코드"
    )

    # 기본 정보
    is_main: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='N',
        comment="본직 여부 (Y: 주소속, N: 겸직)"
    )

    position_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="직책 코드"
    )

    # 이력 관리
    in_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="등록자"
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="등록일시"
    )

    up_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="수정자"
    )

    up_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="수정일시"
    )

    # Relationships
    employee = relationship(
        "HRMgnt",
        back_populates="concurrent_positions"
    )

    department = relationship(
        "CMDepartment",
        back_populates="concurrent_employees",
        foreign_keys=[dept_code]
    )

    def __repr__(self) -> str:
        return f"<HRMgntConcur(emp_no='{self.emp_no}', dept_code='{self.dept_code}', is_main='{self.is_main}')>"
