"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ... import crud
from ...database import get_db
from ...models import User
from ...schemas import auth as auth_schemas
from ...schemas import user as user_schemas
from ...core import security
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=auth_schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: user_schemas.UserRegister,
    db: Session = Depends(get_db),
) -> auth_schemas.AuthResponse:
    """Create a new user account and return an access token."""

    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = crud.create_user(db, payload)
    access_token = security.create_access_token(user.id)
    return auth_schemas.AuthResponse(access_token=access_token, user=user)


@router.post("/login", response_model=auth_schemas.AuthResponse)
def login_user(
    payload: auth_schemas.LoginRequest,
    db: Session = Depends(get_db),
) -> auth_schemas.AuthResponse:
    """Authenticate a user using a JSON payload."""

    user = crud.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = security.create_access_token(user.id)
    return auth_schemas.AuthResponse(access_token=token, user=user)


@router.post("/token", response_model=auth_schemas.Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> auth_schemas.Token:
    """OAuth2-compatible token login endpoint for Swagger and third parties."""

    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = security.create_access_token(user.id)
    return auth_schemas.Token(access_token=token)


@router.get("/me", response_model=user_schemas.UserPublic)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Return information about the authenticated user."""

    return current_user
