"""
HR 도메인 - 부서 정보 Mock Repository

JSON 파일을 데이터 소스로 사용하는 Mock 구현체입니다.
"""

import json
import os
from typing import List, Optional
from datetime import datetime

from server.app.domain.hr.repositories.department_repository import IDepartmentRepository
from server.app.domain.hr.models import CMDepartment, CMDepartmentTree


class DepartmentMockRepository(IDepartmentRepository):
    """
    부서 정보 Mock Repository

    JSON 파일에서 데이터를 로드하여 메모리에서 조회합니다.
    """

    def __init__(self):
        """Mock 데이터 초기화"""
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.departments: List[dict] = []
        self.org_tree: List[dict] = []
        self._load_data()

    def _load_data(self) -> None:
        """JSON 파일에서 Mock 데이터 로드"""
        # 부서 데이터 로드
        dept_path = os.path.join(self.base_path, "department_mock.json")
        with open(dept_path, "r", encoding="utf-8") as f:
            self.departments = json.load(f)

        # 조직도 데이터 로드
        org_tree_path = os.path.join(self.base_path, "org_tree_mock.json")
        with open(org_tree_path, "r", encoding="utf-8") as f:
            self.org_tree = json.load(f)

    def _dict_to_department(self, data: dict) -> CMDepartment:
        """딕셔너리를 CMDepartment 객체로 변환"""
        department = CMDepartment()
        department.dept_code = data["dept_code"]
        department.dept_name = data["dept_name"]
        department.upper_dept_code = data.get("upper_dept_code")
        department.dept_head_emp_no = data.get("dept_head_emp_no")
        department.use_yn = data["use_yn"]
        department.in_user = data.get("in_user")
        department.in_date = datetime.fromisoformat(data["in_date"])
        department.up_user = data.get("up_user")
        department.up_date = (
            datetime.fromisoformat(data["up_date"]) if data.get("up_date") else None
        )
        return department

    def _dict_to_org_tree_node(self, data: dict) -> CMDepartmentTree:
        """딕셔너리를 CMDepartmentTree 객체로 변환"""
        node = CMDepartmentTree()
        node.std_year = data["std_year"]
        node.dept_code = data["dept_code"]
        node.upper_dept_code = data.get("upper_dept_code")
        node.dept_name = data["dept_name"]
        node.disp_lvl = data["disp_lvl"]
        node.dept_head_emp_no = data.get("dept_head_emp_no")
        node.name_kor = data.get("name_kor")
        node.in_user = data.get("in_user")
        node.in_date = datetime.fromisoformat(data["in_date"])
        node.up_user = data.get("up_user")
        node.up_date = (
            datetime.fromisoformat(data["up_date"]) if data.get("up_date") else None
        )
        return node

    async def find_all(
        self,
        search: Optional[str] = None,
        use_yn: Optional[str] = None,
        upper_dept_code: Optional[str] = None,
    ) -> List[CMDepartment]:
        """부서 목록을 조회합니다"""
        filtered = self.departments.copy()

        if search:
            filtered = [
                dept
                for dept in filtered
                if search.lower() in dept["dept_name"].lower()
                or search.upper() in dept["dept_code"].upper()
            ]

        if use_yn:
            filtered = [dept for dept in filtered if dept["use_yn"] == use_yn]

        if upper_dept_code is not None:
            if upper_dept_code == "":
                # 최상위 부서 조회 (upper_dept_code가 null)
                filtered = [dept for dept in filtered if dept.get("upper_dept_code") is None]
            else:
                filtered = [
                    dept for dept in filtered if dept.get("upper_dept_code") == upper_dept_code
                ]

        # 객체 변환
        result = [self._dict_to_department(dept) for dept in filtered]

        return result

    async def find_by_dept_code(self, dept_code: str) -> Optional[CMDepartment]:
        """부서 코드로 부서 정보를 조회합니다"""
        for dept_data in self.departments:
            if dept_data["dept_code"] == dept_code:
                return self._dict_to_department(dept_data)
        return None

    async def find_sub_departments(self, dept_code: str) -> List[CMDepartment]:
        """하위 부서 목록을 조회합니다"""
        result = []
        for dept_data in self.departments:
            if dept_data.get("upper_dept_code") == dept_code:
                result.append(self._dict_to_department(dept_data))
        return result

    async def find_org_tree_by_year(self, std_year: str) -> List[CMDepartmentTree]:
        """연도별 조직도 데이터를 조회합니다 (플랫 리스트)"""
        result = []
        for node_data in self.org_tree:
            if node_data["std_year"] == std_year:
                result.append(self._dict_to_org_tree_node(node_data))

        # DISP_LVL 기준 정렬
        result.sort(key=lambda x: (x.disp_lvl, x.dept_code))

        return result

    async def find_org_tree_node(
        self, std_year: str, dept_code: str
    ) -> Optional[CMDepartmentTree]:
        """조직도에서 특정 부서 노드를 조회합니다"""
        for node_data in self.org_tree:
            if node_data["std_year"] == std_year and node_data["dept_code"] == dept_code:
                return self._dict_to_org_tree_node(node_data)
        return None

    async def get_latest_year(self) -> Optional[str]:
        """조직도의 최신 연도를 조회합니다"""
        if not self.org_tree:
            return None

        years = {node["std_year"] for node in self.org_tree}
        return max(years) if years else None
