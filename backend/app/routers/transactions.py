from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, or_

from app.database import get_db
from app.models import Transaction, Category, User, MonthlySummary
from app.schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from app.security import get_current_user
from app.storage import upload_file_to_supabase

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def recalculate_monthly_summary(db: Session, year: int, month: int, user_id: int):
    """
    Recalculates cached monthly summaries if record exists.
    """
    try:
        from sqlalchemy import func
        inc = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month,
            Transaction.type == "income"
        ).scalar() or 0.0

        exp = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month,
            Transaction.type == "expense"
        ).scalar() or 0.0

        summary = db.query(MonthlySummary).filter(
            MonthlySummary.year == year,
            MonthlySummary.month == month,
            MonthlySummary.user_id == user_id
        ).first()

        if not summary:
            summary = MonthlySummary(
                user_id=user_id,
                year=year,
                month=month,
                total_income=inc,
                total_expense=exp,
                balance=inc - exp
            )
            db.add(summary)
        else:
            summary.total_income = inc
            summary.total_expense = exp
            summary.balance = inc - exp
        db.commit()
    except Exception:
        db.rollback()

def serialize_transaction(tx: Transaction) -> dict:
    return {
        "id": tx.id,
        "user_id": tx.user_id,
        "amount": tx.amount,
        "type": tx.type,
        "description": tx.description,
        "receipt_url": tx.receipt_url,
        "date": tx.date,
        "category_id": tx.category_id,
        "created_at": tx.created_at,
        "updated_at": tx.updated_at,
        "category_name": tx.category.name if tx.category else "Uncategorized",
        "user_name": tx.user.username if tx.user else f"User #{tx.user_id}",
        "user_email": tx.user.email if tx.user else ""
    }

@router.get("/", response_model=List[TransactionResponse])
def get_shared_transactions(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Shared Ledger: returns transactions across ALL users for collaborative tracking.
    """
    query = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    )

    if year:
        query = query.filter(extract("year", Transaction.date) == year)
    if month:
        query = query.filter(extract("month", Transaction.date) == month)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if type:
        query = query.filter(Transaction.type == type)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(term),
                Transaction.category.has(Category.name.ilike(term))
            )
        )

    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()
    return [serialize_transaction(tx) for tx in transactions]

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if tx_in.category_id:
        cat = db.query(Category).filter(Category.id == tx_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    # Ensure tz-aware date
    date_val = tx_in.date
    if date_val.tzinfo is None:
        date_val = date_val.replace(tzinfo=timezone.utc)

    new_tx = Transaction(
        user_id=current_user.id,
        amount=tx_in.amount,
        type=tx_in.type,
        description=tx_in.description,
        receipt_url=tx_in.receipt_url,
        date=date_val,
        category_id=tx_in.category_id
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    # Recalculate summary
    recalculate_monthly_summary(db, date_val.year, date_val.month, current_user.id)

    # Reload with relationships
    tx_reloaded = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    ).filter(Transaction.id == new_tx.id).first()

    return serialize_transaction(tx_reloaded)

@router.get("/{id}", response_model=TransactionResponse)
def get_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    ).filter(Transaction.id == id).first()

    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return serialize_transaction(tx)

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(
    id: int,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = tx_update.model_dump(exclude_unset=True)
    if "category_id" in update_data and update_data["category_id"] is not None:
        cat = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    if "date" in update_data and update_data["date"] is not None:
        d = update_data["date"]
        if d.tzinfo is None:
            update_data["date"] = d.replace(tzinfo=timezone.utc)

    for field, val in update_data.items():
        setattr(tx, field, val)

    tx.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tx)

    # Recalculate summary
    recalculate_monthly_summary(db, tx.date.year, tx.date.month, tx.user_id)

    tx_reloaded = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.user)
    ).filter(Transaction.id == tx.id).first()

    return serialize_transaction(tx_reloaded)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    year, month, user_id = tx.date.year, tx.date.month, tx.user_id
    db.delete(tx)
    db.commit()

    recalculate_monthly_summary(db, year, month, user_id)
    return {"message": "Transaction deleted successfully", "id": id}

@router.post("/upload-receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload receipt/bill to Supabase Storage bucket `accutai_expense_bills`.
    """
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds 10MB limit")

    receipt_url = await upload_file_to_supabase(
        file_bytes=contents,
        filename=file.filename or "receipt.png",
        content_type=file.content_type or "image/png"
    )
    return {"url": receipt_url, "filename": file.filename}
