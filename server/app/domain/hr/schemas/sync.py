"""
HR 도메인 - 동기화 스키마

외부 시스템과의 데이터 동기화 요청/응답 스키마를 정의합니다.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# =============================================
# 직원 동기화 스키마
# =============================================


class EmployeeSyncRequest(BaseModel):
    """
    직원 정보 동기화 요청

    외부 시스템에서 전달받은 직원 데이터를 Bulk로 업데이트합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    emp_no: str = Field(..., description="사번")
    user_id: str = Field(..., description="사용자 ID")
    name_kor: str = Field(..., description="성명(한글)")
    dept_code: str = Field(..., description="부서 코드 (주소속)")
    position_code: str = Field(..., description="직책 코드")
    on_work_yn: str = Field(..., description="재직 여부 (Y/N)")


# =============================================
# 부서 동기화 스키마
# =============================================


class DepartmentSyncRequest(BaseModel):
    """
    부서 정보 동기화 요청

    외부 시스템에서 전달받은 부서 데이터를 Bulk로 업데이트합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    dept_code: str = Field(..., description="부서 코드")
    dept_name: str = Field(..., description="부서명")
    upper_dept_code: Optional[str] = Field(None, description="상위 부서 코드")
    dept_head_emp_no: Optional[str] = Field(None, description="부서장 사번")
    use_yn: str = Field(default='Y', description="사용 여부 (Y/N)")


# =============================================
# 동기화 이력 스키마
# =============================================


class SyncHistoryResponse(BaseModel):
    """
    동기화 이력 응답

    동기화 실행 결과 및 이력을 반환합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    sync_id: int = Field(..., description="동기화 이력 ID")
    sync_type: str = Field(..., description="동기화 타입 (employees/departments/org_tree)")
    sync_status: str = Field(..., description="동기화 상태 (success/failure/partial)")
    total_count: int = Field(..., description="전체 건수")
    success_count: int = Field(..., description="성공 건수")
    failure_count: int = Field(..., description="실패 건수")
    error_message: Optional[str] = Field(None, description="에러 메시지")
    sync_start_time: datetime = Field(..., description="동기화 시작 시간")
    sync_end_time: Optional[datetime] = Field(None, description="동기화 종료 시간")
    in_user: Optional[str] = Field(None, description="실행자")
    in_date: datetime = Field(..., description="등록일시")


class SyncHistoryListResponse(BaseModel):
    """
    동기화 이력 목록 응답
    """

    items: list[SyncHistoryResponse] = Field(..., description="동기화 이력 목록")
    total: int = Field(..., description="전체 건수")


# =============================================
# 동기화 실행 응답
# =============================================


class SyncExecutionResponse(BaseModel):
    """
    동기화 실행 즉시 응답

    동기화 작업 시작 시점의 결과를 반환합니다.
    """

    sync_id: int = Field(..., description="동기화 이력 ID")
    sync_type: str = Field(..., description="동기화 타입")
    sync_status: str = Field(..., description="동기화 상태")
    total_count: int = Field(..., description="전체 건수")
    success_count: int = Field(..., description="성공 건수")
    failure_count: int = Field(..., description="실패 건수")
    message: str = Field(..., description="결과 메시지")
