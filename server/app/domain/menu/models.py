"""
Menu 도메인 ORM 모델

메뉴 정의 및 권한 관리 테이블을 담당합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, CHAR, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class Menu(Base):
    """
    메뉴 정의 테이블 (cm_menu)

    시스템에서 사용되는 메뉴를 정의하는 테이블입니다.
    """

    __tablename__ = "cm_menu"

    # Primary Key
    menu_code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        comment="메뉴 코드 (CD201)"
    )

    # 기본 정보
    menu_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="메뉴명"
    )

    sort_seq: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="정렬순서"
    )

    use_yn: Mapped[str] = mapped_column(
        CHAR(1),
        nullable=False,
        default='Y',
        comment="사용여부"
    )

    rmk: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="비고"
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
        default=datetime.now,
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
        return f"<Menu(menu_code='{self.menu_code}', menu_name='{self.menu_name}')>"


class PositionMenu(Base):
    """
    직책별 메뉴 권한 테이블 (cm_position_menu)

    직책별로 접근 가능한 메뉴를 정의하는 테이블입니다.
    """

    __tablename__ = "cm_position_menu"

    # Composite Primary Key
    position_code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        comment="직책 코드 (CD101)"
    )

    menu_code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        comment="메뉴 코드 (CD201)"
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
        default=datetime.now,
        comment="등록일시"
    )

    def __repr__(self) -> str:
        return f"<PositionMenu(position_code='{self.position_code}', menu_code='{self.menu_code}')>"


class UserMenu(Base):
    """
    개인별 예외 메뉴 권한 테이블 (cm_user_menu)

    개별 사용자에게 특별히 부여된 메뉴 권한을 정의하는 테이블입니다.
    직책별 권한과 별도로 개인에게 추가 권한을 부여할 때 사용됩니다.
    """

    __tablename__ = "cm_user_menu"

    # Composite Primary Key
    user_id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        comment="사용자 ID"
    )

    menu_code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        comment="메뉴 코드 (CD201)"
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
        default=datetime.now,
        comment="등록일시"
    )

    def __repr__(self) -> str:
        return f"<UserMenu(user_id='{self.user_id}', menu_code='{self.menu_code}')>"
