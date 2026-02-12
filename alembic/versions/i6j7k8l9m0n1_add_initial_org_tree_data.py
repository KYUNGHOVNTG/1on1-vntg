"""add initial org tree data

Revision ID: i6j7k8l9m0n1
Revises: h5i6j7k8l9m0
Create Date: 2026-02-12 07:00:00.000000

cm_department 테이블의 데이터를 cm_department_tree 테이블에 복사하여
조직도 페이지에서 부서 정보를 조회할 수 있도록 합니다.

기준 연도: 2026
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'i6j7k8l9m0n1'
down_revision: Union[str, None] = 'h5i6j7k8l9m0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    cm_department 데이터를 cm_department_tree로 복사

    - 기준 연도: 2026
    - 최상위 부서(upper_dept_code가 NULL)는 disp_lvl = 1
    - 하위 부서는 disp_lvl = 2
    """

    # cm_department 데이터를 cm_department_tree로 복사
    op.execute("""
        INSERT INTO cm_department_tree (
            std_year,
            dept_code,
            upper_dept_code,
            dept_name,
            disp_lvl,
            dept_head_emp_no,
            name_kor,
            in_user
        )
        SELECT
            '2026' AS std_year,
            d.dept_code,
            d.upper_dept_code,
            d.dept_name,
            CASE
                WHEN d.upper_dept_code IS NULL THEN 1
                ELSE 2
            END AS disp_lvl,
            d.dept_head_emp_no,
            e.name_kor,
            'system' AS in_user
        FROM cm_department d
        LEFT JOIN hr_mgnt e ON d.dept_head_emp_no = e.emp_no
        WHERE d.use_yn = 'Y'
        ON CONFLICT (std_year, dept_code) DO NOTHING
    """)


def downgrade() -> None:
    """
    2026년도 조직도 데이터 삭제
    """
    op.execute("""
        DELETE FROM cm_department_tree
        WHERE std_year = '2026'
    """)
