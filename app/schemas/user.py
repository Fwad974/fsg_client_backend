"""Pydantic schemas for user operations."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class ProfileDetails(BaseModel):
    """Optional demographic and medical profile fields."""

    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=32)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=32)
    address_line1: Optional[str] = Field(default=None, max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: Optional[str] = Field(default=None, max_length=100)
    blood_type: Optional[str] = Field(default=None, max_length=8)
    allergies: Optional[str] = Field(default=None, max_length=1000)
    medical_conditions: Optional[str] = Field(default=None, max_length=1000)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=32)
    emergency_contact_relationship: Optional[str] = Field(default=None, max_length=100)
    insurance_provider: Optional[str] = Field(default=None, max_length=255)
    insurance_policy_number: Optional[str] = Field(default=None, max_length=255)
    insurance_group_number: Optional[str] = Field(default=None, max_length=255)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        digits = [char for char in value if char.isdigit()]
        if not digits:
            raise ValueError("Phone number must include digits")
        return value

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        digits = [char for char in value if char.isdigit()]
        if not digits:
            raise ValueError("Emergency contact phone must include digits")
        return value


class UserRegister(BaseModel):
    """Payload accepted during account registration."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, value: str) -> str:
        if value.isdigit() or value.isalpha():
            raise ValueError("Password must contain both letters and numbers")
        return value

    class Config:
        extra = "forbid"


class UserUpdate(ProfileDetails):
    """Profile mutation payload for authenticated users."""

    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value.isdigit() or value.isalpha():
            raise ValueError("Password must contain both letters and numbers")
        return value

    class Config:
        extra = "forbid"


class UserPublic(ProfileDetails):
    """Representation returned to API clients."""

    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
