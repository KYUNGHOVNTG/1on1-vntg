"""
HR 도메인 - 직원 정보 스키마

직원 조회 및 관리를 위한 Pydantic 스키마를 정의합니다.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class ConcurrentPosition(BaseModel):
    """겸직 정보 스키마"""

    model_config = ConfigDict(from_attributes=True)

    emp_no: str = Field(..., description="사번")
    dept_code: str = Field(..., description="부서 코드")
    dept_name: Optional[str] = Field(None, description="부서명")
    is_main: str = Field(..., description="본직 여부 (Y/N)")
    position_code: str = Field(..., description="직책 코드")
    position_name: Optional[str] = Field(None, description="직책명")


class EmployeeBase(BaseModel):
    """직원 기본 정보 스키마"""

    model_config = ConfigDict(from_attributes=True)

    emp_no: str = Field(..., description="사번")
    user_id: str = Field(..., description="사용자 ID")
    name_kor: str = Field(..., description="성명(한글)")
    dept_code: str = Field(..., description="부서 코드 (주소속)")
    dept_name: Optional[str] = Field(None, description="부서명 (주소속)")
    position_code: str = Field(..., description="직책 코드")
    position_name: Optional[str] = Field(None, description="직책명")
    on_work_yn: str = Field(..., description="재직 여부 (Y/N)")


class EmployeeDetailResponse(EmployeeBase):
    """
    직원 상세 응답 스키마

    API 응답용 간소화된 직원 상세 정보입니다.
    """
    pass


class EmployeeProfile(EmployeeBase):
    """
    직원 프로필 스키마 (주소속 + 겸직 통합)

    직원의 주소속 정보와 겸직 정보를 포함한 전체 프로필입니다.
    """

    email: str = Field(..., description="이메일")
    use_yn: str = Field(..., description="계정 사용 여부 (Y/N)")
    role_code: Optional[str] = Field(None, description="시스템 권한 코드")
    role_name: Optional[str] = Field(None, description="시스템 권한명")

    # 겸직 정보
    concurrent_positions: List[ConcurrentPosition] = Field(
        default_factory=list,
        description="겸직 정보 리스트"
    )

    # 메타 정보
    in_date: datetime = Field(..., description="등록일시")
    up_date: Optional[datetime] = Field(None, description="수정일시")


class EmployeeListItem(EmployeeBase):
    """
    직원 목록 아이템 스키마

    직원 목록 조회 시 사용되는 간소화된 스키마입니다.
    """

    email: str = Field(..., description="이메일")
    has_concurrent: bool = Field(
        default=False,
        description="겸직 여부 (True: 겸직자, False: 단일 소속)"
    )


class EmployeeListResponse(BaseModel):
    """직원 목록 조회 응답 스키마"""

    model_config = ConfigDict(from_attributes=True)

    total: int = Field(..., description="전체 건수")
    page: int = Field(..., description="현재 페이지")
    size: int = Field(..., description="페이지당 건수")
    pages: int = Field(..., description="전체 페이지 수")
    items: List[EmployeeDetailResponse] = Field(..., description="직원 목록")


class EmployeeSearchParams(BaseModel):
    """직원 검색 파라미터 스키마"""

    search: Optional[str] = Field(None, description="검색어 (성명, 사번, 부서명)")
    on_work_yn: Optional[str] = Field(None, description="재직 여부 (Y/N)")
    position_code: Optional[str] = Field(None, description="직책 코드")
    dept_code: Optional[str] = Field(None, description="부서 코드")
    page: int = Field(default=1, ge=1, description="페이지 번호")
    limit: int = Field(default=20, ge=1, le=100, description="페이지당 건수")


class ConcurrentPositionResponse(BaseModel):
    """
    겸직 정보 응답 스키마

    API 응답용 겸직 정보입니다.
    """

    model_config = ConfigDict(from_attributes=True)

    emp_no: str = Field(..., description="사번")
    dept_code: str = Field(..., description="부서 코드")
    is_main: str = Field(..., description="본직 여부 (Y/N)")
    position_code: str = Field(..., description="직책 코드")
