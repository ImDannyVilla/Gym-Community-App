from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, workout, users, exercise, workout_log, routine, follow
from typing import List
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables are managed by Alembic migrations, not create_all
    yield

gym_app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
]

gym_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"exp://192\.168\..*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gym_app.include_router(auth.router)
gym_app.include_router(workout.router)
#gym_app.include_router(programs.router)
gym_app.include_router(users.router)
gym_app.include_router(exercise.router)
gym_app.include_router(workout_log.router)
gym_app.include_router(routine.router)
gym_app.include_router(follow.router)

@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}
