from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database module to trigger table creation on startup
import app.database 
from app.routers import users, chat, health

# Initialize the FastAPI application with metadata
app = FastAPI(
    title="AI Fitness Companion API",
    description="Backend API for the AI Fitness Companion application.",
    version="1.0.0",
)

# Set up CORS middleware to allow requests from frontend applications.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints from routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(chat.router)
