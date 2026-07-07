from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.services.jwt_service import verify_access_token
from app.models import User
from typing import Generator
from sqlalchemy.orm import Session
from app.database import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency generator.
    Yields a database session and ensures it is closed after request lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = verify_access_token(token)

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
