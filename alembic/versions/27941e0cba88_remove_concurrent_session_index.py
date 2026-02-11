"""remove_concurrent_session_index

Revision ID: 27941e0cba88
Revises: d4940e4bda2d
Create Date: 2026-02-11 08:30:00.000000

동시접속 제어 기능 제거에 따라 불필요한 인덱스를 삭제합니다.
- idx_refresh_token_user_active: 동시접속 체크용 인덱스 제거
- idx_refresh_token_cleanup: Idle timeout용 인덱스는 유지
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '27941e0cba88'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    동시접속 체크용 인덱스 제거
    """
    # idx_refresh_token_user_active 인덱스 삭제
    op.drop_index(
        'idx_refresh_token_user_active',
        table_name='auth_refresh_token',
        postgresql_where=sa.text("revoked_yn = 'N'")
    )


def downgrade() -> None:
    """
    Rollback 시 인덱스 재생성
    """
    # idx_refresh_token_user_active 인덱스 재생성
    op.create_index(
        'idx_refresh_token_user_active',
        'auth_refresh_token',
        ['user_id', 'revoked_yn', 'last_activity_at'],
        unique=False,
        postgresql_where=sa.text("revoked_yn = 'N'")
    )
