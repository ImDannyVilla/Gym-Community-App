import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .db import engine, Base
from app.routes import auth
from typing import List
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the server starts
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield # This tells FastAPI to keep running

gym_app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000", #frontend server should be here
    "http://localhost:8081",  # React Native Metro bundler
    "http://localhost:19006",  # Expo web
    "exp://192.168.*.*:8081",  # Expo on physical device
]

gym_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, #allows the origins
    allow_credentials=True, #Will allow to send JWT tokens
    allow_methods=["*"],
    allow_headers=["*"],
)

gym_app.include_router(auth.router)

@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}