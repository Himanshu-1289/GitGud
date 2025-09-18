"""
This is the main entry point for the FastAPI application.

It sets up the database connection, middleware, and API routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from Auth.routes import auth_router
from Agent import agent_router
from Database.routes import db_router
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def db_lifespan(app: FastAPI):
    """
    Manage the lifespan of the database connection.

    Args:
        app (FastAPI): The FastAPI application instance.

    Yields:
        None
    """
    load_dotenv()
    try:
        MONGO_DB_USERNAME = os.getenv("MONGO_DB_USERNAME")
        MONGO_DB_PASSWORD = os.getenv("MONGO_DB_PASSWORD")
        uri = f"mongodb+srv://{MONGO_DB_USERNAME}:{MONGO_DB_PASSWORD}@cluster0.and0a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        app.mongodb_client = AsyncIOMotorClient(uri)
        app.database = app.mongodb_client["GitGud"]
        ping_response = await app.database.command("ping")
        if int(ping_response["ok"]) != 1:
            raise Exception("Problem connecting to database cluster.")
        else:
            print("✅ Connected to the database cluster.")
    except Exception as e:
        print(e)

    yield

    app.mongodb_client.close()

app: FastAPI = FastAPI(lifespan=db_lifespan,debug=True)
app.include_router(router=auth_router)
app.include_router(router=db_router)
app.include_router(router=agent_router)

origins = [
    "https://git-gud-one.vercel.app",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)