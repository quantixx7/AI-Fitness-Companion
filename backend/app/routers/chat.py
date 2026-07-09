from app.chat_crud import get_session_messages
from app.schemas import ChatMessageResponse
from app.chat_crud import update_session_title
from app.chat_crud import get_chat_sessions
from app.schemas import ChatSessionResponse
from app.chat_crud import create_chat_session
from app.schemas import ChatSessionResponse
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.chat_crud import save_message, get_recent_messages
from app.services.ai_service import generate_diet
from app.services.ai_service import generate_workout
from fastapi import Depends
from app.dependencies import get_current_user
from app.models import User
from app.schemas import AIRequest
from fastapi import APIRouter
from app.schemas import ChatRequest, ChatWithProfileRequest
from app.services.ai_service import generate_chat_response, generate_fitness_chat_response

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

@router.post("/chat-session", response_model=ChatSessionResponse)
async def new_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    session = create_chat_session(
        db=db,
        user_id=current_user.id
    )

    return {
        "session_id": session.id,
        "title": session.title
    }

@router.post("/ai-chat")
async def ai_chat(
    request: AIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    save_message(
    db=db,
    user_id=current_user.id,
    session_id=request.session_id,
    role="user",
    message=request.message
)

    history = get_recent_messages(
    db=db,
    user_id=current_user.id,
    session_id=request.session_id
)

    print(history)

    reply = generate_fitness_chat_response(
    current_user,
    request.message,
    history
)
    save_message(
    db=db,
    user_id=current_user.id,
    session_id=request.session_id,
    role="assistant",
    message=reply
)
    update_session_title(
    db=db,
    session_id=request.session_id,
    title=request.message
)

    return {
        "reply": reply
    }

@router.post("/workout")
async def workout(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):

    reply = generate_workout(
        current_user,
        request.message
    )

    return {
        "reply": reply
    }

@router.post("/diet")
async def diet(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    reply = generate_diet(current_user, request.message)

    return {
        "reply": reply
    }

@router.get(
    "/chat-sessions",
    response_model=list[ChatSessionResponse]
)
async def chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_chat_sessions(
        db=db,
        user_id=current_user.id
    )

@router.get(
    "/chat-session/{session_id}",
    response_model=list[ChatMessageResponse]
)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_session_messages(
        db=db,
        session_id=session_id,
        user_id=current_user.id
    )