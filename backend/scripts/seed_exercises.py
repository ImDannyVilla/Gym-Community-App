import asyncio
import json
from uuid import uuid4
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db import async_session_maker
from app.models.exerciseLibrary import ExerciseLibrary

JSON_PATH = r"C:\Users\danne\Downloads\exercises.json"
IMAGE_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

async def seed_exercises():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    print(f"Loaded {len(exercises)} exercises from file")

    async with async_session_maker() as db:
        try:
            for ex in exercises:
                images = ex.get("images", [])
                image_url = f"{IMAGE_BASE_URL}/{images[0]}" if images else None

                stmt = pg_insert(ExerciseLibrary).values(
                    id=uuid4(),
                    exercise_id=ex.get("id"),
                    name=ex.get("name"),
                    body_part=ex.get("category"),
                    target=", ".join(ex.get("primaryMuscles", [])),
                    equipment=ex.get("equipment"),
                    gif_url=image_url,
                    secondary_muscles=", ".join(ex.get("secondaryMuscles", [])),
                    instructions="\n".join(ex.get("instructions", [])),
                ).on_conflict_do_nothing(index_elements=["exercise_id"])
                await db.execute(stmt)

            await db.commit()
            print(f"Successfully seeded {len(exercises)} exercises")

        except Exception as e:
            await db.rollback()
            print(f"Seeding failed: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(seed_exercises())