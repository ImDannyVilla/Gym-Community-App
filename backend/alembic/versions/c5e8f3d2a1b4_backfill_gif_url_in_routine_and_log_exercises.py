"""backfill gif_url in routine and log exercises from exercise_library

Revision ID: c5e8f3d2a1b4
Revises: 786e836f0009
Create Date: 2026-04-30 12:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c5e8f3d2a1b4'
down_revision = '786e836f0009'
branch_labels = None
depends_on = None


def upgrade():
    # Backfill gif_url in routine_exercises where it is null
    op.execute("""
        UPDATE routine_exercises
        SET gif_url = el.gif_url
        FROM exercise_library el
        WHERE routine_exercises.exercise_id = el.exercise_id
          AND routine_exercises.gif_url IS NULL
          AND el.gif_url IS NOT NULL
    """)

    # Backfill gif_url in workout_log_exercises where it is null
    op.execute("""
        UPDATE workout_log_exercises
        SET gif_url = el.gif_url
        FROM exercise_library el
        WHERE workout_log_exercises.exercise_id = el.exercise_id
          AND workout_log_exercises.gif_url IS NULL
          AND el.gif_url IS NOT NULL
    """)


def downgrade():
    pass
