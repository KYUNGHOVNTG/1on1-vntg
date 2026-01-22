"""add_session_columns_to_refresh_token

Revision ID: b83b2a688072
Revises: 
Create Date: 2026-01-22 04:30:49.390611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b83b2a688072'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # RefreshToken 테이블에 세션 관리 컬럼 추가
    op.add_column('auth_refresh_token',
        sa.Column('last_activity_at', sa.DateTime(), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP'),
                  comment='마지막 활동 시간 (Idle Timeout 체크용)'))

    op.add_column('auth_refresh_token',
        sa.Column('device_info', sa.Text(), nullable=True,
                  comment='디바이스 정보 (User-Agent)'))

    op.add_column('auth_refresh_token',
        sa.Column('ip_address', sa.String(length=45), nullable=True,
                  comment='로그인 IP 주소 (IPv6 지원)'))


def downgrade() -> None:
    # 세션 관리 컬럼 제거
    op.drop_column('auth_refresh_token', 'ip_address')
    op.drop_column('auth_refresh_token', 'device_info')
    op.drop_column('auth_refresh_token', 'last_activity_at')
