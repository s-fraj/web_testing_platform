from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: datetime
    class Config: from_attributes = True

class AdminUserOut(UserOut):
    is_banned: bool
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ScanCreate(BaseModel):
    target_url: str

class ScanOut(BaseModel):
    id: int
    target_url: str
    status: str
    risk_score: int
    created_at: datetime
    finished_at: Optional[datetime]
    class Config: from_attributes = True

class ScanDetailOut(ScanOut):
    results: Optional[Any]
    class Config: from_attributes = True
