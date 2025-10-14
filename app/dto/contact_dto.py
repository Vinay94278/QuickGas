from pydantic import BaseModel, EmailStr
from typing import Optional

class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    company_id: int

class ContactRead(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[EmailStr]
    company_id: int
