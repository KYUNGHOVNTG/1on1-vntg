"""
R&R 도메인 Pydantic 스키마

요청/응답 DTO 정의.
- RrLevelResponse       : R&R 레벨 응답
- RrPeriodSchema        : 업무 기간 입력/응답
- RrResponse            : 단일 R&R 응답 (상위 R&R 명 + 기간 목록 포함)
- RrListResponse        : R&R 목록 응답 { items, total }
- MyDepartmentItem      : 소속 부서 아이템 (겸직 포함)
- MyDepartmentsResponse : 내 부서 목록 응답 { items, total }
- ParentRrOption        : 상위 R&R 드롭다운 항목
- ParentRrOptionsResponse : 상위 R&R 선택 목록 응답 { items, total }
- RrCreateRequest       : R&R 등록 요청
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# R&R 레벨
# ---------------------------------------------------------------------------

class RrLevelResponse(BaseModel):
    """R&R 레벨 응답 (tb_rr_level)"""

    level_id: str = Field(..., description="레벨 ID (예: LV2026_0)")
    year: str = Field(..., description="기준 연도 (예: 2026)")
    level_name: str = Field(..., description="레벨 명 (전사, 부문, 본부, 센터, 팀, 파트)")
    level_step: int = Field(..., description="레벨 순서 (0: Root, 1, 2, 3...)")

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 업무 기간
# ---------------------------------------------------------------------------

class RrPeriodSchema(BaseModel):
    """
    업무 기간 입력/응답 스키마 (tb_rr_period)

    입력(등록 요청):  seq 없이 start_date, end_date 만 제공
    응답(조회):       seq 포함하여 반환
    """

    seq: int | None = Field(None, description="기간 순서 (응답 시 포함, 1부터 시작)")
    start_date: str = Field(..., description="시작월 (YYYYMM)", pattern=r"^\d{6}$")
    end_date: str = Field(..., description="종료월 (YYYYMM)", pattern=r"^\d{6}$")

    model_config = ConfigDict(from_attributes=True)


class PeriodInput(BaseModel):
    """R&R 등록 시 기간 입력 항목"""

    start_date: str = Field(..., description="시작월 (YYYYMM)", pattern=r"^\d{6}$")
    end_date: str = Field(..., description="종료월 (YYYYMM)", pattern=r"^\d{6}$")


# ---------------------------------------------------------------------------
# R&R 응답
# ---------------------------------------------------------------------------

class RrResponse(BaseModel):
    """단일 R&R 응답 스키마 (상위 R&R 명 + 기간 목록 포함)"""

    rr_id: uuid.UUID = Field(..., description="R&R ID (UUID)")
    year: str = Field(..., description="기준 연도 (예: 2026)")
    level_id: str = Field(..., description="R&R 레벨 ID")
    emp_no: str = Field(..., description="사번")
    dept_code: str = Field(..., description="부서 코드")
    rr_type: str = Field(..., description="R&R 유형 (COMPANY, LEADER, MEMBER)")
    parent_rr_id: uuid.UUID | None = Field(None, description="상위 R&R ID")
    parent_title: str | None = Field(None, description="상위 R&R 명 (JOIN 결과)")
    title: str = Field(..., description="R&R 명 (핵심 과업 제목)")
    content: str | None = Field(None, description="상세 내용")
    status: str = Field(..., description="상태 (N: 미작성, R: 작성중, Y: 확정)")
    in_date: datetime = Field(..., description="등록일시 (UTC)")
    periods: list[RrPeriodSchema] = Field(default_factory=list, description="수행 기간 목록")

    model_config = ConfigDict(from_attributes=True)


class RrListResponse(BaseModel):
    """R&R 목록 응답 — { items: list[RrResponse], total: int }"""

    items: list[RrResponse] = Field(default_factory=list, description="R&R 목록")
    total: int = Field(..., description="전체 건수")


# ---------------------------------------------------------------------------
# 내 부서 목록 (겸직 포함)
# ---------------------------------------------------------------------------

class MyDepartmentItem(BaseModel):
    """소속 부서 아이템 (주소속 + 겸직)"""

    dept_code: str = Field(..., description="부서 코드")
    dept_name: str = Field(..., description="부서명")
    is_main: bool = Field(..., description="주소속 여부 (True: 주소속, False: 겸직)")

    model_config = ConfigDict(from_attributes=True)


class MyDepartmentsResponse(BaseModel):
    """내 부서 목록 응답 — { items: list[MyDepartmentItem], total: int }"""

    items: list[MyDepartmentItem] = Field(default_factory=list, description="부서 목록")
    total: int = Field(..., description="전체 건수")


# ---------------------------------------------------------------------------
# 상위 R&R 선택 목록
# ---------------------------------------------------------------------------

class ParentRrOption(BaseModel):
    """상위 R&R 드롭다운 항목"""

    rr_id: uuid.UUID = Field(..., description="R&R ID")
    title: str = Field(..., description="R&R 명")
    emp_no: str = Field(..., description="등록자 사번")
    emp_name: str = Field(..., description="등록자 성명")

    model_config = ConfigDict(from_attributes=True)


class ParentRrOptionsResponse(BaseModel):
    """상위 R&R 선택 목록 응답 — { items: list[ParentRrOption], total: int }"""

    items: list[ParentRrOption] = Field(default_factory=list, description="상위 R&R 목록")
    total: int = Field(..., description="전체 건수")


# ---------------------------------------------------------------------------
# R&R 등록 요청
# ---------------------------------------------------------------------------

class RrCreateRequest(BaseModel):
    """R&R 등록 요청 스키마"""

    year: str = Field(..., description="기준 연도 (YYYY)", pattern=r"^\d{4}$")
    dept_code: str = Field(..., description="부서 코드")
    parent_rr_id: uuid.UUID | None = Field(
        None, description="상위 R&R ID (없으면 null)"
    )
    title: str = Field(..., description="R&R 명 (핵심 과업 제목)", min_length=1, max_length=500)
    content: str | None = Field(None, description="상세 내용")
    periods: list[PeriodInput] = Field(
        ...,
        description="수행 기간 목록 (최소 1개)",
        min_length=1,
    )


__all__ = [
    "RrLevelResponse",
    "RrPeriodSchema",
    "PeriodInput",
    "RrResponse",
    "RrListResponse",
    "MyDepartmentItem",
    "MyDepartmentsResponse",
    "ParentRrOption",
    "ParentRrOptionsResponse",
    "RrCreateRequest",
]
