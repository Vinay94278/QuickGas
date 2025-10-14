from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime
from app.dto.order_item_dto import OrderItemRead
from zoneinfo import ZoneInfo

IST = ZoneInfo('Asia/Kolkata')

class OrderItemCreate(BaseModel):
    gas_id: int
    quantity: int

class OrderCreate(BaseModel):
    company_id: int
    area: str
    mobile_no: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status_id: Optional[int] = None
    driver_id: Optional[int] = None
    area: Optional[str] = None
    mobile_no: Optional[str] = None
    notes: Optional[str] = None

class OrderRead(BaseModel):
    id: int
    company_id: int
    company_name: str
    company_address: str
    status_id: int
    status_name: str
    admin_id: int
    admin_name: str
    driver_id: Optional[int]
    driver_name: Optional[str]
    area: str
    mobile_no: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_dt(self, dt: datetime, _info):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("UTC"))
        return dt.astimezone(IST).isoformat()

    class Config:
        from_attributes = True

class OrderWithItemsRead(OrderRead):
    items: List[OrderItemRead] = []