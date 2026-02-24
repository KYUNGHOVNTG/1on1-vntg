"""M002 하위 메뉴를 R&R 관리 체계로 이름 및 URL 변경

Revision ID: k8l9m0n1o2p3
Revises: j7k8l9m0n1o2
Create Date: 2026-02-24 00:00:00.000000

변경 사항:
- M002:   '목표 관리'        → 'R&R 관리'
- M002_1: '목표 설정'        → '나의 R&R 관리',  /goals/setting    → /goals/myRnr
- M002_2: '목표 진행 현황'   → '전체 R&R 관리',  /goals/progress   → /goals/allRnr
- M002_3: '목표 평가'        → '조직원 R&R 현황', /goals/evaluation → /goals/teamRnr
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'k8l9m0n1o2p3'
down_revision: Union[str, None] = 'j7k8l9m0n1o2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    M002 계열 메뉴를 R&R 관리 체계로 변경

    메뉴 구조 (변경 후):
    - M002:   R&R 관리 (Root, Level 1)
      - M002_1: 나의 R&R 관리   (/goals/myRnr)
      - M002_2: 전체 R&R 관리   (/goals/allRnr)
      - M002_3: 조직원 R&R 현황 (/goals/teamRnr)
    """

    # =============================================
    # 1. M002 최상위 메뉴명 변경 (목표 관리 → R&R 관리)
    # =============================================
    op.execute("""
        UPDATE cm_menu
        SET menu_name = 'R&R 관리',
            up_date   = NOW()
        WHERE menu_code = 'M002'
    """)

    # =============================================
    # 2. M002_1 메뉴명 및 URL 변경
    # =============================================
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '나의 R&R 관리',
            menu_url  = '/goals/myRnr',
            up_date   = NOW()
        WHERE menu_code = 'M002_1'
    """)

    # =============================================
    # 3. M002_2 메뉴명 및 URL 변경
    # =============================================
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '전체 R&R 관리',
            menu_url  = '/goals/allRnr',
            up_date   = NOW()
        WHERE menu_code = 'M002_2'
    """)

    # =============================================
    # 4. M002_3 메뉴명 및 URL 변경
    # =============================================
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '조직원 R&R 현황',
            menu_url  = '/goals/teamRnr',
            up_date   = NOW()
        WHERE menu_code = 'M002_3'
    """)


def downgrade() -> None:
    """
    M002 계열 메뉴를 원래 목표 관리 체계로 원복
    """

    # M002_3 원복
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '목표 평가',
            menu_url  = '/goals/evaluation',
            up_date   = NOW()
        WHERE menu_code = 'M002_3'
    """)

    # M002_2 원복
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '목표 진행 현황',
            menu_url  = '/goals/progress',
            up_date   = NOW()
        WHERE menu_code = 'M002_2'
    """)

    # M002_1 원복
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '목표 설정',
            menu_url  = '/goals/setting',
            up_date   = NOW()
        WHERE menu_code = 'M002_1'
    """)

    # M002 원복
    op.execute("""
        UPDATE cm_menu
        SET menu_name = '목표 관리',
            up_date   = NOW()
        WHERE menu_code = 'M002'
    """)
