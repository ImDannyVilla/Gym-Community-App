from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
#DeclarativeBase is the parent class for all database models (User, Post, and more).
# When we write class User(Base), you're saying "User is a database table."

import os #Python's built-in module for operating system stuff (reading env vars, file paths)
from dotenv import load_dotenv  #Loads variables from .env file into memory(prevents hardcoding sensitive info)

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Now to CONNECT THE SUPABASE connection manager
# This creates the database engine (connection manager)
# The engine is like a telephone line to our database. It:
# - Manages connections to our Supabase
# - handles connection pooling (reuses connections instead of creating new ones each time)
# - Translates Python to -> SQL
engine = create_async_engine(
    DATABASE_URL,
    echo=True, #print all SQL queries to console(preference for now)
    pool_pre_ping=True, #tst connection before using it (prevents "connection closed" errors)
)

#A session is a temporary workspace for database operations
async_session_maker = async_sessionmaker(
    engine, # Which database to connect to
    #class_=AsyncSession,
    expire_on_commit=False, #After committing, objects stay in memory (otherwise they'd be "expired" and require re-fetching)
)


# Base class for all models
class Base(DeclarativeBase):
    pass


# Dependency: Get database session for each request
async def get_db():
    """
    FastAPI dependency that provides a database session.

    Usage in routes:
    async def my_route(db: AsyncSession = Depends(get_db)):
        # Use db here
        pass

    Automatically:
    - Opens connection before request
    - Closes connection after request
    """
    async with async_session_maker() as session:
        yield session

# load_dotenv()              # Read .env file
#DATABASE_URL = os.getenv() # Get connection string
#engine = create_async_engine()  # Connect to Supabase
#async_session_maker = ...  # Create session factory
#Base = ...                 # Create model base class