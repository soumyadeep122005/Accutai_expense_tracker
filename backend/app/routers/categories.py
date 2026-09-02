from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, User
from app.schemas import CategoryCreate, CategoryResponse
from app.security import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

# Default standard categories if none exist in DB
DEFAULT_CATEGORIES = [
    "General", "Food & Dining", "Groceries", "Rent & Housing", "Utilities",
    "Transportation", "Entertainment", "Health & Fitness", "Salary & Wages",
    "Freelance & Consulting", "Office Supplies", "Software & Tools",
    "Travel & Lodging", "Marketing & Ads", "Equipment"
]

def seed_default_categories(db: Session):
    count = db.query(Category).count()
    if count == 0:
        for name in DEFAULT_CATEGORIES:
            cat = Category(name=name, is_custom=False)
            db.add(cat)
        db.commit()

@router.get("/", response_model=List[CategoryResponse])
def get_all_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all categories for the shared ledger.
    """
    seed_default_categories(db)
    categories = db.query(Category).order_by(Category.name.asc()).all()
    return categories

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name = category_in.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name cannot be empty")

    # Case-insensitive duplicate check
    existing = db.query(Category).filter(Category.name.ilike(name)).first()
    if existing:
        return existing

    new_cat = Category(
        name=name,
        is_custom=True,
        user_id=current_user.id
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
