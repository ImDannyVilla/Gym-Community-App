from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# this is the Alembic Config object
config = context.config

# Get DATABASE_URL and convert asyncpg to psycopg2 for Alembic
database_url = os.getenv("DATABASE_URL")
if database_url and database_url.startswith("postgresql+asyncpg://"):
    # Replace asyncpg with psycopg2 for sync operations
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
elif database_url and database_url.startswith("sqlite+aiosqlite:///"):
    database_url = database_url.replace("sqlite+aiosqlite:///", "sqlite:///")

config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ========== ADD THIS SECTION ==========

# Import your Base and all models
from app.db import Base
from app.models.user import User, UserProfile, Follow
from app.models.exerciseLibrary import ExerciseLibrary
from app.models.seededWorkout import SeededWorkout
from app.models.routine import Routine, RoutineExercise
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet


# Set target metadata for autogenerate
target_metadata = Base.metadata

# ========== END ADDITION ==========

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,  # ← Uses target_metadata
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata  # ← Uses target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
