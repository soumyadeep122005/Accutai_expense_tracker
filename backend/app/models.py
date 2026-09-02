from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean,
    Float, Numeric, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
    total_budget = Column(Float, default=0.0, nullable=False)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    custom_categories = relationship("Category", back_populates="user")
    monthly_summaries = relationship("MonthlySummary", back_populates="user")

class Category(Base):
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(Text, nullable=False)
    is_custom = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    user = relationship("User", back_populates="custom_categories")
    transactions = relationship("Transaction", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(Text, nullable=False)  # 'income' or 'expense'
    description = Column(Text, nullable=True)
    receipt_url = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    category_id = Column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

class MonthlySummary(Base):
    __tablename__ = "monthly_summaries"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    total_income = Column(Numeric(12, 2), default=0.0)
    total_expense = Column(Numeric(12, 2), default=0.0)
    balance = Column(Numeric(12, 2), default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="monthly_summaries")

class SharedBudget(Base):
    """
    Persisted shared company budget so that all authenticated employees
    see the exact same monthly budget target set by administration.
    """
    __tablename__ = "shared_budget"

    id = Column(Integer, primary_key=True, default=1)
    target_budget = Column(Float, nullable=False, default=50000.0)
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    updated_by_email = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
