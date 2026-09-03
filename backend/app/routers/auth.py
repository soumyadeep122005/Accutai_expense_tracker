from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, validate_accutai_email
)
from app.google_auth import get_google_auth_url, exchange_google_code
from app.config import settings

router = APIRouter(tags=["Authentication"])

@router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Validate @accutai.com domain
    clean_email = validate_accutai_email(user_in.email)

    existing = db.query(User).filter(
        or_(User.email == clean_email, User.username == user_in.username.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists"
        )

    hashed_password = get_password_hash(user_in.password)
    user = User(
        username=user_in.username.strip(),
        email=clean_email,
        password=hashed_password,
        total_budget=0.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    ident = credentials.username.strip()
    user = db.query(User).filter(
        or_(User.email == ident.lower(), User.username == ident)
    ).first()

    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/auth/google")
def google_login_redirect():
    url = get_google_auth_url()
    return {"url": url}

@router.get("/auth/google/callback")
async def google_auth_callback(code: str = Query(...), db: Session = Depends(get_db)):
    google_user = await exchange_google_code(code)
    email = google_user.get("email", "").lower()

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account has no email")

    # Validate accutai domain
    validate_accutai_email(email)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create user
        name = google_user.get("name") or email.split("@")[0]
        # Ensure username uniqueness
        username = name.replace(" ", "_").lower()
        existing_u = db.query(User).filter(User.username == username).first()
        if existing_u:
            username = f"{username}_{int(datetime.utcnow().timestamp()) % 10000}"

        user = User(
            username=username,
            email=email,
            password=get_password_hash("google-sso-accutai"),
            total_budget=0.0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.email, "user_id": user.id})
    # Redirect to frontend dashboard with token
    frontend_url = f"{settings.FRONTEND_URL.rstrip('/')}/?token={token}"
    return RedirectResponse(url=frontend_url)
