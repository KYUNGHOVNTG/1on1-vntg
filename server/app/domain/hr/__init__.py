"""
HR (인사/조직) 도메인

인사 정보, 조직도, 부서 관리 기능을 제공합니다.

구조:
    - models: ORM 모델 (CMUser, HRMgnt, HRMgntConcur, CMDepartment, CMDepartmentTree)
    - schemas: Pydantic 스키마 (EmployeeProfile, DepartmentInfo, OrgTreeNode 등)
    - repositories: 데이터 접근 계층 (IEmployeeRepository, IDepartmentRepository)
    - calculators: 비즈니스 로직 (조직도 트리 변환 등)
    - formatters: 응답 포맷팅 (겸직 정보 병합 등)
    - service: HR 통합 서비스
"""

from server.app.domain.hr import models, schemas, repositories

__all__ = [
    "models",
    "schemas",
    "repositories",
]
