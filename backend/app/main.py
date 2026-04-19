from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, workout, users
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
    "exp://192.168.*.*:8081",
    "exp://192.168.*.*:8082",
]

gym_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gym_app.include_router(auth.router)
gym_app.include_router(workout.router)
#gym_app.include_router(programs.router)
gym_app.include_router(users.router)

@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}
