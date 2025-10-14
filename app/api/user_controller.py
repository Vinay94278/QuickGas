
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.dto.base_response import APIResponse
from app.dto.user_dto import DriverRead, UserRead, UserCreate, UserUpdate, DataTableResponse, UserReadWithDetails
from app.services.user_service import get_all_drivers, get_all_users, get_user, create_user, update_user, delete_user
from app.dependencies import get_db
from app.core.role import StaffOnly, AdminOnly
from app.messages.messages import Message

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/all", response_model=APIResponse)
def list_users_endpoint(
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly),
    start: int = Query(0, ge=0),
    length: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    sort_by: str = Query(None),
    sort_dir: str = Query("asc", regex="^(asc|desc)$")
):
    """List all users with optional pagination, searching, and sorting (Admin only)"""
    users, total_records = get_all_users(db, start, length, search, sort_by, sort_dir)
    validated_users = [UserReadWithDetails.model_validate(user) for user in users]
    response_data = DataTableResponse(data=validated_users, recordsFiltered=total_records, recordsTotal=total_records)
    return APIResponse(
        data=response_data,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.USER_RETRIEVED,
    )

@router.get("/drivers", response_model=APIResponse)
def list_drivers_endpoint(
    db: Session = Depends(get_db),
    user: dict = Depends(StaffOnly)
):
    """List all drivers (Staff only)"""
    drivers = get_all_drivers(db)
    return APIResponse(
        data=[DriverRead.model_validate(driver) for driver in drivers],
        statusCode=status.HTTP_200_OK,
        message=Message.Success.USER_RETRIEVED,
        technicalMessage=None
    )

@router.get("/{user_id}", response_model=APIResponse)
def get_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly)
):
    """Get user details by ID (Admin only)"""
    db_user = get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail=Message.Error.USER_NOT_FOUND)
    return APIResponse(
        data=UserReadWithDetails.model_validate(db_user),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.USER_RETRIEVED,
        technicalMessage=None
    )

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly)
):
    """Create a new user (Admin only)"""
    new_user = create_user(db, payload)
    return APIResponse(
        data=UserRead.model_validate(new_user),
        statusCode=status.HTTP_201_CREATED,
        message=Message.Success.USER_CREATED,
        technicalMessage=None
    )

@router.put("/{user_id}", response_model=APIResponse)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly)
):
    """Update user details by ID (Admin only)"""
    updated_user = update_user(db, user_id, payload)
    if updated_user is None:
        raise HTTPException(status_code=404, detail=Message.Error.USER_NOT_FOUND)
    return APIResponse(
        data=UserRead.model_validate(updated_user),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.USER_UPDATED,
        technicalMessage=None
    )

@router.delete("/{user_id}", response_model=APIResponse)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly)
):
    """Delete a user by ID (Admin only)"""
    deleted_user = delete_user(db, user_id)
    if deleted_user is None:
        raise HTTPException(status_code=404, detail=Message.Error.USER_NOT_FOUND)
    return APIResponse(
        data=None,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.USER_DELETED,
        technicalMessage=None
    )
