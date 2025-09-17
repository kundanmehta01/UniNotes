"""add_otp_fields_to_users

Revision ID: 68b6a0b95065
Revises: e800621862eb
Create Date: 2025-09-17 11:44:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '68b6a0b95065'
down_revision: Union[str, None] = 'e800621862eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add OTP-related columns to users table
    op.add_column('users', sa.Column('otp_code', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('otp_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('otp_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('otp_last_sent_at', sa.DateTime(timezone=True), nullable=True))
    
    # SQLite doesn't support ALTER COLUMN to change nullability, but password_hash
    # is already nullable in the existing schema, so we don't need to change it


def downgrade() -> None:
    # Remove OTP-related columns
    op.drop_column('users', 'otp_last_sent_at')
    op.drop_column('users', 'otp_attempts')
    op.drop_column('users', 'otp_expires_at')
    op.drop_column('users', 'otp_code')
    
    # Note: We don't revert password_hash nullability due to SQLite limitations
