from fastapi import Depends
from app.dependencies import get_current_user
from app.models import User
from app.schemas import AIRequest
from fastapi import APIRouter
from app.schemas import ChatRequest, ChatWithProfileRequest
from app.services.ai_service import generate_chat_response, generate_fitness_chat_response

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    General fitness chat endpoint.
    Sends user query to Groq LLM model and returns the response message.
    """
    reply = generate_chat_response(request.message)
    return {
        "reply": reply
    }

@router.post("/fitness-chat")
async def fitness_chat(request: ChatWithProfileRequest):
    """
    Personalized fitness chat endpoint.
    Injects user profile details (age, weight, height, goal, experience)
    into system prompt before fetching response from Groq.
    """
    reply = generate_fitness_chat_response(request.profile, request.message)
    return {
        "reply": reply
    }

@router.post("/ai-chat")
async def ai_chat(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):

    reply = generate_fitness_chat_response(
        current_user,
        request.message
    )

    return {
        "reply": reply
    }
