"""add_hr_menu_and_permissions

Revision ID: g3h4i5j6k7l8
Revises: f2g3h4i5j6k7
Create Date: 2026-02-12 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'g3h4i5j6k7l8'
down_revision: Union[str, None] = 'f2g3h4i5j6k7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    HR (인사관리) 메뉴 추가 및 권한 설정

    메뉴 구조:
    - M005: 인사관리 (Root, Level 1)
      - M005_1: 직원 관리 (Level 2)
      - M005_2: 조직도 관리 (Level 2)
      - M005_3: 동기화 관리 (Level 2)

    권한: P001 (대표이사), P002 (총괄), P003 (센터장/실장)
    """

    # =============================================
    # 1. 최상위 메뉴 추가 (Level 1)
    # =============================================
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
        VALUES ('M005', '인사관리', NULL, 1, '/hr', 5, 'system')
    """)

    # =============================================
    # 2. 하위 메뉴 추가 (Level 2)
    # =============================================
    op.execute("""
        INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
        VALUES
            ('M005_1', '직원 관리', 'M005', 2, '/hr/employees', 1, 'system'),
            ('M005_2', '조직도 관리', 'M005', 2, '/hr/org-chart', 2, 'system'),
            ('M005_3', '동기화 관리', 'M005', 2, '/hr/sync', 3, 'system')
    """)

    # =============================================
    # 3. 직책별 메뉴 권한 추가
    # =============================================
    # 대표이사(P001), 총괄(P002), 센터장/실장(P003)만 접근 가능
    op.execute("""
        INSERT INTO cm_position_menu (position_code, menu_code, in_user)
        VALUES
            -- P001 (대표이사)
            ('P001', 'M005', 'system'),
            ('P001', 'M005_1', 'system'),
            ('P001', 'M005_2', 'system'),
            ('P001', 'M005_3', 'system'),

            -- P002 (총괄)
            ('P002', 'M005', 'system'),
            ('P002', 'M005_1', 'system'),
            ('P002', 'M005_2', 'system'),
            ('P002', 'M005_3', 'system'),

            -- P003 (센터장/실장)
            ('P003', 'M005', 'system'),
            ('P003', 'M005_1', 'system'),
            ('P003', 'M005_2', 'system'),
            ('P003', 'M005_3', 'system')
    """)


def downgrade() -> None:
    """
    HR 메뉴 및 권한 삭제
    """

    # 권한 삭제
    op.execute("""
        DELETE FROM cm_position_menu
        WHERE menu_code IN ('M005', 'M005_1', 'M005_2', 'M005_3')
    """)

    # 메뉴 삭제 (하위 메뉴 먼저 삭제)
    op.execute("""
        DELETE FROM cm_menu
        WHERE menu_code IN ('M005_3', 'M005_2', 'M005_1', 'M005')
    """)
