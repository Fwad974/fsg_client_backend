"""Pydantic schemas for authentication flows."""
from datetime import datetime

from pydantic import BaseModel, EmailStr

from .user import UserPublic


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserPublic


class TokenPayload(BaseModel):
    sub: int
    exp: datetime
