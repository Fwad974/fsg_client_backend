"""User profile management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import crud
from ...database import get_db
from ...models import User
from ...schemas import user as user_schemas
from ..deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=user_schemas.UserPublic)
def read_profile(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""

    return current_user


@router.put("/profile", response_model=user_schemas.UserPublic)
def update_profile(
    payload: user_schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Update profile details for the authenticated user."""

    if payload.email and payload.email != current_user.email:
        if crud.get_user_by_email(db, payload.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

    updated_user = crud.update_user(db, current_user, payload)
    return updated_user
