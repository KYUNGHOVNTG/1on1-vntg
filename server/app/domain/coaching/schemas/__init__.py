"""
Coaching 도메인 Pydantic 스키마

Request/Response DTO 정의
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# =============================================
# 공통 스키마
# =============================================


class MemberInfo(BaseModel):
    emp_no: str
    emp_name: str
    dept_name: str


# =============================================
# Task 3 — 대시보드 스키마
# =============================================


class DashboardSummary(BaseModel):
    """대시보드 상단 집계 카드"""

    requested_count: int  # 미실시 (last_meeting_date IS NULL)
    overdue_2month: int  # 2개월 초과 지연
    due_1month: int  # 1개월 도래
    normal_count: int  # 정상


class DashboardMemberItem(BaseModel):
    """대시보드 팀원 목록 아이템"""

    emp_no: str
    emp_name: str
    dept_name: str
    last_meeting_date: Optional[datetime]
    total_meeting_count: int
    meeting_status: str  # 'NOT_STARTED' | 'OVERDUE_2M' | 'DUE_1M' | 'NORMAL'


class DashboardResponse(BaseModel):
    """GET /coaching/dashboard 응답"""

    summary: DashboardSummary
    items: list[DashboardMemberItem]
    total: int
