"""SQLAlchemy models for the unified backend service."""
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from .database import Base


class User(Base):
    """User model combining authentication and profile details."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(32), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(32), nullable=True)
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    blood_type = Column(String(8), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_conditions = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(32), nullable=True)
    emergency_contact_relationship = Column(String(100), nullable=True)
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(255), nullable=True)
    insurance_group_number = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<User id={self.id} email={self.email!r}>"


class DiagnosticTest(Base):
    """Catalog entry for an available laboratory test."""

    __tablename__ = "diagnostic_tests"

    id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String(255), unique=True, nullable=False)
    assay_category = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<DiagnosticTest id={self.id} slug={self.slug!r}>"


class UserTestSelection(Base):
    """Join table recording which tests a user has selected."""

    __tablename__ = "user_test_selections"
    __table_args__ = (
        UniqueConstraint("user_id", "test_id", name="uq_user_test_selection"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    test_id = Column(
        Integer,
        ForeignKey("diagnostic_tests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return (
            "<UserTestSelection "
            f"user_id={self.user_id} test_id={self.test_id} selected_at={self.selected_at!s}>"
        )
