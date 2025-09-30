"""Endpoints exposing the diagnostic test catalogue."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import crud
from ...database import get_db
from ...schemas import test as test_schemas
from ...models import User
from ..deps import get_current_user

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/", response_model=List[test_schemas.DiagnosticTest])
def list_available_tests(
    db: Session = Depends(get_db),
) -> List[test_schemas.DiagnosticTest]:
    """Return the available diagnostic tests from the catalogue."""

    tests = crud.get_diagnostic_tests(db)
    return list(tests)


@router.get("/selections", response_model=test_schemas.TestSelectionResponse)
def list_selected_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> test_schemas.TestSelectionResponse:
    """Return the diagnostic tests the current user has selected."""

    selected = crud.list_user_selected_tests(db, current_user.id)
    return test_schemas.TestSelectionResponse(selected_tests=selected)


@router.post(
    "/selections",
    response_model=test_schemas.TestSelectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_test_selections(
    payload: test_schemas.TestSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> test_schemas.TestSelectionResponse:
    """Persist the diagnostic tests chosen by the authenticated user."""

    normalized_slugs = [slug.strip().lower() for slug in payload.test_slugs if slug.strip()]
    if not normalized_slugs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid test slugs were provided",
        )

    unique_slugs = list(dict.fromkeys(normalized_slugs))
    tests = crud.get_tests_by_slugs(db, unique_slugs)
    found_slugs = {test.slug for test in tests}
    missing = sorted(set(unique_slugs) - found_slugs)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"missing_slugs": missing},
        )

    crud.add_tests_for_user(db, current_user.id, [test.id for test in tests])
    selected = crud.list_user_selected_tests(db, current_user.id)
    return test_schemas.TestSelectionResponse(selected_tests=selected)


@router.delete("/selections", response_model=test_schemas.TestSelectionResponse)
def reset_test_selections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> test_schemas.TestSelectionResponse:
    """Remove every diagnostic test the authenticated user has selected."""

    crud.remove_all_tests_for_user(db, current_user.id)
    selected = crud.list_user_selected_tests(db, current_user.id)
    return test_schemas.TestSelectionResponse(selected_tests=selected)


@router.delete(
    "/selections/by-slug",
    response_model=test_schemas.TestSelectionResponse,
)
def delete_specific_test_selections(
    payload: test_schemas.TestSelectionRemovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> test_schemas.TestSelectionResponse:
    """Remove a subset of the authenticated user's selected diagnostic tests."""

    normalized_slugs = [slug.strip().lower() for slug in payload.test_slugs if slug.strip()]
    if not normalized_slugs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid test slugs were provided",
        )

    unique_slugs = list(dict.fromkeys(normalized_slugs))
    tests = crud.get_tests_by_slugs(db, unique_slugs)
    found_slugs = {test.slug for test in tests}
    missing = sorted(set(unique_slugs) - found_slugs)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"missing_slugs": missing},
        )

    crud.remove_tests_for_user(db, current_user.id, [test.id for test in tests])
    selected = crud.list_user_selected_tests(db, current_user.id)
    return test_schemas.TestSelectionResponse(selected_tests=selected)
