"""
HR 도메인 - 직원(인사정보) 모델

HR_MGNT 테이블: 직원의 주소속 인사정보를 관리합니다.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, CHAR, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class HRMgnt(Base):
    """
    인사정보 테이블 (hr_mgnt)

    직원의 주소속 인사정보를 관리합니다.
    CM_USER와 1:1 관계, HR_MGNT_CONCUR와 1:N 관계를 가집니다.
    """

    __tablename__ = "hr_mgnt"

    # Primary Key
    emp_no: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="사번"
    )

    # Foreign Keys
    user_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("cm_user.user_id"),
        nullable=False,
        unique=True,
        comment="사용자 ID"
    )

    # 기본 정보
    name_kor: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="성명(한글)"
    )

    dept_code: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("cm_department.dept_code"),
        nullable=False,
        comment="부서 코드 (주소속)"
    )

    position_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="직책 코드"
    )

    on_work_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="재직 여부 (Y: 재직, N: 퇴직)"
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
    user = relationship(
        "User",
        back_populates="employee",
        foreign_keys=[user_id]
    )

    department = relationship(
        "CMDepartment",
        back_populates="employees",
        foreign_keys=[dept_code]
    )

    concurrent_positions: Mapped[List["HRMgntConcur"]] = relationship(
        "HRMgntConcur",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<HRMgnt(emp_no='{self.emp_no}', name_kor='{self.name_kor}', dept_code='{self.dept_code}')>"
