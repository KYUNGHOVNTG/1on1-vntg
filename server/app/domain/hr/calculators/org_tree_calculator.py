"""
HR 도메인 - 조직도 트리 Calculator

플랫 리스트 형태의 조직도 데이터를 계층형 트리 구조로 변환합니다.

원칙:
    - 순수 함수로 구현 (Side Effect 금지)
    - DB 접근 금지
    - API 호출 금지
"""

from server.app.domain.hr.models import CMDepartmentTree
from server.app.domain.hr.schemas.department import OrgTreeNode


class OrgTreeCalculator:
    """
    조직도 트리 변환 Calculator

    책임:
        - 플랫 리스트 → 계층형 트리 변환
        - DISP_LVL 기준 정렬
        - 직원 수 정보 주입
    """

    @staticmethod
    def build_tree(
        flat_nodes: list[CMDepartmentTree],
        employee_counts: dict[str, int] | None = None,
    ) -> list[OrgTreeNode]:
        """
        플랫 리스트를 계층형 트리 구조로 변환합니다.

        Args:
            flat_nodes: CM_DEPARTMENT_TREE 플랫 리스트 (disp_lvl, dept_code 정렬 필수)
            employee_counts: 부서별 직원 수 딕셔너리 {dept_code: count}

        Returns:
            List[OrgTreeNode]: 최상위 부서 리스트 (children에 하위 부서 포함)
        """
        if not flat_nodes:
            return []

        if employee_counts is None:
            employee_counts = {}

        # 1. 모든 노드를 OrgTreeNode로 변환하며 dict에 저장
        node_map: dict[str, OrgTreeNode] = {}
        for item in flat_nodes:
            node = OrgTreeNode(
                std_year=item.std_year,
                dept_code=item.dept_code,
                dept_name=item.dept_name,
                upper_dept_code=item.upper_dept_code,
                disp_lvl=item.disp_lvl,
                dept_head_emp_no=item.dept_head_emp_no,
                dept_head_name=item.name_kor,
                employee_count=employee_counts.get(item.dept_code, 0),
                children=[],
            )
            node_map[item.dept_code] = node

        # 2. 부모-자식 관계 구성
        root_nodes: list[OrgTreeNode] = []
        for _dept_code, node in node_map.items():
            if node.upper_dept_code and node.upper_dept_code in node_map:
                parent = node_map[node.upper_dept_code]
                parent.children.append(node)
            else:
                # 최상위 노드 (upper_dept_code가 없거나 부모가 트리에 없음)
                root_nodes.append(node)

        # 3. 각 레벨에서 dept_code 기준 정렬
        OrgTreeCalculator._sort_children(root_nodes)

        return root_nodes

    @staticmethod
    def _sort_children(nodes: list[OrgTreeNode]) -> None:
        """
        트리 노드의 children을 재귀적으로 dept_code 기준 정렬합니다.

        Args:
            nodes: 정렬 대상 노드 리스트
        """
        nodes.sort(key=lambda n: n.dept_code)
        for node in nodes:
            if node.children:
                OrgTreeCalculator._sort_children(node.children)
