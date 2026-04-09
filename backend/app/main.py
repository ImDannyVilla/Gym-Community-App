from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .db import engine, Base
from app.routes import auth
from app.routes import workout
from app.routes import programs
from app.routes import users
from typing import List
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

gym_app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
    "exp://192.168.*.*:8081",
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
gym_app.include_router(programs.router)
gym_app.include_router(users.router)

@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}
