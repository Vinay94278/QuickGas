from fastapi import APIRouter, Depends, HTTPException
from app.dto.auth_dto import *
from app.services.auth_service import authenticate, signup
from app.dto.base_response import APIResponse
from app.messages.messages import Message
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/login", response_model=APIResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    auth = authenticate(payload.email, payload.password, db)
    if not auth:
        return APIResponse(
            data=None,
            statusCode=401,
            message=Message.Error.AUTH_FAILED,
            technicalMessage=None,
        )
    return APIResponse(
        data=LoginResponse.model_validate(auth),
        statusCode=200,
        message=Message.Success.SIGNUP_SUCCESSFUL,
        technicalMessage=None,
    )


@router.post("/signup", response_model=APIResponse)
def signup_user(payload: SignupRequest, db: Session = Depends(get_db)):
    user_data = signup(payload, db)
    return APIResponse(
        data=SignupResponse.model_validate(user_data),
        statusCode=201,
        message=Message.Success.SIGNUP_SUCCESSFUL,
        technicalMessage=None,
    )
