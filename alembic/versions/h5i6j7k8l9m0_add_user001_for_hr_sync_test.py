"""add user001 for hr sync test

Revision ID: h5i6j7k8l9m0
Revises: 27941e0cba88
Create Date: 2026-02-12 06:50:00.000000

HR 동기화 테스트를 위한 데이터를 추가합니다.
1. cm_department: D001 부서 추가 (개발팀)
2. cm_user: user001 사용자 추가 (user001@vntgcorp.com)

이 데이터는 SyncManagementPage의 목데이터와 연동됩니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'h5i6j7k8l9m0'
down_revision: Union[str, None] = '27941e0cba88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    HR 동기화 테스트 데이터 추가
    """
    # 1. cm_department: D001 부서 추가
    op.execute("""
        INSERT INTO cm_department (dept_code, dept_name, upper_dept_code, dept_head_emp_no, use_yn, in_user)
        VALUES ('D001', '개발팀', NULL, NULL, 'Y', 'system')
        ON CONFLICT (dept_code) DO NOTHING
    """)

    # 2. cm_user: user001 사용자 추가
    op.execute("""
        INSERT INTO cm_user (user_id, email, role_code, position_code, use_yn, in_user)
        VALUES ('user001', 'user001@vntgcorp.com', 'R002', 'P001', 'Y', 'system')
        ON CONFLICT (user_id) DO NOTHING
    """)


def downgrade() -> None:
    """
    Rollback 시 테스트 데이터 삭제
    """
    # 역순으로 삭제 (외래키 제약 조건 고려)
    op.execute("DELETE FROM cm_user WHERE user_id = 'user001'")
    op.execute("DELETE FROM cm_department WHERE dept_code = 'D001'")
