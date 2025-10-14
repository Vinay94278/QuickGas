from pydantic import BaseModel
from typing import Optional

class OrderItemCreate(BaseModel):
    order_id: int
    gas_id: int
    quantity: int

class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = None

class OrderItemRead(BaseModel):
    id: int
    order_id: int
    gas_id: int
    gas_name: str
    gas_unit: str
    quantity: int

    class Config:
        from_attributes = True