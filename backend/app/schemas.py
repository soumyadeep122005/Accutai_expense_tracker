from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

# ----------------- Auth Schemas -----------------

class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=4)

    @field_validator("email")
    @classmethod
    def validate_accutai_email(cls, v: str) -> str:
        domain = v.split("@")[-1].lower()
        if domain != "accutai.com":
            raise ValueError("Registration is restricted to @accutai.com corporate accounts.")
        return v.lower()

class UserLogin(BaseModel):
    username: str  # Can be email or username
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    total_budget: float

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# ----------------- Category Schemas -----------------

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_custom: bool
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

# ----------------- Transaction Schemas -----------------

class TransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    date: datetime
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    date: Optional[datetime] = None
    category_id: Optional[int] = None

class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

# ----------------- Budget Schemas -----------------

class BudgetUpdate(BaseModel):
    total_budget: float = Field(..., ge=0)

class BudgetResponse(BaseModel):
    total_budget: float
    total_spent: float
    total_income: float
    remaining_budget: float
    utilization_percentage: float
    status: str  # 'healthy', 'warning', 'exceeded'
    month: int
    year: int
    updated_by_email: Optional[str] = None

# ----------------- Report Schemas -----------------

class MonthlyReportResponse(BaseModel):
    year: int
    month: int
    total_income: float
    total_expense: float
    net_savings: float
    budget: float
    budget_remaining: float
    budget_utilization: float
    transaction_count: int
    category_breakdown: List[Dict[str, Any]]

class CalendarDayReport(BaseModel):
    date: str
    income: float
    expense: float
    transaction_count: int
    transactions: List[TransactionResponse]

class HistoricalMonth(BaseModel):
    year: int
    month: int
    label: str
    income: float
    expense: float
    net: float

class PeriodSummaryResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    total_income: float
    total_expense: float
    net_balance: float
    categories: List[Dict[str, Any]]
    top_expenses: List[TransactionResponse]
