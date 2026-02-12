"""
HR 도메인 - 부서 정보 모델

CM_DEPARTMENT: 부서 마스터 정보를 관리합니다.
CM_DEPARTMENT_TREE: 조직도 뷰 데이터를 관리합니다.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, CHAR, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.app.core.database import Base


class CMDepartment(Base):
    """
    부서 정보 테이블 (cm_department)

    부서 마스터 정보를 관리합니다.
    계층형 구조를 위해 UPPER_DEPT_CODE로 자기참조 관계를 가집니다.
    """

    __tablename__ = "cm_department"

    # Primary Key
    dept_code: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="부서 코드"
    )

    # 기본 정보
    dept_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="부서명"
    )

    upper_dept_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        ForeignKey("cm_department.dept_code"),
        nullable=True,
        comment="상위 부서 코드"
    )

    dept_head_emp_no: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="부서장 사번"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="사용 여부"
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
    # 상위 부서 (자기참조)
    parent_department = relationship(
        "CMDepartment",
        remote_side="CMDepartment.dept_code",
        backref="sub_departments",
        foreign_keys=[upper_dept_code]
    )

    # 소속 직원 (주소속)
    employees: Mapped[List["HRMgnt"]] = relationship(
        "HRMgnt",
        back_populates="department",
        foreign_keys="HRMgnt.dept_code"
    )

    # 겸직 직원
    concurrent_employees: Mapped[List["HRMgntConcur"]] = relationship(
        "HRMgntConcur",
        back_populates="department",
        foreign_keys="HRMgntConcur.dept_code"
    )

    def __repr__(self) -> str:
        return f"<CMDepartment(dept_code='{self.dept_code}', dept_name='{self.dept_name}')>"


class CMDepartmentTree(Base):
    """
    조직도 뷰 테이블 (cm_department_tree)

    연도별 조직도 스냅샷 데이터를 관리합니다.
    계층 구조를 DISP_LVL로 표현하여 조직도 UI에서 활용합니다.
    """

    __tablename__ = "cm_department_tree"

    # Composite Primary Key
    std_year: Mapped[str] = mapped_column(
        String(4),
        primary_key=True,
        comment="기준 연도 (YYYY)"
    )

    dept_code: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="부서 코드"
    )

    # 기본 정보
    upper_dept_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="상위 부서 코드"
    )

    dept_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="부서명"
    )

    disp_lvl: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="표시 레벨 (1: 최상위, 2: 2depth, 3: 3depth)"
    )

    dept_head_emp_no: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="부서장 사번"
    )

    name_kor: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="부서장 성명"
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

    def __repr__(self) -> str:
        return f"<CMDepartmentTree(std_year='{self.std_year}', dept_code='{self.dept_code}', disp_lvl={self.disp_lvl})>"
