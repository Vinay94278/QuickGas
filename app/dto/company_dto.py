from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyCreate(BaseModel):
    name: str
    address: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None

class CompanyRead(BaseModel):
    id: int
    name: str
    address: Optional[str]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanyNameRead(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True