
from pydantic import BaseModel, EmailStr
from typing import Optional, TypeVar, Generic, List
from datetime import datetime

T = TypeVar('T')

class CompanyInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class RoleInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    company_id: Optional[int] = None
    role_id: int

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_id: Optional[int] = None
    role_id: Optional[int] = None
    password: Optional[str] = None

class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserReadWithDetails(UserRead):
    company: Optional[CompanyInfo] = None
    role: RoleInfo

class DriverRead(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class DataTableResponse(BaseModel, Generic[T]):
    data: List[T]
    recordsFiltered: int
    recordsTotal: int

