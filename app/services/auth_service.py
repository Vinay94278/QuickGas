from app.core.security import create_access_token, verify_password_hash
from app.messages.messages import Message
from sqlalchemy.orm import Session
from app.models.users import User
from fastapi import HTTPException, status 
from app.core.security import get_password_hash, create_access_token
from fastapi import HTTPException, status
from app.dto.auth_dto import SignupRequest , SignupResponse
from app.utils.db_validation import *

def authenticate(email: str, password: str, db: Session):
    # Find user by email
    user = db.query(User).filter(User.email == email, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Message.Error.AUTH_FAILED
        )
    # Verify password hash
    if not verify_password_hash(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Message.Error.AUTH_FAILED
        )

    token_payload = {
        "user_id": user.id,
        "role_id": user.role_id,
        "email": user.email,
        "name": user.name
    }
    
    token = create_access_token(user=token_payload)
    return {"access_token": token, "token_type": "bearer"}

def signup(data:SignupRequest, db:Session):
    # check if user already exists
    existing_user = db.query(User).filter(User.email == data.email, User.is_deleted == False).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.EMAIL_ALREADY_EXSIST
        )
    
    if not company_exists(db = db,company_id = data.company_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.COMPANY_NOT_FOUND
        )
    
    if not role_exsist(db = db,role_id = data.role_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.ROLE_NOT_FOUND
        )

    # create new user
    new_user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        company_id=data.company_id or 2,
        role_id=data.role_id or 4,
        password_hash=get_password_hash(data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # generate token (optional - auto login after signup)
    token = create_access_token(subject=str(new_user.id))

    data = {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone": new_user.phone,
        "address": new_user.address,
        "company_id": new_user.company_id,
        "role_id": new_user.role_id,
        "access_token": token,
        "token_type": "bearer"
    }

    return data
