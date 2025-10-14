"""
Dependencies Module
-------------------
This module provides FastAPI dependencies for database sessions and authentication.
These dependencies are injected into route handlers to provide required functionality.
"""

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Generator

from app.db.session import SessionLocal
from app.core.security import decode_token
from app.messages.messages import Message
from app.models.users import User

# HTTP Bearer security scheme for token authentication
security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    """
    Database Session Dependency
    ---------------------------
    Provides a SQLAlchemy database session for each request.
    
    Yields:
        Session: A database session instance
    
    Note:
        - Automatically closes the session after request completion.
        - Sets the session timezone to IST (+05:30).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail=Message.Error.UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")

    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail=Message.Error.UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user
