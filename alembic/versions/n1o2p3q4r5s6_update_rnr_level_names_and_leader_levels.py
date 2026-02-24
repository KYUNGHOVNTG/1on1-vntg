"""tb_rr_level 레벨명 수정 및 LEADER R&R 레벨 조정

Revision ID: n1o2p3q4r5s6
Revises: m0n1o2p3q4r5
Create Date: 2026-02-24 00:00:00.000000

변경 사항:
1. tb_rr_level 레벨명 수정 (3건)
   - LV2026_1: '부문' → '총괄'
   - LV2026_3: '센터' → '센터/실'  (센터와 실은 동일 레벨)
   - LV2026_5: '파트' → '개인'

2. tb_rr LEADER R&R 레벨 조정 (2건)
   - RR_LEADER_003 (EMP013, 백엔드파트장): LV2026_5(파트) → LV2026_4(팀)
   - RR_LEADER_004 (EMP014, AI파트장):     LV2026_5(파트) → LV2026_4(팀)
   이유: '개인' 레벨은 팀원 개인 R&R 전용. 파트장의 R&R은 팀 레벨로 등록

변경 후 레벨 구조:
  LV2026_0: 전사  (level_step=0)
  LV2026_1: 총괄  (level_step=1)
  LV2026_2: 본부  (level_step=2)
  LV2026_3: 센터/실 (level_step=3)
  LV2026_4: 팀    (level_step=4)
  LV2026_5: 개인  (level_step=5)
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "n1o2p3q4r5s6"
down_revision: Union[str, None] = "m0n1o2p3q4r5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    레벨명 수정 및 LEADER R&R 레벨 조정
    """

    # =============================================
    # 1. tb_rr_level 레벨명 수정 (3건)
    # =============================================
    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '총괄'
        WHERE level_id = 'LV2026_1'
    """)

    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '센터/실'
        WHERE level_id = 'LV2026_3'
    """)

    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '개인'
        WHERE level_id = 'LV2026_5'
    """)

    # =============================================
    # 2. tb_rr LEADER R&R 레벨 조정
    #    파트장(EMP013, EMP014)의 R&R은 '개인'이 아닌 '팀' 레벨이 적합
    # =============================================
    op.execute("""
        UPDATE tb_rr
        SET level_id = 'LV2026_4'
        WHERE rr_id IN (
            '11111111-1111-1111-1111-111111111003'::uuid,
            '11111111-1111-1111-1111-111111111004'::uuid
        )
    """)


def downgrade() -> None:
    """
    레벨명 및 R&R 레벨 원복
    """

    # =============================================
    # 1. tb_rr LEADER R&R 레벨 원복
    # =============================================
    op.execute("""
        UPDATE tb_rr
        SET level_id = 'LV2026_5'
        WHERE rr_id IN (
            '11111111-1111-1111-1111-111111111003'::uuid,
            '11111111-1111-1111-1111-111111111004'::uuid
        )
    """)

    # =============================================
    # 2. tb_rr_level 레벨명 원복
    # =============================================
    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '부문'
        WHERE level_id = 'LV2026_1'
    """)

    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '센터'
        WHERE level_id = 'LV2026_3'
    """)

    op.execute("""
        UPDATE tb_rr_level
        SET level_name = '파트'
        WHERE level_id = 'LV2026_5'
    """)
