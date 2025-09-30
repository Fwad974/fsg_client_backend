"""CRUD helpers for the unified backend service."""
from typing import Iterable, List, Mapping, Optional, Sequence, Set

from sqlalchemy.orm import Session

from . import models
from .core import security
from .schemas import user as user_schemas

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    normalized_email = email.lower()
    return db.query(models.User).filter(models.User.email == normalized_email).first()


def create_user(db: Session, payload: user_schemas.UserRegister) -> models.User:
    user = models.User(
        email=payload.email.lower(),
        hashed_password=security.get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not security.verify_password(password, user.hashed_password):
        return None
    return user


def update_user(
    db: Session,
    user: models.User,
    payload: user_schemas.UserUpdate,
) -> models.User:
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        user.hashed_password = security.get_password_hash(data.pop("password"))
    if "email" in data and data["email"] is not None:
        data["email"] = data["email"].lower()
    for field, value in data.items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_diagnostic_tests(db: Session) -> List[models.DiagnosticTest]:
    """Return all diagnostic tests ordered by name."""

    return db.query(models.DiagnosticTest).order_by(models.DiagnosticTest.test_name).all()


def ensure_default_diagnostic_tests(
    db: Session, entries: Optional[Iterable[Mapping[str, str]]]
) -> None:
    """Populate the diagnostic test table with catalogue entries if provided."""

    if not entries:
        return

    existing_slugs = {
        slug for (slug,) in db.query(models.DiagnosticTest.slug).all()
    }
    created = False

    for entry in entries:
        slug = entry.get("slug")
        if slug in existing_slugs:
            continue
        db.add(models.DiagnosticTest(**entry))
        created = True

    if created:
        db.commit()


def get_tests_by_slugs(db: Session, slugs: Sequence[str]) -> List[models.DiagnosticTest]:
    """Return diagnostic tests matching the provided slugs."""

    if not slugs:
        return []

    return (
        db.query(models.DiagnosticTest)
        .filter(models.DiagnosticTest.slug.in_(slugs))
        .all()
    )


def add_tests_for_user(db: Session, user_id: int, test_ids: Sequence[int]) -> None:
    """Persist user/test selections, ignoring duplicates."""

    if not test_ids:
        return

    unique_test_ids = set(test_ids)
    existing: Set[int] = {
        test_id
        for (test_id,) in db.query(models.UserTestSelection.test_id)
        .filter(
            models.UserTestSelection.user_id == user_id,
            models.UserTestSelection.test_id.in_(unique_test_ids),
        )
        .all()
    }

    created = False
    for test_id in unique_test_ids:
        if test_id in existing:
            continue
        db.add(models.UserTestSelection(user_id=user_id, test_id=test_id))
        created = True

    if created:
        db.commit()


def list_user_selected_tests(db: Session, user_id: int) -> List[models.DiagnosticTest]:
    """Return diagnostic tests selected by the given user."""

    return (
        db.query(models.DiagnosticTest)
        .join(
            models.UserTestSelection,
            models.UserTestSelection.test_id == models.DiagnosticTest.id,
        )
        .filter(models.UserTestSelection.user_id == user_id)
        .order_by(models.DiagnosticTest.test_name)
        .all()
    )


def remove_all_tests_for_user(db: Session, user_id: int) -> None:
    """Delete every diagnostic test selection for the given user."""

    deleted = (
        db.query(models.UserTestSelection)
        .filter(models.UserTestSelection.user_id == user_id)
        .delete(synchronize_session=False)
    )
    if deleted:
        db.commit()


def remove_tests_for_user(db: Session, user_id: int, test_ids: Sequence[int]) -> None:
    """Delete the specified diagnostic test selections for the given user."""

    if not test_ids:
        return

    deleted = (
        db.query(models.UserTestSelection)
        .filter(
            models.UserTestSelection.user_id == user_id,
            models.UserTestSelection.test_id.in_(set(test_ids)),
        )
        .delete(synchronize_session=False)
    )
    if deleted:
        db.commit()
