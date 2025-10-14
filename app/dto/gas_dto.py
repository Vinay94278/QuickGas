from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GasCreate(BaseModel):
    name: str
    unit: Optional[str] = None
    description: Optional[str] = None

class GasUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None

class GasRead(BaseModel):
    id: int
    name: str
    unit: Optional[str]
    description: Optional[str]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True