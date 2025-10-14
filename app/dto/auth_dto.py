from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    password: str
    company_id: int | None = 2
    role_id: int | None = 4

class SignupResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    company_id: int
    role_id: int

