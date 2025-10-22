from pydantic import BaseModel, EmailStr
from typing import Optional


class SessionIn(BaseModel):
    """Schema for login mock request body - accepts email or track"""
    email: Optional[EmailStr] = None
    track: Optional[str] = None


class ProfileOut(BaseModel):
    """Schema for user data returned by API"""
    id: int
    name: str
    email: str

