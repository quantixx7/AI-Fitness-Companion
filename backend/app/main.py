from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI application with metadata
app = FastAPI(
    title="AI Fitness Companion API",
    description="Backend API for the AI Fitness Companion application.",
    version="1.0.0",
)

# Set up CORS middleware to allow requests from frontend applications.
# In production, you would configure this to use specific origins from environment variables.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)


@app.get("/", tags=["Root"])
async def read_root() -> dict[str, str]:
    """
    Root endpoint that returns a welcome message.
    
    Returns:
        dict: A dictionary containing the welcome message.
    """
    return {"message": "Welcome to AI Fitness Companion API"}
