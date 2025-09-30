"""Schemas for diagnostic test catalogue endpoints."""
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class DiagnosticTest(BaseModel):
    """Client-facing representation of an available diagnostic test."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    testName: str = Field(alias="test_name")
    assayCategory: str = Field(alias="assay_category")
    slug: str


class TestSelectionRequest(BaseModel):
    """Payload describing which tests the user selected."""

    model_config = ConfigDict(populate_by_name=True)

    test_slugs: List[str] = Field(alias="test_slugs", min_length=1)


class TestSelectionResponse(BaseModel):
    """Response containing the user's selected diagnostic tests."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    selectedTests: List[DiagnosticTest] = Field(alias="selected_tests")


class TestSelectionRemovalRequest(BaseModel):
    """Payload describing which tests should be removed from the selection."""

    model_config = ConfigDict(populate_by_name=True)

    test_slugs: List[str] = Field(alias="test_slugs", min_length=1)
