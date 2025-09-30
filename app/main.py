"""FastAPI application combining authentication and user profile endpoints."""
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import auth as auth_routes
from .api.routes import tests as test_routes
from .api.routes import users as user_routes
from .core.catalog import CatalogueLoadError, load_diagnostic_test_catalogue
from .core.config import get_settings
from .database import Base, SessionLocal, engine
from . import crud

settings = get_settings()

# Create database tables on startup. In production you'd use migrations.
Base.metadata.create_all(bind=engine)

# Seed static catalogues that do not have dedicated migrations.
try:
    diagnostic_tests = load_diagnostic_test_catalogue(
        settings.diagnostic_tests_file
    )
    print(diagnostic_tests, settings.diagnostic_tests_file)
except CatalogueLoadError as exc:  # pragma: no cover - startup validation
    raise RuntimeError(str(exc)) from exc

with SessionLocal() as session:
    crud.ensure_default_diagnostic_tests(session, diagnostic_tests)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(test_routes.router)


@app.get("/")
def root() -> Dict[str, str]:
    """Simple root endpoint used for smoke testing."""

    return {"status": "ok", "service": settings.app_name}


@app.get("/health")
def health() -> Dict[str, str]:
    """Health check endpoint used by container probes."""

    return {"status": "healthy"}
