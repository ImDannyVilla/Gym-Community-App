"""add caption, media fields, workout logs, routines
Revision ID: 290398c56c8a
Revises: a41e5f570d31
Create Date: 2026-04-19 22:49:26.402165
"""
from alembic import op
import sqlalchemy as sa

revision = '290398c56c8a'
down_revision = 'a41e5f570d31'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('workout_logs', sa.Column('media_url', sa.String(), nullable=True))
    op.add_column('workout_logs', sa.Column('media_type', sa.String(), nullable=True))
    op.add_column('workout_logs', sa.Column('caption', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('workout_logs', 'caption')
    op.drop_column('workout_logs', 'media_type')
    op.drop_column('workout_logs', 'media_url')