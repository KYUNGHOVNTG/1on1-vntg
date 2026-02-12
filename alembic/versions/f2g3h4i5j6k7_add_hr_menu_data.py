"""add_hr_menu_data

Revision ID: f2g3h4i5j6k7
Revises: e1f2a3b4c5d6
Create Date: 2026-02-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2g3h4i5j6k7'
down_revision: Union[str, None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    HR 관련 메뉴 데이터 추가
    - M005: 인사관리 (Root)
    - M005_1: 직원 관리 (TASK 2 완료)
    - M005_2: 조직도 관리 (TASK 3용)
    """

    # =============================================
    # 1. 메뉴 추가
    # =============================================
    # Root 메뉴: 인사관리
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, use_yn, in_user)
        VALUES ('M005', '인사관리', NULL, 1, '/hr', 5, 'Y', 'system')
    """)

    # 2차 메뉴: 직원 관리
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, use_yn, in_user)
        VALUES ('M005_1', '직원 관리', 'M005', 2, '/hr/employees', 1, 'Y', 'system')
    """)

    # 2차 메뉴: 조직도 관리 (TASK 3용)
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, use_yn, in_user)
        VALUES ('M005_2', '조직도 관리', 'M005', 2, '/hr/org-chart', 2, 'Y', 'system')
    """)

    # =============================================
    # 2. 직책별 메뉴 권한 추가
    # =============================================
    # 대표이사(P001), 총괄(P002), 센터장/실장(P003)에게 모든 HR 메뉴 권한 부여
    op.execute("""
        INSERT INTO cm_position_menu (position_code, menu_code, in_user)
        VALUES
            -- P001 (대표이사)
            ('P001', 'M005', 'system'),
            ('P001', 'M005_1', 'system'),
            ('P001', 'M005_2', 'system'),

            -- P002 (총괄)
            ('P002', 'M005', 'system'),
            ('P002', 'M005_1', 'system'),
            ('P002', 'M005_2', 'system'),

            -- P003 (센터장/실장)
            ('P003', 'M005', 'system'),
            ('P003', 'M005_1', 'system'),
            ('P003', 'M005_2', 'system')
    """)


def downgrade() -> None:
    """
    HR 메뉴 데이터 삭제
    """

    # =============================================
    # 1. 직책별 메뉴 권한 삭제
    # =============================================
    op.execute("""
        DELETE FROM cm_position_menu
        WHERE menu_code IN ('M005', 'M005_1', 'M005_2')
    """)

    # =============================================
    # 2. 메뉴 삭제 (역순)
    # =============================================
    op.execute("DELETE FROM cm_menu WHERE menu_code = 'M005_2'")
    op.execute("DELETE FROM cm_menu WHERE menu_code = 'M005_1'")
    op.execute("DELETE FROM cm_menu WHERE menu_code = 'M005'")
