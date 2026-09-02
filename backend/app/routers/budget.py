from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import User, Transaction, SharedBudget
from app.schemas import BudgetUpdate, BudgetResponse
from app.security import get_current_user

router = APIRouter(tags=["Budget Management"])

def get_shared_target_budget(db: Session) -> (float, str):
    """
    Returns (target_budget, updated_by_email)
    """
    try:
        shared = db.query(SharedBudget).filter(SharedBudget.id == 1).first()
        if shared:
            return float(shared.target_budget), shared.updated_by_email
    except Exception:
        db.rollback()

    # Fallback to the maximum total_budget among existing users, or default 50000.0
    highest_user_budget = db.query(func.max(User.total_budget)).scalar() or 0.0
    if highest_user_budget > 0:
        return float(highest_user_budget), "admin@accutai.com"
    return 50000.0, "admin@accutai.com"

def set_shared_target_budget(db: Session, new_budget: float, updated_by_email: str):
    try:
        shared = db.query(SharedBudget).filter(SharedBudget.id == 1).first()
        if not shared:
            shared = SharedBudget(id=1, target_budget=new_budget, updated_by_email=updated_by_email)
            db.add(shared)
        else:
            shared.target_budget = new_budget
            shared.updated_by_email = updated_by_email
        db.commit()
    except Exception:
        db.rollback()

    # Also update the user's total_budget column
    db.query(User).update({User.total_budget: new_budget})
    db.commit()

@router.get("/budget", response_model=BudgetResponse)
@router.get("/users/me/budget", response_model=BudgetResponse)
def get_current_budget_status(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    target_budget, updated_by = get_shared_target_budget(db)

    # Calculate SHARED spending across all transactions for this year & month
    expense_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.type == "expense",
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month
    ).scalar() or 0.0

    income_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.type == "income",
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month
    ).scalar() or 0.0

    total_spent = float(expense_sum)
    total_income = float(income_sum)
    remaining = float(target_budget) - total_spent
    utilization = (total_spent / target_budget * 100.0) if target_budget > 0 else 0.0

    if utilization > 100:
        status_str = "exceeded"
    elif utilization >= 80:
        status_str = "warning"
    else:
        status_str = "healthy"

    return BudgetResponse(
        total_budget=round(float(target_budget), 2),
        total_spent=round(total_spent, 2),
        total_income=round(total_income, 2),
        remaining_budget=round(remaining, 2),
        utilization_percentage=round(utilization, 1),
        status=status_str,
        month=target_month,
        year=target_year,
        updated_by_email=updated_by
    )

@router.put("/budget", response_model=BudgetResponse)
@router.put("/users/me/budget", response_model=BudgetResponse)
def update_budget(
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    set_shared_target_budget(db, budget_in.total_budget, current_user.email)
    return get_current_budget_status(db=db, current_user=current_user)
