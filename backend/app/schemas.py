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
    email: str
    password: str
    
class UserUpdate(BaseModel):
    weight: float
    goal: str
    activity_level: str

class ChatRequest(BaseModel):
    message: str

class UserProfile(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    goal: str
    activity_level: str
    experience: str
    equipment: str

class ChatWithProfileRequest(BaseModel):
    profile: UserProfile
    message: str

class UserLogin(BaseModel):
    email: str
    password: str

class AIRequest(BaseModel):
    session_id: int
    message: str


class ChatSessionCreateResponse(BaseModel):
    session_id: int
    title: str


class ChatSessionResponse(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    role: str
    message: str

    class Config:
        from_attributes = True

class RenameChatRequest(BaseModel):
    title: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    age: int
    gender: str
    height: float
    weight: float
    goal: str
    activity_level: str
    experience: str
    equipment: str

    class Config:
        from_attributes = True