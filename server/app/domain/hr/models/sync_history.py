"""
HR 도메인 - 동기화 이력 모델

HR_SYNC_HISTORY 테이블: 외부 시스템과의 데이터 동기화 이력을 관리합니다.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class HRSyncHistory(Base):
    """
    동기화 이력 테이블 (hr_sync_history)

    외부 오라클 시스템과의 데이터 동기화 이력을 기록합니다.
    """

    __tablename__ = "hr_sync_history"

    # Primary Key
    sync_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="동기화 이력 ID"
    )

    # 동기화 정보
    sync_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="동기화 타입 (employees: 직원, departments: 부서, org_tree: 조직도)"
    )

    sync_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="동기화 상태 (success: 성공, failure: 실패, partial: 부분 성공)"
    )

    # 동기화 결과
    total_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="전체 건수"
    )

    success_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="성공 건수"
    )

    failure_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="실패 건수"
    )

    # 에러 로그
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="에러 메시지"
    )

    # 이력 관리
    sync_start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        comment="동기화 시작 시간"
    )

    sync_end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="동기화 종료 시간"
    )

    in_user: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="실행자"
    )

    in_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="등록일시"
    )

    def __repr__(self) -> str:
        return f"<HRSyncHistory(sync_id={self.sync_id}, sync_type='{self.sync_type}', sync_status='{self.sync_status}')>"
