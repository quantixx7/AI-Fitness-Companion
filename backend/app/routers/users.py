from fastapi.security import OAuth2PasswordRequestForm
from app.dependencies import get_current_user
from app.schemas import UserLogin
from app.services.jwt_service import create_access_token
from app.services.auth_service import verify_password
from fastapi import HTTPException
from app.services.auth_service import hash_password
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import User
from app.schemas import UserCreate, UserUpdate


router = APIRouter()

@router.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
      raise HTTPException(
        status_code=409,
        detail="Email already registered"
    )
    

    hashed_password = hash_password(user.password)
    new_user = User(
        name=user.name,
        age=user.age,
        gender=user.gender,
        height=user.height,
        weight=user.weight,
        goal=user.goal,
        email=user.email,
        activity_level=user.activity_level,
        experience=user.experience,
        equipment=user.equipment,
        password_hash=hashed_password   
        
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user_id": new_user.id
    }

@router.get("/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    updated_user: UserUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"message": "User not found"}

    user.weight = updated_user.weight
    user.goal = updated_user.goal
    user.activity_level = updated_user.activity_level

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": user
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"message": "User not found"}

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "user_id": db_user.id,
            "email": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }