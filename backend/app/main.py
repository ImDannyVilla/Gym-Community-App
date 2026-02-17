import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .routes import auth
from .db import engine, Base
from app.routes import auth
from typing import List

class Item(BaseModel):
    name: str

class User(BaseModel):
    name: str
    email: str

app = FastAPI()

origins = [
    "http://localhost:3000" #frontend server should be here
    "http://localhost:8081",  # React Native Metro bundler
    "http://localhost:19006",  # Expo web
    "exp://192.168.*.*:8081",  # Expo on physical device
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, #allows the origins
    allow_credentials=True, #Will allow to send JWT tokens
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)