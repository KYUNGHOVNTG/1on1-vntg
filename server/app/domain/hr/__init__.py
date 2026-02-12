"""
HR (인사/조직) 도메인

인사 정보, 조직도, 부서 관리 기능을 제공합니다.

구조:
    - models: ORM 모델 (CMUser, HRMgnt, HRMgntConcur, CMDepartment, CMDepartmentTree)
    - schemas: Pydantic 스키마 (EmployeeProfile, DepartmentInfo, OrgTreeNode 등)
    - repositories: 데이터 접근 계층 (IEmployeeRepository, IDepartmentRepository)
    - service: HR 서비스 (EmployeeService, DepartmentService)
    - router: FastAPI 라우터 (직원/부서 API 엔드포인트)
"""

from server.app.domain.hr import models, schemas, repositories, service, router

__all__ = [
    "models",
    "schemas",
    "repositories",
    "service",
    "router",
]
