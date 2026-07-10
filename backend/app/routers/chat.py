from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import chat_crud
from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import (
    AIRequest,
    ChatMessageResponse,
    ChatRequest,
    ChatSessionCreateResponse,
    ChatSessionResponse,
    ChatWithProfileRequest,
    RenameChatRequest,
)
from app.services import ai_service

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    General fitness chat endpoint.
    Sends user query to Groq LLM model and returns the response message.
    """
    reply = ai_service.generate_chat_response(request.message)
    return {"reply": reply}


@router.post("/fitness-chat")
async def fitness_chat(request: ChatWithProfileRequest):
    """
    Personalized fitness chat endpoint.
    Injects user profile details (age, weight, height, goal, experience)
    into system prompt before fetching response from Groq.
    """
    reply = ai_service.generate_fitness_chat_response(request.profile, request.message)
    return {"reply": reply}


@router.post("/chat-session", response_model=ChatSessionCreateResponse)
async def new_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new chat session for the current authenticated user.
    """
    session = chat_crud.create_chat_session(
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
    """
    Personalized chat with memory. Saves user query, retrieves context history,
    calls AI, saves response, updates chat title, and returns the AI reply.
    """
    chat_crud.save_message(
        db=db,
        user_id=current_user.id,
        session_id=request.session_id,
        role="user",
        message=request.message
    )

    history = chat_crud.get_recent_messages(
        db=db,
        user_id=current_user.id,
        session_id=request.session_id
    )

    reply = ai_service.generate_fitness_chat_response(
        current_user,
        request.message,
        history
    )

    chat_crud.save_message(
        db=db,
        user_id=current_user.id,
        session_id=request.session_id,
        role="assistant",
        message=reply
    )

    chat_crud.update_session_title(
        db=db,
        session_id=request.session_id,
        title=request.message
    )

    return {"reply": reply}


@router.post("/workout")
async def workout(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized workout plan using the LLM.
    """
    reply = ai_service.generate_workout(
        current_user,
        request.message
    )
    return {"reply": reply}


@router.post("/diet")
async def diet(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized diet plan using the LLM.
    """
    reply = ai_service.generate_diet(
        current_user,
        request.message
    )
    return {"reply": reply}


@router.get(
    "/chat-sessions",
    response_model=list[ChatSessionResponse]
)
async def chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all chat sessions for the current authenticated user.
    """
    return chat_crud.get_chat_sessions(
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
    """
    Retrieves all messages in a specific chat session for the user.
    """
    return chat_crud.get_session_messages(
        db=db,
        session_id=session_id,
        user_id=current_user.id
    )


@router.delete("/chat-session/{session_id}")
async def delete_chat(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a specific chat session.
    """
    success = chat_crud.delete_chat_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id
    )

    if not success:
        return {"message": "Chat not found."}

    return {"message": "Chat deleted successfully."}


@router.patch("/chat-session/{session_id}")
async def rename_chat(
    session_id: int,
    request: RenameChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renames a specific chat session's title.
    """
    session = chat_crud.rename_chat_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        title=request.title
    )

    if not session:
        return {"message": "Chat not found."}

    return {
        "message": "Chat renamed successfully.",
        "title": session.title
    }