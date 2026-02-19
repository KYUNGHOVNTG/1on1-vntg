"""
HR 도메인 - 부서/조직도 스키마

부서 정보 및 조직도 조회를 위한 Pydantic 스키마를 정의합니다.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class DepartmentBase(BaseModel):
    """부서 기본 정보 스키마"""

    model_config = ConfigDict(from_attributes=True)

    dept_code: str = Field(..., description="부서 코드")
    dept_name: str = Field(..., description="부서명")
    upper_dept_code: Optional[str] = Field(None, description="상위 부서 코드")
    use_yn: str = Field(..., description="사용 여부 (Y/N)")


class DepartmentDetailResponse(DepartmentBase):
    """
    부서 상세 응답 스키마

    API 응답용 간소화된 부서 상세 정보입니다.
    """

    dept_head_emp_no: Optional[str] = Field(None, description="부서장 사번")


class DepartmentInfo(DepartmentBase):
    """
    부서 상세 정보 스키마

    부서 기본 정보와 부서장 정보를 포함합니다.
    """

    dept_head_emp_no: Optional[str] = Field(None, description="부서장 사번")
    dept_head_name: Optional[str] = Field(None, description="부서장 성명")
    employee_count: int = Field(default=0, description="소속 직원 수 (주소속 + 겸직)")

    # 메타 정보
    in_date: datetime = Field(..., description="등록일시")
    up_date: Optional[datetime] = Field(None, description="수정일시")


class DepartmentListResponse(BaseModel):
    """부서 목록 조회 응답 스키마"""

    model_config = ConfigDict(from_attributes=True)

    total: int = Field(..., description="전체 건수")
    items: List[DepartmentDetailResponse] = Field(..., description="부서 목록")


class OrgTreeNode(BaseModel):
    """
    조직도 트리 노드 스키마

    계층형 조직도를 표현하기 위한 재귀적 구조입니다.
    """

    model_config = ConfigDict(from_attributes=True)

    std_year: str = Field(..., description="기준 연도 (YYYY)")
    dept_code: str = Field(..., description="부서 코드")
    dept_name: str = Field(..., description="부서명")
    upper_dept_code: Optional[str] = Field(None, description="상위 부서 코드")
    disp_lvl: int = Field(..., description="표시 레벨 (1: 최상위, 2: 2depth, 3: 3depth)")

    # 부서장 정보
    dept_head_emp_no: Optional[str] = Field(None, description="부서장 사번")
    dept_head_name: Optional[str] = Field(None, description="부서장 성명")

    # 통계 정보
    employee_count: int = Field(default=0, description="소속 직원 수")

    # 하위 부서 (재귀 구조)
    children: List["OrgTreeNode"] = Field(
        default_factory=list,
        description="하위 부서 리스트"
    )


class OrgTreeResponse(BaseModel):
    """조직도 트리 조회 응답 스키마"""

    model_config = ConfigDict(from_attributes=True)

    std_year: str = Field(..., description="기준 연도")
    tree: List[OrgTreeNode] = Field(..., description="조직도 트리 (최상위 부서 리스트)")


class DepartmentSearchParams(BaseModel):
    """부서 검색 파라미터 스키마"""

    search: Optional[str] = Field(None, description="검색어 (부서명, 부서 코드)")
    use_yn: Optional[str] = Field(None, description="사용 여부 (Y/N)")
    upper_dept_code: Optional[str] = Field(None, description="상위 부서 코드")


class DepartmentEmployeesResponse(BaseModel):
    """
    부서 직원 목록 조회 응답 스키마

    부서별 소속 직원 목록과 총 인원 수를 포함합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    items: List["EmployeeDetailResponse"] = Field(..., description="직원 목록")
    total: int = Field(..., description="전체 직원 수")


# Forward reference를 위한 import (순환 참조 방지)
from server.app.domain.hr.schemas.employee import EmployeeDetailResponse

# Forward reference 업데이트
DepartmentEmployeesResponse.model_rebuild()
