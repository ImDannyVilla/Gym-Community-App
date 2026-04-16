from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file")

#the async database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for all models
class Base(DeclarativeBase):
    pass

# Dependency for FastAPI routes(automatic openings and closing sessions)
async def get_db():
    async with async_session_maker() as session:
        yield session