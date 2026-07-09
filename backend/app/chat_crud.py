from sqlalchemy.orm import Session
from app.models import ChatMessage
from app.models import ChatSession


def save_message(db, user_id, session_id, role, message):

    chat = ChatMessage(
    user_id=user_id,
    session_id=session_id,
    role=role,
    message=message
  )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat


def get_recent_messages(db, user_id, session_id):
    return (
    db.query(ChatMessage)
    .filter(
        ChatMessage.user_id == user_id,
        ChatMessage.session_id == session_id
    )
    .order_by(ChatMessage.created_at.desc())
    .limit(10)
    .all()
)

from app.models import ChatSession


def create_chat_session(db, user_id: int):

    session = ChatSession(
        user_id=user_id
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_chat_session(db, session_id: int):

    return (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )

def get_chat_sessions(db, user_id: int):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

def update_session_title(db, session_id: int, title: str):

    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )

    if session and session.title == "New Chat":
        session.title = title[:40]
        db.commit()

def get_session_messages(db, session_id: int, user_id: int):

    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id,
            ChatMessage.user_id == user_id
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )