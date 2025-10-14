from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.dto.base_response import APIResponse
from app.dto.role_dto import RoleRead
from app.services.role_service import get_all_roles
from app.dependencies import get_db
from app.core.role import AdminOnly
from app.messages.messages import Message

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("/", response_model=APIResponse)
def list_roles_endpoint(db: Session = Depends(get_db), user: dict = Depends(AdminOnly)):
    """List all roles (Admin only)"""
    roles = get_all_roles(db)
    return APIResponse(
        data=[RoleRead.from_orm(role) for role in roles],
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ROLE_RETRIEVED
    )
