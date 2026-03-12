import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .db import engine, Base
from app.routes import auth
from app.routes import workout
from typing import List
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the server starts
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield # This tells FastAPI to keep running

gym_app = FastAPI(lifespan=lifespan)

# For mobile development (React Native), allow all origins by default.
# React Native fetch calls from iOS/Android emulators behave differently than web browsers
# and often lack a standard Origin header, causing silent network request failures.
gym_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for mobile development
    allow_credentials=True, # Will allow to send JWT tokens
    allow_methods=["*"],
    allow_headers=["*"],
)

gym_app.include_router(auth.router)
gym_app.include_router(workout.router)

@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}