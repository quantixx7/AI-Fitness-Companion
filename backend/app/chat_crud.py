from sqlalchemy.orm import Session
from app.models import ChatMessage, ChatSession


def save_message(
    db: Session, user_id: int, session_id: int, role: str, message: str
) -> ChatMessage:
    """
    Saves a new chat message to the database.
    """
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


def get_recent_messages(
    db: Session, user_id: int, session_id: int
) -> list[ChatMessage]:
    """
    Retrieves the 10 most recent chat messages in a session.
    """
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


def create_chat_session(db: Session, user_id: int) -> ChatSession:
    """
    Creates a new chat session for a user.
    """
    session = ChatSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_chat_session(db: Session, session_id: int) -> ChatSession | None:
    """
    Retrieves a chat session by its ID.
    """
    return (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )


def get_chat_sessions(db: Session, user_id: int) -> list[ChatSession]:
    """
    Retrieves all chat sessions for a user, ordered by creation date descending.
    """
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


def update_session_title(db: Session, session_id: int, title: str) -> None:
    """
    Updates the chat session title if it is currently set to the default 'New Chat'.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )
    if session and session.title == "New Chat":
        session.title = title[:40]
        db.commit()


def get_session_messages(
    db: Session, session_id: int, user_id: int
) -> list[ChatMessage]:
    """
    Retrieves all messages for a specific chat session ordered by creation date ascending.
    """
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id,
            ChatMessage.user_id == user_id
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def delete_chat_session(db: Session, session_id: int, user_id: int) -> bool:
    """
    Deletes a chat session for a user. Returns True if successful, False otherwise.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        .first()
    )
    if not session:
        return False

    db.delete(session)
    db.commit()
    return True


def rename_chat_session(
    db: Session, session_id: int, user_id: int, title: str
) -> ChatSession | None:
    """
    Renames the title of a chat session. Returns the session if successful, None otherwise.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        .first()
    )
    if not session:
        return None

    session.title = title
    db.commit()
    db.refresh(session)
    return session