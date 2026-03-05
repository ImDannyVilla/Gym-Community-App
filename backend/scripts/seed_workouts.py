import asyncio
from app.db import async_session_maker
from app.models.workout import Workout
from app.models.exercise import Exercise


async def seed_chest_triceps():
#   Seed Chest and Triceps workout HERE
    async with async_session_maker() as db:
        # Create workout
        workout = Workout(
            name="Chest and Triceps",
            description="Build upper body pushing strength with compound and isolation movements",
            category="Push",
            difficulty="Intermediate",
            duration_minutes=60,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)

        # Add exercises
        exercises = [
            Exercise(
                workout_id=workout.id,
                exercise_id="0025",
                name="Barbell Bench Press",
                gif_url="https://v2.exercisedb.io/image/0025",
                sets=4,
                reps="8-12",
                rest_seconds=90,
                order=1,
                notes="Focus on controlled descent, touch chest lightly"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0033",
                name="Incline Dumbbell Press",
                gif_url="https://v2.exercisedb.io/image/0033",
                sets=3,
                reps="10-12",
                rest_seconds=60,
                order=2,
                notes="45-degree angle, full range of motion"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0108",
                name="Cable Chest Fly",
                gif_url="https://v2.exercisedb.io/image/0108",
                sets=3,
                reps="12-15",
                rest_seconds=45,
                order=3,
                notes="Squeeze at peak contraction"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0456",
                name="Tricep Dips",
                gif_url="https://v2.exercisedb.io/image/0456",
                sets=3,
                reps="10-12",
                rest_seconds=60,
                order=4,
                notes="Lean forward slightly for chest, upright for triceps"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0789",
                name="Overhead Tricep Extension",
                gif_url="https://v2.exercisedb.io/image/0789",
                sets=3,
                reps="12-15",
                rest_seconds=45,
                order=5,
                notes="Keep elbows close to head"
            ),
        ]

        for ex in exercises:
            db.add(ex)

        await db.commit()
        print("✅ Seeded: Chest and Triceps Workout")


async def seed_back_biceps():
    """Seed Back and Biceps workout"""
    async with async_session_maker() as db:
        workout = Workout(
            name="Back and Biceps",
            description="Build a strong, wide back and defined biceps",
            category="Pull",
            difficulty="Intermediate",
            duration_minutes=60,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)

        exercises = [
            Exercise(
                workout_id=workout.id,
                exercise_id="0027",
                name="Barbell Deadlift",
                gif_url="https://v2.exercisedb.io/image/0027",
                sets=4,
                reps="6-8",
                rest_seconds=120,
                order=1,
                notes="Maintain neutral spine, drive through heels"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0142",
                name="Pull-ups",
                gif_url="https://v2.exercisedb.io/image/0142",
                sets=4,
                reps="8-10",
                rest_seconds=90,
                order=2,
                notes="Full extension at bottom, chin over bar at top"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0234",
                name="Barbell Row",
                gif_url="https://v2.exercisedb.io/image/0234",
                sets=3,
                reps="10-12",
                rest_seconds=60,
                order=3,
                notes="Pull to lower chest, squeeze shoulder blades"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0567",
                name="Barbell Curl",
                gif_url="https://v2.exercisedb.io/image/0567",
                sets=3,
                reps="10-12",
                rest_seconds=45,
                order=4,
                notes="No swinging, control the negative"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0890",
                name="Hammer Curls",
                gif_url="https://v2.exercisedb.io/image/0890",
                sets=3,
                reps="12-15",
                rest_seconds=45,
                order=5,
                notes="Targets brachialis for arm thickness"
            ),
        ]

        for ex in exercises:
            db.add(ex)

        await db.commit()
        print("✅ Seeded: Back and Biceps Workout")


async def seed_legs():
    """Seed Leg workout"""
    async with async_session_maker() as db:
        workout = Workout(
            name="Leg Day",
            description="Build powerful legs with compound and isolation movements",
            category="Legs",
            difficulty="Intermediate",
            duration_minutes=70,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)

        exercises = [
            Exercise(
                workout_id=workout.id,
                exercise_id="0043",
                name="Barbell Squat",
                gif_url="https://v2.exercisedb.io/image/0043",
                sets=4,
                reps="8-10",
                rest_seconds=120,
                order=1,
                notes="Depth to parallel or below, knees track over toes"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0345",
                name="Romanian Deadlift",
                gif_url="https://v2.exercisedb.io/image/0345",
                sets=3,
                reps="10-12",
                rest_seconds=90,
                order=2,
                notes="Feel the stretch in hamstrings, slight knee bend"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0678",
                name="Leg Press",
                gif_url="https://v2.exercisedb.io/image/0678",
                sets=3,
                reps="12-15",
                rest_seconds=60,
                order=3,
                notes="Full range of motion, don't lock knees"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="0901",
                name="Leg Curl",
                gif_url="https://v2.exercisedb.io/image/0901",
                sets=3,
                reps="12-15",
                rest_seconds=45,
                order=4,
                notes="Squeeze hamstrings at peak"
            ),
            Exercise(
                workout_id=workout.id,
                exercise_id="1234",
                name="Calf Raises",
                gif_url="https://v2.exercisedb.io/image/1234",
                sets=4,
                reps="15-20",
                rest_seconds=45,
                order=5,
                notes="Full stretch at bottom, hold peak for 1 sec"
            ),
        ]

        for ex in exercises:
            db.add(ex)

        await db.commit()
        print("✅ Seeded: Leg Day Workout")


async def main():
    print("🌱 Seeding preset workouts...")
    await seed_chest_triceps()
    await seed_back_biceps()
    await seed_legs()
    print("✅ All workouts seeded!")


if __name__ == "__main__":
    asyncio.run(main())