from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.dto.base_response import APIResponse
from app.dto.order_item_dto import OrderItemCreate, OrderItemUpdate, OrderItemRead
from app.services.order_item_service import (
    create_order_item, get_order_item_by_id, get_order_items_by_order,
    update_order_item_quantity, delete_order_item, get_order_items_with_gas_details
)
from app.dependencies import get_db, get_current_user
from app.core.role import AdminOnly, StaffOnly
from app.messages.messages import Message

router = APIRouter(prefix="/order-items", tags=["order-items"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_order_item_endpoint(
    payload: OrderItemCreate, 
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Add item to order (Admin only)"""
    order_item = create_order_item(db, payload.order_id, payload.gas_id, payload.quantity)
    return APIResponse(
        data=OrderItemRead.model_validate(order_item),
        statusCode=status.HTTP_201_CREATED,
        message=Message.Success.ITEM_CREATED,
        technicalMessage=None
    )

@router.get("/order/{order_id}", response_model=APIResponse)
def get_order_items_endpoint(
    order_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """Get all items for an order (Staff only)"""
    items = get_order_items_with_gas_details(db, order_id)
    return APIResponse(
        data=items,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ITEM_RETRIEVED,
        technicalMessage=None
    )

@router.put("/{order_item_id}", response_model=APIResponse)
def update_order_item_endpoint(
    order_item_id: int,
    payload: OrderItemUpdate,
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """Update order item quantity (Staff only)"""
    order_item = update_order_item_quantity(db, order_item_id, payload.quantity)
    return APIResponse(
        data=OrderItemRead.model_validate(order_item),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ITEM_UPDATED,
        technicalMessage=None
    )

@router.delete("/{order_item_id}", response_model=APIResponse)
def delete_order_item_endpoint(
    order_item_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Remove item from order (Admin only)"""
    result = delete_order_item(db, order_item_id)
    return APIResponse(
        data=result,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ITEM_DELETED,
        technicalMessage=None
    )