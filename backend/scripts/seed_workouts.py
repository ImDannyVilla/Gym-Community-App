import asyncio
from uuid import uuid4

from envs.CarieDetection_NewData.Lib.unittest.test.testmock.support import target
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db import async_session_maker
from app.models.seededWorkout import SeededWorkout
from app.models.seeded_workout_exercise import SeededWorkoutExercise
from app.models.exerciseLibrary import ExerciseLibrary

BASE_URL = "https://yfkuflkzhegvctsoheju.supabase.co/storage/v1/object/public/workout_covers"

WORKOUTS = [
    {
        "name": "Push Day",
        "category": "Push",
        "difficulty": "Intermediate",
        "duration_minutes": 60,
        "description": "Chest, shoulders, and triceps. Horizontal and vertical pressing patterns for complete upper body push development.",
        "cover_image_url": f"{BASE_URL}/Push.png",
        "exercises": [
            {"name": "Barbell Bench Press - Medium Grip", "sets": 4, "reps": 6,  "rest": 180, "order": 1, "notes": "Primary chest builder. Keep scapula retracted, feet flat on floor."},
            {"name": "Incline Dumbbell Press",            "sets": 3, "reps": 10, "rest": 120, "order": 2, "notes": "Upper chest emphasis. 30-45 degree incline."},
            {"name": "Cable Crossover",                   "sets": 3, "reps": 12, "rest": 90,  "order": 3, "notes": "Chest isolation. Full stretch at top, squeeze at bottom."},
            {"name": "Seated Dumbbell Press",             "sets": 3, "reps": 10, "rest": 120, "order": 4, "notes": "Overhead pressing for delts. Control the eccentric."},
            {"name": "Side Lateral Raise",                "sets": 4, "reps": 15, "rest": 60,  "order": 5, "notes": "Medial delt isolation. Slight forward lean, no swinging."},
            {"name": "Triceps Pushdown - Rope Attachment","sets": 3, "reps": 12, "rest": 60,  "order": 6, "notes": "Flare wrists at bottom for full triceps contraction."},
            {"name": "EZ-Bar Skullcrusher",               "sets": 3, "reps": 10, "rest": 90,  "order": 7, "notes": "Long head triceps. Lower to forehead, elbows tucked."},
        ]
    },
    {
        "name": "Pull Day",
        "category": "Pull",
        "difficulty": "Intermediate",
        "duration_minutes": 60,
        "description": "Back and biceps. Vertical and horizontal pulling patterns for a thick, wide back with full biceps development.",
        "cover_image_url": f"{BASE_URL}/Pull.png",
        "exercises": [
            {"name": "Pullups",                     "sets": 4, "reps": 8,  "rest": 180, "order": 1, "notes": "Full ROM. Dead hang at bottom, chin over bar at top."},
            {"name": "Bent Over Barbell Row",       "sets": 4, "reps": 8,  "rest": 150, "order": 2, "notes": "Horizontal pull for thickness. Hinge at hips, row to lower chest."},
            {"name": "Seated Cable Rows",           "sets": 3, "reps": 12, "rest": 90,  "order": 3, "notes": "Mid-back focus. Full stretch, pull to navel."},
            {"name": "Wide-Grip Lat Pulldown",      "sets": 3, "reps": 12, "rest": 90,  "order": 4, "notes": "Lat width. Lean slightly back, pull to upper chest."},
            {"name": "Face Pull",                   "sets": 3, "reps": 15, "rest": 60,  "order": 5, "notes": "Rear delt and external rotation health. Pull to forehead level."},
            {"name": "Barbell Curl",                "sets": 3, "reps": 10, "rest": 90,  "order": 6, "notes": "Mass builder. Supinate fully at top."},
            {"name": "Hammer Curls",                "sets": 3, "reps": 12, "rest": 60,  "order": 7, "notes": "Brachialis and brachioradialis. Neutral grip throughout."},
        ]
    },
    {
        "name": "Leg Day",
        "category": "Legs",
        "difficulty": "Intermediate",
        "duration_minutes": 70,
        "description": "Full lower body. Quad-dominant and hip-dominant movements for complete leg development including glutes, hamstrings, and calves.",
        "cover_image_url": f"{BASE_URL}/Legs.png",
        "exercises": [
            {"name": "Barbell Squat",            "sets": 4, "reps": 6,  "rest": 210, "order": 1, "notes": "King of leg exercises. High bar, parallel or below depth."},
            {"name": "Romanian Deadlift",        "sets": 3, "reps": 10, "rest": 150, "order": 2, "notes": "Hip hinge for hamstrings and glutes. Soft knees, feel the stretch."},
            {"name": "Leg Press",                "sets": 3, "reps": 12, "rest": 120, "order": 3, "notes": "Quad emphasis. Feet shoulder width, full ROM."},
            {"name": "Lying Leg Curls",          "sets": 3, "reps": 12, "rest": 90,  "order": 4, "notes": "Hamstring isolation. Curl all the way up, control the descent."},
            {"name": "Leg Extensions",           "sets": 3, "reps": 15, "rest": 60,  "order": 5, "notes": "VMO focus. Pause at top, slow eccentric."},
            {"name": "Barbell Hip Thrust",       "sets": 3, "reps": 12, "rest": 90,  "order": 6, "notes": "Glute builder. Drive through heels, full hip extension at top."},
            {"name": "Standing Calf Raises",     "sets": 4, "reps": 15, "rest": 60,  "order": 7, "notes": "Full stretch at bottom, pause at top."},
        ]
    },
    {
        "name": "Upper Body",
        "category": "Upper",
        "difficulty": "Intermediate",
        "duration_minutes": 65,
        "description": "Complete upper body session. Balanced push and pull movements for chest, back, shoulders, biceps, and triceps.",
        "cover_image_url": f"{BASE_URL}/Upper%20Body.png",
        "exercises": [
            {"name": "Barbell Bench Press - Medium Grip", "sets": 4, "reps": 8,  "rest": 150, "order": 1, "notes": "Primary horizontal press. Control the eccentric."},
            {"name": "Bent Over Barbell Row",             "sets": 4, "reps": 8,  "rest": 150, "order": 2, "notes": "Pair with bench for balanced push-pull."},
            {"name": "Seated Dumbbell Press",             "sets": 3, "reps": 10, "rest": 120, "order": 3, "notes": "Vertical press for shoulder development."},
            {"name": "Wide-Grip Lat Pulldown",            "sets": 3, "reps": 10, "rest": 120, "order": 4, "notes": "Vertical pull for lat width."},
            {"name": "Incline Dumbbell Flyes",            "sets": 3, "reps": 12, "rest": 90,  "order": 5, "notes": "Upper chest stretch and contraction."},
            {"name": "Cable Rear Delt Fly",               "sets": 3, "reps": 15, "rest": 60,  "order": 6, "notes": "Rear delt health and posture."},
            {"name": "EZ-Bar Curl",                       "sets": 3, "reps": 10, "rest": 60,  "order": 7, "notes": "Biceps mass. Supinate at top."},
            {"name": "Triceps Pushdown",                  "sets": 3, "reps": 12, "rest": 60,  "order": 8, "notes": "Triceps finisher."},
        ]
    },
    {
        "name": "Lower Body",
        "category": "Lower",
        "difficulty": "Intermediate",
        "duration_minutes": 60,
        "description": "Hip and knee dominant lower body movements. Balanced quad, hamstring, and glute development.",
        "cover_image_url": f"{BASE_URL}/Lower%20Body.png",
        "exercises": [
            {"name": "Barbell Squat",        "sets": 4, "reps": 8,  "rest": 180, "order": 1, "notes": "Primary quad and glute builder."},
            {"name": "Romanian Deadlift",    "sets": 4, "reps": 10, "rest": 150, "order": 2, "notes": "Hip hinge for posterior chain."},
            {"name": "Dumbbell Lunges",      "sets": 3, "reps": 12, "rest": 90,  "order": 3, "notes": "Each leg. Unilateral for balance and stability."},
            {"name": "Seated Leg Curl",      "sets": 3, "reps": 12, "rest": 90,  "order": 4, "notes": "Hamstring isolation seated for better stretch."},
            {"name": "Leg Extensions",       "sets": 3, "reps": 15, "rest": 60,  "order": 5, "notes": "VMO and quad isolation."},
            {"name": "Seated Calf Raise",    "sets": 4, "reps": 15, "rest": 60,  "order": 6, "notes": "Soleus focus. Slow and controlled."},
        ]
    },
    {
        "name": "Chest & Triceps",
        "category": "Chest",
        "difficulty": "Intermediate",
        "duration_minutes": 55,
        "description": "Classic bro split chest and triceps session. Compound pressing followed by isolation work for complete chest and triceps development.",
        "cover_image_url": f"{BASE_URL}/Chest%20and%20Triceps.png",
        "exercises": [
            {"name": "Barbell Bench Press - Medium Grip", "sets": 4, "reps": 6,  "rest": 180, "order": 1, "notes": "Heavy compound press. Pause at chest for full ROM."},
            {"name": "Incline Dumbbell Press",            "sets": 3, "reps": 10, "rest": 120, "order": 2, "notes": "Upper chest. 30 degrees is optimal incline angle."},
            {"name": "Decline Dumbbell Bench Press",      "sets": 3, "reps": 10, "rest": 90,  "order": 3, "notes": "Lower chest sweep. Controls the eccentric."},
            {"name": "Cable Crossover",                   "sets": 3, "reps": 15, "rest": 60,  "order": 4, "notes": "Chest isolation and stretch. Squeeze at bottom."},
            {"name": "Close-Grip Barbell Bench Press",    "sets": 3, "reps": 10, "rest": 90,  "order": 5, "notes": "Triceps mass builder. Elbows at 45 degrees."},
            {"name": "EZ-Bar Skullcrusher",               "sets": 3, "reps": 12, "rest": 90,  "order": 6, "notes": "Long head triceps. Lower to forehead."},
            {"name": "Triceps Pushdown - Rope Attachment","sets": 3, "reps": 15, "rest": 60,  "order": 7, "notes": "Finisher. Flare at bottom for full contraction."},
        ]
    },
    {
        "name": "Back & Biceps",
        "category": "Back",
        "difficulty": "Intermediate",
        "duration_minutes": 60,
        "description": "Complete back and biceps session. Compound rows and pulldowns for back thickness and width, followed by dedicated biceps work.",
        "cover_image_url": f"{BASE_URL}/Back%20and%20Biceps.png",
        "exercises": [
            {"name": "Pullups",                  "sets": 4, "reps": 8,  "rest": 180, "order": 1, "notes": "Best lat builder. Add weight when bodyweight is easy."},
            {"name": "Bent Over Barbell Row",    "sets": 4, "reps": 8,  "rest": 150, "order": 2, "notes": "Overhand grip for upper back thickness."},
            {"name": "One-Arm Dumbbell Row",     "sets": 3, "reps": 10, "rest": 90,  "order": 3, "notes": "Unilateral row for mid-back. Drive elbow to hip."},
            {"name": "Wide-Grip Lat Pulldown",   "sets": 3, "reps": 12, "rest": 90,  "order": 4, "notes": "Lat width. Full stretch at top."},
            {"name": "Seated Cable Rows",        "sets": 3, "reps": 12, "rest": 90,  "order": 5, "notes": "Mid back density. Chest tall, no rounding."},
            {"name": "Barbell Curl",             "sets": 3, "reps": 10, "rest": 90,  "order": 6, "notes": "Biceps mass. No swinging."},
            {"name": "Incline Dumbbell Curl",    "sets": 3, "reps": 12, "rest": 60,  "order": 7, "notes": "Long head stretch on incline bench."},
            {"name": "Concentration Curls",      "sets": 2, "reps": 15, "rest": 60,  "order": 8, "notes": "Peak contraction. Slow and controlled."},
        ]
    },
    {
        "name": "Shoulders & Arms",
        "category": "Shoulders",
        "difficulty": "Intermediate",
        "duration_minutes": 55,
        "description": "Dedicated shoulder and arm session. Full delt development with compound pressing and isolation, followed by biceps and triceps superset finishers.",
        "cover_image_url": f"{BASE_URL}/Arms%20and%20Delts.png",
        "exercises": [
            {"name": "Seated Barbell Military Press", "sets": 4, "reps": 8,  "rest": 150, "order": 1, "notes": "Primary overhead press. Bar in front, full lockout."},
            {"name": "Dumbbell Shoulder Press",       "sets": 3, "reps": 10, "rest": 120, "order": 2, "notes": "Unilateral pressing for balanced development."},
            {"name": "Side Lateral Raise",            "sets": 4, "reps": 15, "rest": 60,  "order": 3, "notes": "Medial delt width. Lead with elbows, slight lean."},
            {"name": "Reverse Flyes",                 "sets": 3, "reps": 15, "rest": 60,  "order": 4, "notes": "Rear delt. Bent over, arms arc back."},
            {"name": "Barbell Curl",                  "sets": 3, "reps": 10, "rest": 60,  "order": 5, "notes": "Biceps compound. Supinate at top."},
            {"name": "Hammer Curls",                  "sets": 3, "reps": 12, "rest": 60,  "order": 6, "notes": "Brachialis thickness."},
            {"name": "Triceps Pushdown",              "sets": 3, "reps": 12, "rest": 60,  "order": 7, "notes": "Lateral head focus."},
            {"name": "EZ-Bar Skullcrusher",           "sets": 3, "reps": 10, "rest": 60,  "order": 8, "notes": "Long head finisher."},
        ]
    },
    {
        "name": "Core & Abs",
        "category": "Core",
        "difficulty": "Beginner",
        "duration_minutes": 30,
        "description": "Functional core training targeting all regions of the abdominals and obliques. Anti-rotation, flexion, and rotational movements.",
        "cover_image_url": f"{BASE_URL}/Core%20and%20Abs.png",
        "exercises": [
            {"name": "Plank",              "sets": 3, "reps": 60, "rest": 60, "order": 1, "notes": "Hold for 60 seconds. Brace abs, squeeze glutes, neutral spine."},
            {"name": "Hanging Leg Raise", "sets": 3, "reps": 12, "rest": 90, "order": 2, "notes": "Lower abs. Control the swing, posterior tilt at top."},
            {"name": "Cable Crunch",      "sets": 3, "reps": 15, "rest": 60, "order": 3, "notes": "Weighted ab flexion. Round the spine, don't hip flex."},
            {"name": "Russian Twist",     "sets": 3, "reps": 20, "rest": 60, "order": 4, "notes": "Oblique rotation. Feet off ground for more challenge."},
            {"name": "Ab Roller",         "sets": 3, "reps": 10, "rest": 90, "order": 5, "notes": "Full core anti-extension. Keep hips in line."},
            {"name": "Side Bridge",       "sets": 3, "reps": 45, "rest": 60, "order": 6, "notes": "Hold 45 seconds each side. Lateral core stability."},
        ]
    },
]


