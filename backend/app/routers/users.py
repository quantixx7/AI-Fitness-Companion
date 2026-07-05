from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import User
from app.schemas import UserCreate, UserUpdate

router = APIRouter()

@router.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        name=user.name,
        age=user.age,
        gender=user.gender,
        height=user.height,
        weight=user.weight,
        goal=user.goal,
        activity_level=user.activity_level,
        experience=user.experience,
        equipment=user.equipment
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
    