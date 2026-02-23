"""
HR 도메인 - 직원 정보 Repository 인터페이스

직원 정보 조회를 위한 추상 인터페이스를 정의합니다.
Mock Repository와 Real Repository가 이 인터페이스를 구현합니다.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from server.app.domain.hr.models import HRMgnt, HRMgntConcur


class IEmployeeRepository(ABC):
    """
    직원 정보 Repository 인터페이스

    책임:
        - 직원 정보 조회 (주소속 + 겸직)
        - 검색 및 필터링
        - 페이징 처리
    """

    @abstractmethod
    async def find_all(
        self,
        search: Optional[str] = None,
        on_work_yn: Optional[str] = None,
        position_code: Optional[str] = None,
        dept_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[HRMgnt], int]:
        """
        직원 목록을 조회합니다 (페이징 포함).

        Args:
            search: 검색어 (성명, 사번, 부서명)
            on_work_yn: 재직 여부 (Y/N)
            position_code: 직책 코드
            dept_code: 부서 코드
            offset: 건너뛸 건수
            limit: 조회할 건수

        Returns:
            Tuple[List[HRMgnt], int]: (직원 목록, 전체 건수)
        """
        pass

    @abstractmethod
    async def find_by_emp_no(self, emp_no: str) -> Optional[HRMgnt]:
        """
        사번으로 직원 정보를 조회합니다.

        Args:
            emp_no: 사번

        Returns:
            Optional[HRMgnt]: 직원 정보 또는 None
        """
        pass

    @abstractmethod
    async def find_concurrent_positions_by_emp_no(
        self, emp_no: str
    ) -> List[HRMgntConcur]:
        """
        사번으로 겸직 정보를 조회합니다.

        Args:
            emp_no: 사번

        Returns:
            List[HRMgntConcur]: 겸직 정보 리스트
        """
        pass

    @abstractmethod
    async def find_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> List[HRMgnt]:
        """
        부서 코드로 소속 직원을 조회합니다.

        Args:
            dept_code: 부서 코드
            include_concurrent: 겸직자 포함 여부

        Returns:
            List[HRMgnt]: 소속 직원 리스트
        """
        pass

    @abstractmethod
    async def count_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> int:
        """
        부서별 소속 직원 수를 집계합니다.

        Args:
            dept_code: 부서 코드
            include_concurrent: 겸직자 포함 여부

        Returns:
            int: 소속 직원 수
        """
        pass

    @abstractmethod
    async def count_main_by_dept_code(self, dept_code: str) -> int:
        """
        부서별 주소속 직원 수를 집계합니다 (hr_mgnt.dept_code 기준).

        Args:
            dept_code: 부서 코드

        Returns:
            int: 주소속 직원 수
        """
        pass

    @abstractmethod
    async def count_concurrent_by_dept_code(self, dept_code: str) -> int:
        """
        부서별 겸직 직원 수를 집계합니다.

        hr_mgnt_concur에 등록되어 있고 is_main='N'이며
        주소속 부서가 해당 부서가 아닌 직원 수를 반환합니다.

        Args:
            dept_code: 부서 코드

        Returns:
            int: 겸직 직원 수
        """
        pass