async def seed_workouts():
    async with async_session_maker() as db:
        try:
            total_workouts = 0
            total_exercises = 0

            for workout_data in WORKOUTS:
                # Insert workout
                workout_id = uuid4()
                workout_stmt = pg_insert(SeededWorkout).values(
                    id=workout_id,
                    name=workout_data["name"],
                    category=workout_data["category"],
                    difficulty=workout_data["difficulty"],
                    duration_minutes=workout_data["duration_minutes"],
                    description=workout_data["description"],
                    cover_image_url=workout_data["cover_image_url"],
                    is_preset=True,
                    created_by_admin=True,
                ).on_conflict_do_nothing()
                await db.execute(workout_stmt)
                print(f"Created workout: {workout_data['name']}")

                # Look up and insert exercises
                for ex_data in workout_data["exercises"]:
                    # Find the exercise in the library by name
                    result = await db.execute(
                        select(ExerciseLibrary).where(ExerciseLibrary.name == ex_data["name"])
                    )
                    exercise = result.scalars().first()

                    if not exercise:
                        print(f"  WARNING: Exercise not found: {ex_data['name']}")
                        continue

                    ex_stmt = pg_insert(SeededWorkoutExercise).values(
                        id=uuid4(),
                        seeded_workout_id=workout_id,
                        exercise_library_id=exercise.id,
                        name=exercise.name,
                        category=exercise.category,
                        target=exercise.target,
                        sets=ex_data["sets"],
                        reps=ex_data["reps"],
                        rest_period_seconds=ex_data["rest"],
                        order=ex_data["order"],
                        notes=ex_data.get("notes"),
                        gif_url=exercise.gif_url,
                    ).on_conflict_do_nothing()
                    await db.execute(ex_stmt)
                    print(f"  + {exercise.name} ({ex_data['sets']}x{ex_data['reps']})")
                    total_exercises += 1

                total_workouts += 1

            await db.commit()
            print(f"\nDone! Seeded {total_workouts} workouts with {total_exercises} exercises.")

        except Exception as e:
            await db.rollback()
            print(f"Seeding failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(seed_workouts())