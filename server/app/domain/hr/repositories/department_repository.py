"""
HR 도메인 - 부서 정보 Repository 인터페이스

부서 정보 및 조직도 조회를 위한 추상 인터페이스를 정의합니다.
Mock Repository와 Real Repository가 이 인터페이스를 구현합니다.
"""

from abc import ABC, abstractmethod
from typing import List, Optional

from server.app.domain.hr.models import CMDepartment, CMDepartmentTree


class IDepartmentRepository(ABC):
    """
    부서 정보 Repository 인터페이스

    책임:
        - 부서 정보 조회
        - 조직도 조회
        - 계층 구조 조회
    """

    @abstractmethod
    async def find_all(
        self,
        search: Optional[str] = None,
        use_yn: Optional[str] = None,
        upper_dept_code: Optional[str] = None,
    ) -> List[CMDepartment]:
        """
        부서 목록을 조회합니다.

        Args:
            search: 검색어 (부서명, 부서 코드)
            use_yn: 사용 여부 (Y/N)
            upper_dept_code: 상위 부서 코드

        Returns:
            List[CMDepartment]: 부서 목록
        """
        pass

    @abstractmethod
    async def find_by_dept_code(self, dept_code: str) -> Optional[CMDepartment]:
        """
        부서 코드로 부서 정보를 조회합니다.

        Args:
            dept_code: 부서 코드

        Returns:
            Optional[CMDepartment]: 부서 정보 또는 None
        """
        pass

    @abstractmethod
    async def find_sub_departments(self, dept_code: str) -> List[CMDepartment]:
        """
        하위 부서 목록을 조회합니다.

        Args:
            dept_code: 상위 부서 코드

        Returns:
            List[CMDepartment]: 하위 부서 목록
        """
        pass

    @abstractmethod
    async def find_org_tree_by_year(self, std_year: str) -> List[CMDepartmentTree]:
        """
        연도별 조직도 데이터를 조회합니다 (플랫 리스트).

        Args:
            std_year: 기준 연도 (YYYY)

        Returns:
            List[CMDepartmentTree]: 조직도 데이터 (플랫 리스트)
        """
        pass

    @abstractmethod
    async def find_org_tree_node(
        self, std_year: str, dept_code: str
    ) -> Optional[CMDepartmentTree]:
        """
        조직도에서 특정 부서 노드를 조회합니다.

        Args:
            std_year: 기준 연도
            dept_code: 부서 코드

        Returns:
            Optional[CMDepartmentTree]: 조직도 노드 또는 None
        """
        pass

    @abstractmethod
    async def get_latest_year(self) -> Optional[str]:
        """
        조직도의 최신 연도를 조회합니다.

        Returns:
            Optional[str]: 최신 연도 (YYYY) 또는 None
        """
        pass
