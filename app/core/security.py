from datetime import datetime, timedelta
import jwt
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(user: dict, expires_minutes: int | None = None) -> str:
    expire = datetime.now() + timedelta(minutes=(expires_minutes or settings.JWT_EXPIRE_MINUTES))
    to_encode = {
        "sub": str(user["user_id"]),
        "role_id": user["role_id"],
        "email": user["email"],
        "name": user["name"],
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError:
        print("Invalid token")
        return None
    except jwt.PyJWTError: 
        return None

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password_hash(password: str,hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

