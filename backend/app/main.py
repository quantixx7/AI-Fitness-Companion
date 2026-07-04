from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os
import app.database 
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserCreate


# Initialize the FastAPI application with metadata
app = FastAPI(
    title="AI Fitness Companion API",
    description="Backend API for the AI Fitness Companion application.",
    version="1.0.0",
)

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

class ChatRequest(BaseModel):
    message: str

class UserProfile(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    goal: str
    activity_level: str
    experience: str
    equipment: str

class ChatWithProfileRequest(BaseModel):
    profile: UserProfile
    message: str

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
    return {"message": "Welcome to AI Fitness Companion API"}

@app.get("/about")
async def about():
    return {"message": "About AI Fitness Companion"}

@app.get("/project")
async def project():
    return {
        "name": "AI Fitness Companion",
        "version": "1.0.0",
        "developer": "Anoop Sankar",
        "ai_model": "Llama 3 via Groq"
    }
@app.get("/bmi")
async def calculate_bmi(height: float, weight: float):
    bmi = weight / ((height / 100) ** 2)

    return {
        "height": height,
        "weight": weight,
        "bmi": round(bmi, 2)
    }

@app.post("/chat")
async def chat(request: ChatRequest):

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
    {
        "role": "system",
        "content": """
You are AI Fitness Companion.

Rules:
- You are an expert fitness coach.
- Recommend scientifically sound workouts.
- Recommend balanced nutrition.
- Never promote dangerous advice.
- Be motivational and professional.
- Keep answers clear and well structured.
- If information is missing, ask follow-up questions before giving a plan.
"""
    },
    {
        "role": "user",
        "content": request.message
    }
]
    )

    return {
        "reply": response.choices[0].message.content
    }

@app.post("/fitness-chat")
async def fitness_chat(request: ChatWithProfileRequest):

    system_prompt = f"""
You are AI Fitness Companion.

User Profile:
Name: {request.profile.name}
Age: {request.profile.age}
Gender: {request.profile.gender}
Height: {request.profile.height} cm
Weight: {request.profile.weight} kg
Goal: {request.profile.goal}
Activity Level: {request.profile.activity_level}
Experience: {request.profile.experience}
Equipment: {request.profile.equipment}

Rules:
- Give scientifically accurate fitness advice.
- Personalize every response.
- Never ignore the user's profile.
- If information is missing, ask follow-up questions.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": request.message
            }
        ]
    )

    return {
        "reply": response.choices[0].message.content
    }

@app.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        name=user.name,
        age=user.age,
        gender=user.gender,
        height=user.height,
        weight=user.weight,
        goal=user.goal,
        activity_level=user.activity_level,
        experience=user.experience,
        equipment=user.equipment
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user_id": new_user.id
    }

@app.get("/users")
async def get_users(db: Session = Depends(get_db)):

    users = db.query(User).all()

    return users
    """
    Root endpoint that returns a welcome message.
    
    Returns:
        dict: A dictionary containing the welcome message.
    """
    return {"message": "Welcome to AI Fitness Companion API"}
