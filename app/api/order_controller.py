from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.dto.base_response import APIResponse
from app.dto.order_dto import OrderCreate, OrderUpdate, OrderRead, OrderWithItemsRead
from app.services.order_service import *
from app.dependencies import get_db
from app.core.role import AdminOnly, StaffOnly
from app.messages.messages import Message

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: OrderCreate, 
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Create a new order with items (Admin only)"""
    order = create_order(
        db, payload.company_id, user.id, payload.area,
        payload.mobile_no, payload.notes, payload.items
    )
    return APIResponse(
        data=OrderRead.model_validate(order),
        statusCode=status.HTTP_201_CREATED,
        message=Message.Success.ORDER_CREATED,
        technicalMessage=None
    )

@router.get("/{order_id}", response_model=APIResponse)
def get_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(StaffOnly)
):
    """Get order details with items (Staff only)"""

    # Fetch the main order details
    order = get_order_with_details(db, order_id)
    
    # Check if the order exists before proceeding
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return APIResponse(
        data=OrderWithItemsRead.model_validate(order),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ORDER_RETRIEVED,
        technicalMessage=None
    )
    

@router.get("/", response_model=APIResponse)
def list_orders_endpoint(
    db: Session = Depends(get_db),
    user: dict = Depends(StaffOnly),
    draw: int = Query(1, ge=1),
    start: int = Query(0, ge=0),
    length: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status_id: Optional[int] = Query(None, description="Filter orders by status ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering orders (e.g., '2025-09-08T00:00:00')"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering orders (e.g., '2025-09-08T23:59:59')"),
    sort_order: str = Query("desc", description="Sort order for orders ('asc' or 'desc')")
):
    """
    List all orders with server-side processing, optional filtering, and sorting.
    """
    
    orders_data = list_orders(
        db,
        start=start,
        length=length,
        search=search,
        status_id=status_id,
        start_date=start_date,
        end_date=end_date,
        sort_order=sort_order
    )
    
    return APIResponse(
        data={
            "draw": draw,
            "recordsTotal": orders_data["recordsTotal"],
            "recordsFiltered": orders_data["recordsFiltered"],
            "data": orders_data["data"],
        },
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ORDER_RETRIEVED,
        technicalMessage=None
    )

@router.put("/{order_id}", response_model=APIResponse)
def update_order_endpoint(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """Update order details (Staff only)"""
    update_order(db, order_id, **payload.dict(exclude_unset=True))
    order = get_order_with_details(db,order_id)
    return APIResponse(
        data=OrderWithItemsRead.model_validate(order),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ORDER_UPDATED,
        technicalMessage=None
    )

@router.delete("/{order_id}", response_model=APIResponse)
def delete_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Soft delete an order (Admin only)"""
    hard_delete_order(db, order_id)
    return APIResponse(
        data={"order_id":order_id},
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ORDER_DELETED,
        technicalMessage=None
    )