"""
HR 도메인 - 직원 정보 Mock Repository

JSON 파일을 데이터 소스로 사용하는 Mock 구현체입니다.
"""

import json
import os
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from server.app.domain.hr.repositories.employee_repository import IEmployeeRepository
from server.app.domain.hr.models import HRMgnt, HRMgntConcur, CMUser

# 직책 코드 → 직책명 매핑 (Mock 환경용)
_POSITION_NAME_MAP: Dict[str, str] = {
    "POS001": "대표이사",
    "POS002": "이사",
    "POS003": "부장",
    "POS004": "차장",
    "POS005": "과장",
    "POS006": "대리",
    "POS007": "주임",
    "POS008": "사원",
    # 기존 마이그레이션 시드 코드 (P001 형식)
    "P001": "대표이사",
    "P002": "이사",
    "P003": "부장",
    "P004": "과장",
    "P005": "대리",
}


class EmployeeMockRepository(IEmployeeRepository):
    """
    직원 정보 Mock Repository

    JSON 파일에서 데이터를 로드하여 메모리에서 조회합니다.
    """

    def __init__(self):
        """Mock 데이터 초기화"""
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.employees: List[dict] = []
        self.concurrent_positions: List[dict] = []
        self.users: List[dict] = []
        self._load_data()

    def _load_data(self) -> None:
        """JSON 파일에서 Mock 데이터 로드"""
        # 직원 데이터 로드
        employee_path = os.path.join(self.base_path, "employee_mock.json")
        with open(employee_path, "r", encoding="utf-8") as f:
            self.employees = json.load(f)

        # 겸직 데이터 로드
        concurrent_path = os.path.join(self.base_path, "concurrent_position_mock.json")
        with open(concurrent_path, "r", encoding="utf-8") as f:
            self.concurrent_positions = json.load(f)

        # 사용자 데이터 로드
        user_path = os.path.join(self.base_path, "user_mock.json")
        with open(user_path, "r", encoding="utf-8") as f:
            self.users = json.load(f)

    def _dict_to_employee(self, data: dict) -> HRMgnt:
        """딕셔너리를 HRMgnt 객체로 변환"""
        employee = HRMgnt()
        employee.emp_no = data["emp_no"]
        employee.user_id = data["user_id"]
        employee.name_kor = data["name_kor"]
        employee.dept_code = data["dept_code"]
        employee.position_code = data["position_code"]
        employee.on_work_yn = data["on_work_yn"]
        employee.in_user = data.get("in_user")
        employee.in_date = datetime.fromisoformat(data["in_date"])
        employee.up_user = data.get("up_user")
        employee.up_date = (
            datetime.fromisoformat(data["up_date"]) if data.get("up_date") else None
        )
        return employee

    def _dict_to_concurrent(self, data: dict) -> HRMgntConcur:
        """딕셔너리를 HRMgntConcur 객체로 변환"""
        concurrent = HRMgntConcur()
        concurrent.emp_no = data["emp_no"]
        concurrent.dept_code = data["dept_code"]
        concurrent.is_main = data["is_main"]
        concurrent.position_code = data["position_code"]
        concurrent.in_user = data.get("in_user")
        concurrent.in_date = datetime.fromisoformat(data["in_date"])
        concurrent.up_user = data.get("up_user")
        concurrent.up_date = (
            datetime.fromisoformat(data["up_date"]) if data.get("up_date") else None
        )
        return concurrent

    async def find_all(
        self,
        search: Optional[str] = None,
        on_work_yn: Optional[str] = None,
        position_code: Optional[str] = None,
        dept_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[HRMgnt], int]:
        """직원 목록을 조회합니다 (페이징 포함)"""
        # 필터링
        filtered = self.employees.copy()

        if search:
            filtered = [
                emp
                for emp in filtered
                if search.lower() in emp["name_kor"].lower()
                or search.upper() in emp["emp_no"].upper()
            ]

        if on_work_yn:
            filtered = [emp for emp in filtered if emp["on_work_yn"] == on_work_yn]

        if position_code:
            filtered = [emp for emp in filtered if emp["position_code"] == position_code]

        if dept_code:
            filtered = [emp for emp in filtered if emp["dept_code"] == dept_code]

        # 전체 건수
        total = len(filtered)

        # 페이징
        paginated = filtered[offset : offset + limit]

        # 객체 변환
        result = [self._dict_to_employee(emp) for emp in paginated]

        return result, total

    async def find_by_emp_no(self, emp_no: str) -> Optional[HRMgnt]:
        """사번으로 직원 정보를 조회합니다"""
        for emp_data in self.employees:
            if emp_data["emp_no"] == emp_no:
                return self._dict_to_employee(emp_data)
        return None

    async def find_concurrent_positions_by_emp_no(
        self, emp_no: str
    ) -> List[HRMgntConcur]:
        """사번으로 겸직 정보를 조회합니다"""
        result = []
        for concurrent_data in self.concurrent_positions:
            if concurrent_data["emp_no"] == emp_no:
                result.append(self._dict_to_concurrent(concurrent_data))
        return result

    def _emp_data_to_dict(self, emp_data: dict) -> Dict[str, Any]:
        """직원 JSON 데이터를 서비스 호환 dict로 변환 (position_name 포함)"""
        return {
            "emp_no": emp_data["emp_no"],
            "user_id": emp_data["user_id"],
            "name_kor": emp_data["name_kor"],
            "dept_code": emp_data["dept_code"],
            "position_code": emp_data["position_code"],
            "position_name": _POSITION_NAME_MAP.get(emp_data["position_code"]),
            "on_work_yn": emp_data["on_work_yn"],
        }

    async def find_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> List[Dict[str, Any]]:
        """부서 코드로 소속 직원을 조회합니다 (직책명 포함)"""
        result: List[Dict[str, Any]] = []

        # 주소속 직원 조회
        for emp_data in self.employees:
            if emp_data["dept_code"] == dept_code:
                result.append(self._emp_data_to_dict(emp_data))

        # 겸직자 포함
        if include_concurrent:
            concurrent_emp_nos = set()
            for concurrent_data in self.concurrent_positions:
                if (
                    concurrent_data["dept_code"] == dept_code
                    and concurrent_data["is_main"] == "N"
                ):
                    concurrent_emp_nos.add(concurrent_data["emp_no"])

            for emp_no in concurrent_emp_nos:
                for emp_data in self.employees:
                    if emp_data["emp_no"] == emp_no and emp_data["dept_code"] != dept_code:
                        result.append(self._emp_data_to_dict(emp_data))

        return result

    async def count_by_dept_code(
        self, dept_code: str, include_concurrent: bool = True
    ) -> int:
        """부서별 소속 직원 수를 집계합니다"""
        employees = await self.find_by_dept_code(dept_code, include_concurrent)
        return len(employees)

    async def count_main_by_dept_code(self, dept_code: str) -> int:
        """부서별 주소속 직원 수를 집계합니다 (hr_mgnt.dept_code 기준)"""
        return sum(1 for emp in self.employees if emp["dept_code"] == dept_code)

    async def count_concurrent_by_dept_code(self, dept_code: str) -> int:
        """부서별 겸직 직원 수를 집계합니다 (is_main='N', 주소속 부서 != 조회 부서)"""
        concurrent_emp_nos = {
            c["emp_no"]
            for c in self.concurrent_positions
            if c["dept_code"] == dept_code and c["is_main"] == "N"
        }
        # 주소속이 다른 직원만 카운트
        return sum(
            1
            for emp in self.employees
            if emp["emp_no"] in concurrent_emp_nos and emp["dept_code"] != dept_code
        )
