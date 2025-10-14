from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.dto.base_response import APIResponse
from app.dto.order_status_dto import OrderStatusRead
from app.services.order_status_service import get_all_statuses
from app.dependencies import get_db
from app.core.role import StaffOnly
from app.messages.messages import Message

router = APIRouter(prefix="/order-statuses", tags=["order_statuses"])

@router.get("/", response_model=APIResponse)
def list_order_statuses_endpoint(
    db: Session = Depends(get_db),
    user: dict = Depends(StaffOnly)
):
    """List all order statuses (Staff only)"""
    statuses = get_all_statuses(db)
    return APIResponse(
        data=[OrderStatusRead.model_validate(status) for status in statuses],
        statusCode=status.HTTP_200_OK,
        message=Message.Success.ORDER_STATUS_RETRIEVED,
        technicalMessage=None
    )
