from pydantic import BaseModel
from typing import Optional

class OrderStatusRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
