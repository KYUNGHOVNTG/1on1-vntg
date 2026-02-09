"""add_menu_type_column_and_update_role_codes

Revision ID: a1b2c3d4e5f6
Revises: d4940e4bda2d
Create Date: 2026-02-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd4940e4bda2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =============================================
    # 1. cm_menu 테이블에 menu_type 컬럼 추가
    # =============================================
    op.add_column('cm_menu',
        sa.Column('menu_type', sa.String(length=10), nullable=False,
                  server_default='COMMON',
                  comment='메뉴 타입 (COMMON: 일반 메뉴, ADMIN: 관리자 전용 메뉴)'))

    op.create_index('idx_menu_type', 'cm_menu', ['menu_type'], unique=False)

    # =============================================
    # 2. 시스템 관리 메뉴를 ADMIN 타입으로 업데이트
    # =============================================
    op.execute("""
        UPDATE cm_menu SET menu_type = 'ADMIN'
        WHERE menu_code IN (
            'M004', 'M004_1', 'M004_2', 'M004_3', 'M004_4',
            'M004_1_1', 'M004_1_2', 'M004_2_1', 'M004_2_2'
        )
    """)

    # =============================================
    # 3. ROLE 공통코드 재정의 (R001/R002 추가)
    # =============================================
    op.execute("""
        INSERT INTO cm_codedetail (code_type, code, code_name, use_yn, sort_seq, rmk, in_user, in_date)
        VALUES
            ('ROLE', 'R001', '시스템 관리자', 'Y', 1, '시스템 관리자 (관리 메뉴 접근 가능)', 'system', NOW()),
            ('ROLE', 'R002', '일반 사용자', 'Y', 2, '일반 사용자 (직책별 메뉴만 접근)', 'system', NOW())
        ON CONFLICT (code_type, code) DO UPDATE SET
            code_name = EXCLUDED.code_name,
            rmk = EXCLUDED.rmk,
            up_user = 'system',
            up_date = NOW()
    """)

    # 기존 ROLE 코드 비활성화
    op.execute("""
        UPDATE cm_codedetail
        SET use_yn = 'N', up_user = 'system', up_date = NOW()
        WHERE code_type = 'ROLE' AND code IN ('CD001', 'CD002')
    """)

    # =============================================
    # 4. cm_user의 role_code 업데이트 (CD001→R001, CD002→R002)
    # =============================================
    op.execute("""
        UPDATE cm_user SET role_code = 'R001', up_user = 'system', up_date = NOW()
        WHERE role_code = 'CD001'
    """)
    op.execute("""
        UPDATE cm_user SET role_code = 'R002', up_user = 'system', up_date = NOW()
        WHERE role_code = 'CD002'
    """)


def downgrade() -> None:
    # =============================================
    # 4. cm_user의 role_code 복원 (R001→CD001, R002→CD002)
    # =============================================
    op.execute("""
        UPDATE cm_user SET role_code = 'CD001', up_user = 'system', up_date = NOW()
        WHERE role_code = 'R001'
    """)
    op.execute("""
        UPDATE cm_user SET role_code = 'CD002', up_user = 'system', up_date = NOW()
        WHERE role_code = 'R002'
    """)

    # =============================================
    # 3. ROLE 공통코드 복원
    # =============================================
    op.execute("""
        UPDATE cm_codedetail
        SET use_yn = 'Y', up_user = 'system', up_date = NOW()
        WHERE code_type = 'ROLE' AND code IN ('CD001', 'CD002')
    """)
    op.execute("""
        DELETE FROM cm_codedetail
        WHERE code_type = 'ROLE' AND code IN ('R001', 'R002')
    """)

    # =============================================
    # 2. 시스템 관리 메뉴를 COMMON으로 복원
    # =============================================
    op.execute("""
        UPDATE cm_menu SET menu_type = 'COMMON'
        WHERE menu_code IN (
            'M004', 'M004_1', 'M004_2', 'M004_3', 'M004_4',
            'M004_1_1', 'M004_1_2', 'M004_2_1', 'M004_2_2'
        )
    """)

    # =============================================
    # 1. menu_type 컬럼 제거
    # =============================================
    op.drop_index('idx_menu_type', table_name='cm_menu')
    op.drop_column('cm_menu', 'menu_type')
