from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    goal: str
    activity_level: str
    experience: str
    equipment: str
    
class UserUpdate(BaseModel):
    weight: float
    goal: str
    activity_level: str