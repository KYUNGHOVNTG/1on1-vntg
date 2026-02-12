"""
HR 도메인 Repository

직원 및 부서 정보 데이터 접근 계층 인터페이스를 정의합니다.
"""

from server.app.domain.hr.repositories.employee_repository import IEmployeeRepository
from server.app.domain.hr.repositories.department_repository import IDepartmentRepository

__all__ = [
    "IEmployeeRepository",
    "IDepartmentRepository",
]
