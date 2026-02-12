"""add_hr_tables

Revision ID: e1f2a3b4c5d6
Revises: 27941e0cba88
Create Date: 2026-02-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = '27941e0cba88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =============================================
    # 1. CM_DEPARTMENT 테이블 생성 (부서 정보)
    # =============================================
    op.create_table(
        'cm_department',
        sa.Column('dept_code', sa.String(length=20), nullable=False, comment='부서 코드'),
        sa.Column('dept_name', sa.String(length=100), nullable=False, comment='부서명'),
        sa.Column('upper_dept_code', sa.String(length=20), nullable=True, comment='상위 부서 코드'),
        sa.Column('dept_head_emp_no', sa.String(length=20), nullable=True, comment='부서장 사번'),
        sa.Column('use_yn', sa.CHAR(length=1), nullable=False, server_default='Y', comment='사용 여부'),
        sa.Column('in_user', sa.String(length=50), nullable=True, comment='등록자'),
        sa.Column('in_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='등록일시'),
        sa.Column('up_user', sa.String(length=50), nullable=True, comment='수정자'),
        sa.Column('up_date', sa.DateTime(), nullable=True, comment='수정일시'),
        sa.PrimaryKeyConstraint('dept_code'),
        sa.ForeignKeyConstraint(['upper_dept_code'], ['cm_department.dept_code'], name='fk_cm_department_upper')
    )
    op.create_index('idx_cm_department_upper', 'cm_department', ['upper_dept_code'], unique=False)

    # =============================================
    # 2. HR_MGNT 테이블 생성 (인사 정보)
    # =============================================
    op.create_table(
        'hr_mgnt',
        sa.Column('emp_no', sa.String(length=20), nullable=False, comment='사번'),
        sa.Column('user_id', sa.String(length=50), nullable=False, comment='사용자 ID'),
        sa.Column('name_kor', sa.String(length=100), nullable=False, comment='성명(한글)'),
        sa.Column('dept_code', sa.String(length=20), nullable=False, comment='부서 코드 (주소속)'),
        sa.Column('position_code', sa.String(length=10), nullable=False, comment='직책 코드'),
        sa.Column('on_work_yn', sa.CHAR(length=1), nullable=False, server_default='Y', comment='재직 여부 (Y: 재직, N: 퇴직)'),
        sa.Column('in_user', sa.String(length=50), nullable=True, comment='등록자'),
        sa.Column('in_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='등록일시'),
        sa.Column('up_user', sa.String(length=50), nullable=True, comment='수정자'),
        sa.Column('up_date', sa.DateTime(), nullable=True, comment='수정일시'),
        sa.PrimaryKeyConstraint('emp_no'),
        sa.ForeignKeyConstraint(['user_id'], ['cm_user.user_id'], name='fk_hr_mgnt_user'),
        sa.ForeignKeyConstraint(['dept_code'], ['cm_department.dept_code'], name='fk_hr_mgnt_dept'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_hr_mgnt_user', 'hr_mgnt', ['user_id'], unique=False)
    op.create_index('idx_hr_mgnt_dept', 'hr_mgnt', ['dept_code'], unique=False)
    op.create_index('idx_hr_mgnt_name', 'hr_mgnt', ['name_kor'], unique=False)

    # =============================================
    # 3. HR_MGNT_CONCUR 테이블 생성 (겸직 정보)
    # =============================================
    op.create_table(
        'hr_mgnt_concur',
        sa.Column('emp_no', sa.String(length=20), nullable=False, comment='사번'),
        sa.Column('dept_code', sa.String(length=20), nullable=False, comment='부서 코드'),
        sa.Column('is_main', sa.CHAR(length=1), nullable=False, server_default='N', comment='본직 여부 (Y: 주소속, N: 겸직)'),
        sa.Column('position_code', sa.String(length=10), nullable=False, comment='직책 코드'),
        sa.Column('in_user', sa.String(length=50), nullable=True, comment='등록자'),
        sa.Column('in_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='등록일시'),
        sa.Column('up_user', sa.String(length=50), nullable=True, comment='수정자'),
        sa.Column('up_date', sa.DateTime(), nullable=True, comment='수정일시'),
        sa.PrimaryKeyConstraint('emp_no', 'dept_code'),
        sa.ForeignKeyConstraint(['emp_no'], ['hr_mgnt.emp_no'], name='fk_hr_mgnt_concur_emp'),
        sa.ForeignKeyConstraint(['dept_code'], ['cm_department.dept_code'], name='fk_hr_mgnt_concur_dept')
    )
    op.create_index('idx_hr_mgnt_concur_emp', 'hr_mgnt_concur', ['emp_no'], unique=False)
    op.create_index('idx_hr_mgnt_concur_dept', 'hr_mgnt_concur', ['dept_code'], unique=False)

    # =============================================
    # 4. CM_DEPARTMENT_TREE 테이블 생성 (조직도 뷰)
    # =============================================
    op.create_table(
        'cm_department_tree',
        sa.Column('std_year', sa.String(length=4), nullable=False, comment='기준 연도 (YYYY)'),
        sa.Column('dept_code', sa.String(length=20), nullable=False, comment='부서 코드'),
        sa.Column('upper_dept_code', sa.String(length=20), nullable=True, comment='상위 부서 코드'),
        sa.Column('dept_name', sa.String(length=100), nullable=False, comment='부서명'),
        sa.Column('disp_lvl', sa.Integer(), nullable=False, comment='표시 레벨 (1: 최상위, 2: 2depth, 3: 3depth)'),
        sa.Column('dept_head_emp_no', sa.String(length=20), nullable=True, comment='부서장 사번'),
        sa.Column('name_kor', sa.String(length=100), nullable=True, comment='부서장 성명'),
        sa.Column('in_user', sa.String(length=50), nullable=True, comment='등록자'),
        sa.Column('in_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='등록일시'),
        sa.Column('up_user', sa.String(length=50), nullable=True, comment='수정자'),
        sa.Column('up_date', sa.DateTime(), nullable=True, comment='수정일시'),
        sa.PrimaryKeyConstraint('std_year', 'dept_code')
    )
    op.create_index('idx_cm_dept_tree_year', 'cm_department_tree', ['std_year'], unique=False)
    op.create_index('idx_cm_dept_tree_lvl', 'cm_department_tree', ['disp_lvl'], unique=False)


def downgrade() -> None:
    # =============================================
    # 테이블 삭제 (역순)
    # =============================================
    op.drop_index('idx_cm_dept_tree_lvl', table_name='cm_department_tree')
    op.drop_index('idx_cm_dept_tree_year', table_name='cm_department_tree')
    op.drop_table('cm_department_tree')

    op.drop_index('idx_hr_mgnt_concur_dept', table_name='hr_mgnt_concur')
    op.drop_index('idx_hr_mgnt_concur_emp', table_name='hr_mgnt_concur')
    op.drop_table('hr_mgnt_concur')

    op.drop_index('idx_hr_mgnt_name', table_name='hr_mgnt')
    op.drop_index('idx_hr_mgnt_dept', table_name='hr_mgnt')
    op.drop_index('idx_hr_mgnt_user', table_name='hr_mgnt')
    op.drop_table('hr_mgnt')

    op.drop_index('idx_cm_department_upper', table_name='cm_department')
    op.drop_table('cm_department')
