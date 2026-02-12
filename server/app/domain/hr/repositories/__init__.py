"""
HR 도메인 Repository

직원 및 부서 정보 데이터 접근 계층 인터페이스 및 구현체를 제공합니다.
"""

# 인터페이스
from server.app.domain.hr.repositories.employee_repository import IEmployeeRepository
from server.app.domain.hr.repositories.department_repository import IDepartmentRepository

# DB 구현체
from server.app.domain.hr.repositories.employee_db_repository import (
    EmployeeDBRepository,
)
from server.app.domain.hr.repositories.department_db_repository import (
    DepartmentDBRepository,
)

# Mock 구현체
from server.app.domain.hr.repositories.mock import (
    EmployeeMockRepository,
    DepartmentMockRepository,
)

__all__ = [
    # 인터페이스
    "IEmployeeRepository",
    "IDepartmentRepository",
    # DB 구현체
    "EmployeeDBRepository",
    "DepartmentDBRepository",
    # Mock 구현체
    "EmployeeMockRepository",
    "DepartmentMockRepository",
]
