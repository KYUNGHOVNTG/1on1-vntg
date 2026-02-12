"""
HR 도메인 Mock Repository

JSON 파일을 데이터 소스로 사용하는 Mock 구현체입니다.
실제 DB 연동 전까지 개발 및 테스트 용도로 사용합니다.
"""

from server.app.domain.hr.repositories.mock.employee_mock_repository import (
    EmployeeMockRepository,
)
from server.app.domain.hr.repositories.mock.department_mock_repository import (
    DepartmentMockRepository,
)

__all__ = [
    "EmployeeMockRepository",
    "DepartmentMockRepository",
]
