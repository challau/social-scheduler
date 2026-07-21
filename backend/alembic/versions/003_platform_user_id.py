"""Add platform_user_id to social_accounts

Stores the platform-side identity required for publishing:
Instagram business account ID, LinkedIn person URN, Twitter user ID.

Revision ID: 003_platform_user_id
Revises: 002_billing_and_brand_voice
Create Date: 2026-07-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_platform_user_id'
down_revision = '002_billing_and_brand_voice'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('social_accounts', sa.Column('platform_user_id', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('social_accounts', 'platform_user_id')
