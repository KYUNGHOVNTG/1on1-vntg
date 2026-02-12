"""add_hr_sync_history_table

Revision ID: f2g3h4i5j6k7
Revises: e1f2a3b4c5d6
Create Date: 2026-02-12 05:30:00.000000

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
    # =============================================
    # HR_SYNC_HISTORY 테이블 생성 (동기화 이력)
    # =============================================
    op.create_table(
        'hr_sync_history',
        sa.Column('sync_id', sa.Integer(), autoincrement=True, nullable=False, comment='동기화 이력 ID'),
        sa.Column('sync_type', sa.String(length=20), nullable=False, comment='동기화 타입 (employees/departments/org_tree)'),
        sa.Column('sync_status', sa.String(length=20), nullable=False, comment='동기화 상태 (success/failure/partial)'),
        sa.Column('total_count', sa.Integer(), nullable=False, server_default='0', comment='전체 건수'),
        sa.Column('success_count', sa.Integer(), nullable=False, server_default='0', comment='성공 건수'),
        sa.Column('failure_count', sa.Integer(), nullable=False, server_default='0', comment='실패 건수'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='에러 메시지'),
        sa.Column('sync_start_time', sa.DateTime(), nullable=False, comment='동기화 시작 시간'),
        sa.Column('sync_end_time', sa.DateTime(), nullable=True, comment='동기화 종료 시간'),
        sa.Column('in_user', sa.String(length=50), nullable=True, comment='실행자'),
        sa.Column('in_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='등록일시'),
        sa.PrimaryKeyConstraint('sync_id')
    )

    # 인덱스 생성
    op.create_index('idx_hr_sync_history_type', 'hr_sync_history', ['sync_type'], unique=False)
    op.create_index('idx_hr_sync_history_status', 'hr_sync_history', ['sync_status'], unique=False)
    op.create_index('idx_hr_sync_history_start_time', 'hr_sync_history', ['sync_start_time'], unique=False)


def downgrade() -> None:
    # 인덱스 삭제
    op.drop_index('idx_hr_sync_history_start_time', table_name='hr_sync_history')
    op.drop_index('idx_hr_sync_history_status', table_name='hr_sync_history')
    op.drop_index('idx_hr_sync_history_type', table_name='hr_sync_history')

    # 테이블 삭제
    op.drop_table('hr_sync_history')
