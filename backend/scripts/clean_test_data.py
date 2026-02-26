# scripts/clean_test_data.py
import asyncio
from sqlalchemy import delete
from app.db import async_session_maker
from app.models.user import User

async def clean_test_data():
    async with async_session_maker() as db:
        # delete all test users emails ending with @test.com
        result = await db.execute(
            delete(User).where(User.email.like('%@test.com'))
        )
        await db.commit()
        
        print(f"✅ Deleted {result.rowcount} test users")

if __name__ == "__main__":
    asyncio.run(clean_test_data())

