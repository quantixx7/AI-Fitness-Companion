from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
)



from sqlalchemy.orm import relationship
from sqlalchemy.orm import DeclarativeBase



class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False, index=True)

    password_hash = Column(String, nullable=False)

    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    goal = Column(String, nullable=False)
    activity_level = Column(String, nullable=False)
    experience = Column(String, nullable=False)
    equipment = Column(String, nullable=False)

    messages = relationship(
    "ChatMessage",
    back_populates="user",
    cascade="all, delete"
    )

    sessions = relationship(
    "ChatSession",
    back_populates="user",
    cascade="all, delete"
    )

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String, nullable=False)      # "user" or "assistant"

    message = Column(Text, nullable=False)

    session_id = Column(
    Integer,
    ForeignKey("chat_sessions.id")
    )

    session = relationship(
    "ChatSession",
    back_populates="messages"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User", back_populates="messages")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String, default="New Chat")

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User", back_populates="sessions")

    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete"
    )