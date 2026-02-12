"""add hr sync test data (20 employees, 5 departments)

Revision ID: h5i6j7k8l9m0
Revises: g3h4i5j6k7l8
Create Date: 2026-02-12 06:50:00.000000

HR 동기화 테스트를 위한 목데이터를 추가합니다.
1. cm_department: 5개 부서 (D001~D005)
   - D001: 경영지원팀, D002: 개발팀, D003: 디자인팀
   - D004: 마케팅팀, D005: 영업팀
2. cm_user: 20명 사용자 (user001~user020)
   - 각 부서별로 팀장 1명 + 팀원 N명 구성

이 데이터는 SyncManagementPage의 mockEmployees/mockDepartments와 연동됩니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'h5i6j7k8l9m0'
down_revision: Union[str, None] = 'g3h4i5j6k7l8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    HR 동기화 테스트 데이터 추가 (5개 부서, 20명 사용자)
    """
    # 1. cm_department: 5개 부서 추가 (부서장 정보 포함)
    op.execute("""
        INSERT INTO cm_department (dept_code, dept_name, upper_dept_code, dept_head_emp_no, use_yn, in_user)
        VALUES
            ('D001', '경영지원팀', NULL, 'E002', 'Y', 'system'),
            ('D002', '개발팀', NULL, 'E004', 'Y', 'system'),
            ('D003', '디자인팀', NULL, 'E011', 'Y', 'system'),
            ('D004', '마케팅팀', NULL, 'E015', 'Y', 'system'),
            ('D005', '영업팀', NULL, 'E018', 'Y', 'system')
        ON CONFLICT (dept_code) DO NOTHING
    """)

    # 2. cm_user: 20명 사용자 추가
    op.execute("""
        INSERT INTO cm_user (user_id, email, role_code, position_code, use_yn, in_user)
        VALUES
            ('user001', 'user001@vntgcorp.com', 'R002', 'P001', 'Y', 'system'),
            ('user002', 'user002@vntgcorp.com', 'R002', 'P002', 'Y', 'system'),
            ('user003', 'user003@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user004', 'user004@vntgcorp.com', 'R002', 'P004', 'Y', 'system'),
            ('user005', 'user005@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user006', 'user006@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user007', 'user007@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user008', 'user008@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user009', 'user009@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user010', 'user010@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user011', 'user011@vntgcorp.com', 'R002', 'P004', 'Y', 'system'),
            ('user012', 'user012@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user013', 'user013@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user014', 'user014@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user015', 'user015@vntgcorp.com', 'R002', 'P004', 'Y', 'system'),
            ('user016', 'user016@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user017', 'user017@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user018', 'user018@vntgcorp.com', 'R002', 'P004', 'Y', 'system'),
            ('user019', 'user019@vntgcorp.com', 'R002', 'P005', 'Y', 'system'),
            ('user020', 'user020@vntgcorp.com', 'R002', 'P005', 'Y', 'system')
        ON CONFLICT (user_id) DO NOTHING
    """)


def downgrade() -> None:
    """
    Rollback 시 테스트 데이터 삭제
    """
    # 역순으로 삭제 (외래키 제약 조건 고려)
    op.execute("DELETE FROM cm_user WHERE user_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'user006', 'user007', 'user008', 'user009', 'user010', 'user011', 'user012', 'user013', 'user014', 'user015', 'user016', 'user017', 'user018', 'user019', 'user020')")
    op.execute("DELETE FROM cm_department WHERE dept_code IN ('D001', 'D002', 'D003', 'D004', 'D005')")
