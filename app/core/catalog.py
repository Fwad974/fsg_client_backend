"""Helpers for loading static catalogue data from disk."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Mapping, Optional, Tuple


class CatalogueLoadError(RuntimeError):
    """Raised when a diagnostic test catalogue cannot be parsed."""


def _coerce_string(value: object, field_name: str) -> str:
    if not isinstance(value, str):
        raise CatalogueLoadError(
            f"Expected '{field_name}' to be a string, received {type(value)!r}."
        )
    text = value.strip()
    if not text:
        raise CatalogueLoadError(f"Field '{field_name}' cannot be blank.")
    return text


def _extract_field(entry: Mapping[str, object], *candidate_keys: str) -> str:
    for key in candidate_keys:
        if key in entry:
            return _coerce_string(entry[key], key)
    raise CatalogueLoadError(
        "Missing one of the required keys: " + ", ".join(candidate_keys)
    )


def load_diagnostic_test_catalogue(path: Optional[str]) -> Tuple[Dict[str, str], ...]:
    """Return diagnostic test definitions from a JSON file.

    Parameters
    ----------
    path:
        Filesystem path to a JSON file that contains a list of diagnostic tests.
        Each entry must provide `test_name`/`testName`, `assay_category`/
        `assayCategory`, and `slug` string fields. If ``None`` or an empty string
        is supplied the function returns an empty tuple, allowing callers to skip
        seeding catalogue data entirely.
    """

    if not path:
        return ()

    file_path = Path(path)
    if not file_path.exists():
        raise CatalogueLoadError(
            f"Diagnostic tests file not found: {file_path.as_posix()}"
        )

    try:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        print("aaaa   ",payload)
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        raise CatalogueLoadError(
            f"Unable to parse diagnostic tests JSON: {exc.msg}"
        ) from exc

    if not isinstance(payload, list):
        raise CatalogueLoadError("Diagnostic tests JSON must be an array of objects.")

    normalised: List[Dict[str, str]] = []

    for raw_entry in payload:
        if not isinstance(raw_entry, Mapping):
            raise CatalogueLoadError("Each diagnostic test must be an object.")

        entry = {
            "test_name": _extract_field(raw_entry, "test_name", "testName"),
            "assay_category": _extract_field(
                raw_entry, "assay_category", "assayCategory"
            ),
            "slug": _extract_field(raw_entry, "slug"),
        }

        normalised.append(entry)

    return tuple(normalised)
