from groq import Groq

from app.config import settings
from app.models import ChatMessage, User
from app.schemas import UserProfile

# Initialize the Groq client
client = Groq(api_key=settings.GROQ_API_KEY)


def build_user_context(profile: UserProfile | User) -> str:
    """
    Constructs a formatted context string containing the user's fitness profile.
    """
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


def ask_llama(system_prompt: str, user_message: str) -> str:
    """
    Sends a system prompt and user message to the Groq LLM API.
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
                "content": user_message
            }
        ]
    )
    return response.choices[0].message.content


def generate_chat_response(message: str) -> str:
    """
    Generate general fitness chat response using Groq with Llama 3 model.
    """
    system_prompt = """
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
    return ask_llama(system_prompt, message)


def generate_fitness_chat_response(
    user: UserProfile | User,
    message: str,
    history: list[ChatMessage] | None = None
) -> str:
    """
    Generate personalized fitness chat response using user profile data and chat history.
    """
    context = build_user_context(user)
    history_text = ""

    if history:
        history_text = "\n".join(
            [
                f"{msg.role}: {msg.message}"
                for msg in reversed(history)
            ]
        )

    system_prompt = f"""
You are AI Fitness Companion.

{context}

Previous Conversation:
{history_text}

Rules:
- Give scientifically accurate fitness advice.
- Personalize every response.
- Never ignore the user's profile.
- Use the previous conversation when answering.
- If information is missing, ask follow-up questions.
"""
    return ask_llama(system_prompt, message)


def generate_workout(user: UserProfile | User, message: str) -> str:
    """
    Generates a personalized workout plan for the user in a strict output format.
    """
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
    return ask_llama(system_prompt, message)


def generate_diet(user: UserProfile | User, message: str) -> str:
    """
    Generates a personalized diet plan for the user in a strict output format.
    """
    context = build_user_context(user)

    system_prompt = f"""
You are an expert nutritionist.

{context}

Generate a diet plan in this exact format:

Daily Calories:

Protein:

Carbohydrates:

Fats:

Breakfast:

Morning Snack:

Lunch:

Evening Snack:

Dinner:

Hydration:

Notes:

Only return the diet plan.
"""
    return ask_llama(system_prompt, message)