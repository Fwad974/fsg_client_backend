"""Security helpers for password hashing and JWT handling."""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt import PyJWTError
from fastapi import HTTPException, status
from passlib.context import CryptContext

from ..schemas.auth import TokenPayload
from .config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return ``True`` if the provided password matches the stored hash."""

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash the supplied password using bcrypt."""

    return pwd_context.hash(password)


def create_access_token(subject: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token for the given subject."""

    settings = get_settings()
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)

    expire = datetime.now(tz=timezone.utc) + expires_delta
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> TokenPayload:
    """Decode and validate the provided JWT token."""

    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
    except jwt.ExpiredSignatureError as exc:  # pragma: no cover - library message
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        ) from exc
    except PyJWTError as exc:  # pragma: no cover - library message
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc

    subject = payload.get("sub")
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )
    exp_ts = payload.get("exp")
    if exp_ts is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing expiry",
        )

    return TokenPayload(
        sub=int(subject),
        exp=datetime.fromtimestamp(exp_ts, tz=timezone.utc),
    )
