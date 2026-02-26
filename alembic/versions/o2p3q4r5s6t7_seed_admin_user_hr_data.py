"""cjhol2107 계정 HR 인사 데이터 추가

Revision ID: o2p3q4r5s6t7
Revises: n1o2p3q4r5s6
Create Date: 2026-02-26 00:00:00.000000

변경 사항:
1. hr_mgnt에 EMP021 (최경호, cjhol2107) 인사 데이터 추가
   - 소속: DEPT001 (경영본부)
   - 직급: P001
   - 재직 상태: Y

배경:
- cm_user에 cjhol2107 계정이 존재하나 hr_mgnt에 인사 레코드 누락
- HR 관련 기능(조직도 조회, 부서 조회 등) 사용을 위해 인사 데이터 필요
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "o2p3q4r5s6t7"
down_revision: Union[str, None] = "n1o2p3q4r5s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    cjhol2107 계정의 hr_mgnt 인사 데이터 추가
    """

    op.execute("""
        INSERT INTO hr_mgnt (
            emp_no,
            user_id,
            name_kor,
            dept_code,
            position_code,
            on_work_yn,
            in_user,
            in_date
        )
        VALUES (
            'EMP021',
            'cjhol2107',
            '최경호',
            'DEPT001',
            'P001',
            'Y',
            'system',
            NOW()
        )
        ON CONFLICT (emp_no) DO NOTHING;
    """)

    # hr_mgnt_concur 주소속 레코드 추가
    op.execute("""
        INSERT INTO hr_mgnt_concur (
            emp_no,
            dept_code,
            is_main,
            position_code,
            in_user,
            in_date
        )
        VALUES (
            'EMP021',
            'DEPT001',
            'Y',
            'P001',
            'system',
            NOW()
        )
        ON CONFLICT (emp_no, dept_code) DO NOTHING;
    """)


def downgrade() -> None:
    """
    cjhol2107 인사 데이터 롤백
    """

    op.execute("DELETE FROM hr_mgnt_concur WHERE emp_no = 'EMP021'")
    op.execute("DELETE FROM hr_mgnt WHERE emp_no = 'EMP021'")
