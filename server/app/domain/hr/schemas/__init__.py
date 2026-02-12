"""
HR 도메인 스키마

인사/조직 정보 관련 Pydantic 스키마를 정의합니다.
"""

from server.app.domain.hr.schemas.employee import (
    ConcurrentPosition,
    EmployeeBase,
    EmployeeProfile,
    EmployeeListItem,
    EmployeeListResponse,
    EmployeeSearchParams,
    EmployeeDetailResponse,
    ConcurrentPositionResponse,
)

from server.app.domain.hr.schemas.department import (
    DepartmentBase,
    DepartmentInfo,
    DepartmentListResponse,
    OrgTreeNode,
    OrgTreeResponse,
    DepartmentSearchParams,
    DepartmentDetailResponse,
)

from server.app.domain.hr.schemas.sync import (
    EmployeeSyncRequest,
    DepartmentSyncRequest,
    SyncHistoryResponse,
    SyncHistoryListResponse,
    SyncExecutionResponse,
)

__all__ = [
    # Employee schemas
    "ConcurrentPosition",
    "EmployeeBase",
    "EmployeeProfile",
    "EmployeeListItem",
    "EmployeeListResponse",
    "EmployeeSearchParams",
    "EmployeeDetailResponse",
    "ConcurrentPositionResponse",
    # Department schemas
    "DepartmentBase",
    "DepartmentInfo",
    "DepartmentListResponse",
    "OrgTreeNode",
    "OrgTreeResponse",
    "DepartmentSearchParams",
    "DepartmentDetailResponse",
    # Sync schemas
    "EmployeeSyncRequest",
    "DepartmentSyncRequest",
    "SyncHistoryResponse",
    "SyncHistoryListResponse",
    "SyncExecutionResponse",
]
