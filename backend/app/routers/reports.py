from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func

from app.database import get_db
from app.models import Transaction, Category, User
from app.schemas import (
    MonthlyReportResponse, CalendarDayReport, HistoricalMonth,
    PeriodSummaryResponse, TransactionResponse
)
from app.security import get_current_user
from app.routers.budget import get_shared_target_budget
from app.routers.transactions import serialize_transaction

router = APIRouter(prefix="/reports", tags=["Reports and Analytics"])

@router.get("/monthly/", response_model=MonthlyReportResponse)
def get_monthly_report(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    # Budget target
    budget_target, _ = get_shared_target_budget(db)

    # All transactions in month
    txs = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    ).filter(
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month
    ).all()

    income = sum(float(t.amount) for t in txs if t.type == "income")
    expense = sum(float(t.amount) for t in txs if t.type == "expense")
    net = income - expense
    remaining = budget_target - expense
    utilization = (expense / budget_target * 100.0) if budget_target > 0 else 0.0

    # Category breakdown for expenses
    cat_map: Dict[str, float] = {}
    for t in txs:
        if t.type == "expense":
            cname = t.category.name if t.category else "Uncategorized"
            cat_map[cname] = cat_map.get(cname, 0.0) + float(t.amount)

    category_breakdown = [
        {"name": k, "amount": round(v, 2), "percentage": round((v / expense * 100.0) if expense > 0 else 0.0, 1)}
        for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    return MonthlyReportResponse(
        year=target_year,
        month=target_month,
        total_income=round(income, 2),
        total_expense=round(expense, 2),
        net_savings=round(net, 2),
        budget=round(budget_target, 2),
        budget_remaining=round(remaining, 2),
        budget_utilization=round(utilization, 1),
        transaction_count=len(txs),
        category_breakdown=category_breakdown
    )

@router.get("/calendar", response_model=List[CalendarDayReport])
def get_calendar_report(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    days_in_month = monthrange(target_year, target_month)[1]

    txs = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    ).filter(
        extract("year", Transaction.date) == target_year,
        extract("month", Transaction.date) == target_month
    ).order_by(Transaction.date.asc()).all()

    # Group by day string 'YYYY-MM-DD'
    days_dict: Dict[str, Dict[str, Any]] = {}
    for d in range(1, days_in_month + 1):
        date_str = f"{target_year:04d}-{target_month:02d}-{d:02d}"
        days_dict[date_str] = {
            "date": date_str,
            "income": 0.0,
            "expense": 0.0,
            "transaction_count": 0,
            "transactions": []
        }

    for t in txs:
        date_str = t.date.strftime("%Y-%m-%d")
        if date_str in days_dict:
            if t.type == "income":
                days_dict[date_str]["income"] += float(t.amount)
            else:
                days_dict[date_str]["expense"] += float(t.amount)
            days_dict[date_str]["transaction_count"] += 1
            days_dict[date_str]["transactions"].append(serialize_transaction(t))

    return [CalendarDayReport(**data) for date_str, data in sorted(days_dict.items())]

@router.get("/historical", response_model=List[HistoricalMonth])
def get_historical_report(
    limit: int = Query(12, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    results = []

    for i in range(limit - 1, -1, -1):
        # Calculate year and month for each past interval
        m_offset = now.month - i
        y_offset = now.year
        while m_offset <= 0:
            m_offset += 12
            y_offset -= 1

        txs = db.query(Transaction).filter(
            extract("year", Transaction.date) == y_offset,
            extract("month", Transaction.date) == m_offset
        ).all()

        inc = sum(float(t.amount) for t in txs if t.type == "income")
        exp = sum(float(t.amount) for t in txs if t.type == "expense")
        month_label = datetime(y_offset, m_offset, 1).strftime("%b %Y")

        results.append(HistoricalMonth(
            year=y_offset,
            month=m_offset,
            label=month_label,
            income=round(inc, 2),
            expense=round(exp, 2),
            net=round(inc - exp, 2)
        ))

    return results

@router.get("/summary", response_model=PeriodSummaryResponse)
def get_period_summary(
    period: str = Query("monthly", pattern="^(monthly|quarterly|yearly)$"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    query = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    )

    if period == "monthly":
        query = query.filter(
            extract("year", Transaction.date) == target_year,
            extract("month", Transaction.date) == target_month
        )
        start_date = f"{target_year:04d}-{target_month:02d}-01"
        dim = monthrange(target_year, target_month)[1]
        end_date = f"{target_year:04d}-{target_month:02d}-{dim:02d}"
    elif period == "quarterly":
        quarter = (target_month - 1) // 3 + 1
        q_start_month = (quarter - 1) * 3 + 1
        q_end_month = q_start_month + 2
        query = query.filter(
            extract("year", Transaction.date) == target_year,
            extract("month", Transaction.date) >= q_start_month,
            extract("month", Transaction.date) <= q_end_month
        )
        start_date = f"{target_year:04d}-{q_start_month:02d}-01"
        dim = monthrange(target_year, q_end_month)[1]
        end_date = f"{target_year:04d}-{q_end_month:02d}-{dim:02d}"
    else:  # yearly
        query = query.filter(extract("year", Transaction.date) == target_year)
        start_date = f"{target_year:04d}-01-01"
        end_date = f"{target_year:04d}-12-31"

    txs = query.all()
    inc = sum(float(t.amount) for t in txs if t.type == "income")
    exp = sum(float(t.amount) for t in txs if t.type == "expense")

    cat_map: Dict[str, float] = {}
    for t in txs:
        if t.type == "expense":
            cname = t.category.name if t.category else "Uncategorized"
            cat_map[cname] = cat_map.get(cname, 0.0) + float(t.amount)

    categories = [
        {"name": k, "amount": round(v, 2), "percentage": round((v / exp * 100.0) if exp > 0 else 0.0, 1)}
        for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    top_expenses = sorted([t for t in txs if t.type == "expense"], key=lambda x: x.amount, reverse=True)[:5]

    return PeriodSummaryResponse(
        period=period,
        start_date=start_date,
        end_date=end_date,
        total_income=round(inc, 2),
        total_expense=round(exp, 2),
        net_balance=round(inc - exp, 2),
        categories=categories,
        top_expenses=[serialize_transaction(t) for t in top_expenses]
    )
