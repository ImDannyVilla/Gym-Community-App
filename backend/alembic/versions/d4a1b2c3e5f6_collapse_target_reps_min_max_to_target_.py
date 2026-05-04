"""collapse target_reps_min/max to target_reps

Revision ID: d4a1b2c3e5f6
Revises: c5e8f3d2a1b4
Create Date: 2026-05-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4a1b2c3e5f6'
down_revision = 'c5e8f3d2a1b4'
branch_labels = None
depends_on = None


def upgrade():
    # --- routine_exercises ---
    op.add_column('routine_exercises', sa.Column('target_reps', sa.Integer(), nullable=True))
    op.execute("UPDATE routine_exercises SET target_reps = target_reps_min")
    op.drop_column('routine_exercises', 'target_reps_min')
    op.drop_column('routine_exercises', 'target_reps_max')

    # --- workout_log_exercises ---
    op.add_column('workout_log_exercises', sa.Column('target_reps', sa.Integer(), nullable=True))
    op.execute("UPDATE workout_log_exercises SET target_reps = target_reps_min")
    op.drop_column('workout_log_exercises', 'target_reps_min')
    op.drop_column('workout_log_exercises', 'target_reps_max')


def downgrade():
    # --- routine_exercises ---
    op.add_column('routine_exercises', sa.Column('target_reps_min', sa.Integer(), nullable=True))
    op.add_column('routine_exercises', sa.Column('target_reps_max', sa.Integer(), nullable=True))
    op.execute("UPDATE routine_exercises SET target_reps_min = target_reps, target_reps_max = target_reps")
    op.drop_column('routine_exercises', 'target_reps')

    # --- workout_log_exercises ---
    op.add_column('workout_log_exercises', sa.Column('target_reps_min', sa.Integer(), nullable=True))
    op.add_column('workout_log_exercises', sa.Column('target_reps_max', sa.Integer(), nullable=True))
    op.execute("UPDATE workout_log_exercises SET target_reps_min = target_reps, target_reps_max = target_reps")
    op.drop_column('workout_log_exercises', 'target_reps')
