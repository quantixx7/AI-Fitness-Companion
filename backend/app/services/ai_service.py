from groq import Groq
from app.config import settings
from app.schemas import UserProfile

# Initialize the Groq client
client = Groq(
    api_key=settings.GROQ_API_KEY
)

def build_user_context(profile: UserProfile) -> str:

    return f"""
User Profile

Name: {profile.name}
Age: {profile.age}
Gender: {profile.gender}
Height: {profile.height} cm
Weight: {profile.weight} kg
Goal: {profile.goal}
Activity Level: {profile.activity_level}
Experience: {profile.experience}
Equipment: {profile.equipment}
"""

def generate_chat_response(message: str) -> str:
    """
    Generate general fitness chat response using Groq with Llama 3 model.
    """
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
                "content": message
            }
        ]
    )
    return response.choices[0].message.content

def generate_fitness_chat_response(user, message: str):
    """
    Generate personalized fitness chat response using user profile data.
    """

    context = build_user_context(user)
    system_prompt = f"""
You are AI Fitness Companion.

{context}

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
                "content": message
            }
        ]
    )

    return response.choices[0].message.content

def generate_workout(user, message: str) -> str:

    context = build_user_context(user)

    system_prompt = f"""
You are an expert fitness coach.

{context}

Generate a workout using this exact format:

Workout Name:

Goal:

Duration:

Warm-up:

Exercises:
1.
2.
3.
4.
5.

Cooldown:

Tips:

Only return the workout.
Do not add introductions or unnecessary explanations.
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
                "content": message
            }
        ]
    )

    return response.choices[0].message.content