from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.users import User

from app.dto.base_response import APIResponse
from app.dto.gas_dto import GasCreate, GasUpdate, GasRead
from app.services.gas_service import (
    create_gas, get_gas_by_id, list_gases, 
    update_gas, soft_delete_gas, search_gases
)
from app.dependencies import get_db, get_current_user
from app.core.role import AdminOnly, StaffOnly
from app.messages.messages import Message

router = APIRouter(prefix="/gases", tags=["gases"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_gas_endpoint(
    payload: GasCreate, 
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Create a new gas (Admin only)"""
    gas = create_gas(db, payload.name, payload.unit, payload.description)
    return APIResponse(
        data=GasRead.model_validate(gas),
        statusCode=status.HTTP_201_CREATED,
        message=Message.Success.GAS_CREATED,
        technicalMessage=None
    )

@router.get("/{gas_id}", response_model=APIResponse)
def get_gas(
    gas_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """Get a specific gas by ID (Staff only)"""
    gas = get_gas_by_id(db, gas_id)
    return APIResponse(
        data=GasRead.model_validate(gas),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.GAS_RETRIEVED,
        technicalMessage=None
    )

@router.get("/", response_model=APIResponse)
def list_gases_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    name: Optional[str] = Query(None),
    db: Session = Depends(get_db), 
    user: User = Depends(StaffOnly)
):
    """List all gases with optional filtering (Staff only)"""
    if name:
        gases = search_gases(db, name=name, skip=skip, limit=limit)
    else:
        gases = list_gases(db, skip=skip, limit=limit)
    
    data = [GasRead.model_validate(gas) for gas in gases]
    return APIResponse(
        data=data,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.GAS_RETRIEVED,
        technicalMessage=None
    )

@router.put("/{gas_id}", response_model=APIResponse)
def update_gas_endpoint(
    gas_id: int,
    payload: GasUpdate,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Update a gas (Admin only)"""
    gas = update_gas(db, gas_id, payload.name, payload.unit, payload.description)
    return APIResponse(
        data=GasRead.model_validate(gas),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.GAS_UPDATED,
        technicalMessage=None
    )

@router.delete("/{gas_id}", response_model=APIResponse)
def delete_gas_endpoint(
    gas_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Soft delete a gas (Admin only)"""
    gas = soft_delete_gas(db, gas_id)
    return APIResponse(
        data=GasRead.model_validate(gas),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.GAS_DELETED,
        technicalMessage=None
    )