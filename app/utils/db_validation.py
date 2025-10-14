"""
Database Validation Utility
---------------------------
Provides quick existence checks for database entities before CRUD operations.
Returns boolean values for efficient validation in service layers.
"""

from sqlalchemy.orm import Session
from app.models.users import User
from app.models.company import Company
from app.models.order import Order
from app.models.gas import Gas
from app.models.order_status import OrderStatus
from app.models.role import Role
from app.core.role import Role

def order_exists(db: Session, order_id: int) -> bool:
    """Check if order exists and is not deleted"""
    return db.query(Order).filter(
        Order.id == order_id, 
        Order.is_deleted == False
    ).first() is not None

def user_exists(db: Session, user_id: int) -> bool:
    """Check if user exists and is not deleted"""
    return db.query(User).filter(
        User.id == user_id, 
        User.is_deleted == False
    ).first() is not None

def role_exsist(db:Session, role_id:int) -> bool:
    """Check if role exsist or not"""
    if role_id>=1 and role_id<=4:
        return True
    else:
        return False
    
def company_exists(db: Session, company_id: int) -> bool:
    """Check if company exists and is not deleted"""
    return db.query(Company).filter(
        Company.id == company_id, 
        Company.is_deleted == False
    ).first() is not None

def gas_exists(db: Session, gas_id: int) -> bool:
    """Check if gas exists and is not deleted"""
    return db.query(Gas).filter(
        Gas.id == gas_id, 
        Gas.is_deleted == False
    ).first() is not None

def order_status_exists(db: Session, status_id: int) -> bool:
    """Check if order status exists"""
    return db.query(OrderStatus).filter(
        OrderStatus.id == status_id
    ).first() is not None

def is_admin(db: Session, user_id: int) -> bool:
    """Check if user has admin role"""
    user = db.query(User).filter(
        User.id == user_id, 
        User.is_deleted == False
    ).first()
    return user and user.role_id == Role.ADMIN

def is_driver(db: Session, user_id: int) -> bool:
    """Check if user has driver role"""
    user = db.query(User).filter(
        User.id == user_id, 
        User.is_deleted == False
    ).first()
    return user and user.role_id == Role.DRIVER

def is_customer(db: Session, user_id: int) -> bool:
    """Check if user has customer role"""
    user = db.query(User).filter(
        User.id == user_id, 
        User.is_deleted == False
    ).first()
    return user and user.role_id == Role.CUSTOMER

def is_dispatcher(db: Session, user_id: int) -> bool:
    """Check if user has dispatcher role"""
    user = db.query(User).filter(
        User.id == user_id, 
        User.is_deleted == False
    ).first()
    return user and user.role_id == Role.DISPATCHER

def user_belongs_to_company(db: Session, user_id: int, company_id: int) -> bool:
    """Check if user belongs to specific company"""
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == company_id,
        User.is_deleted == False
    ).first()
    return user is not None

def gas_name_exists(db: Session, gas_name: str) -> bool:
    """Check if gas name exists (case-insensitive)"""
    return db.query(Gas).filter(
        Gas.name.ilike(gas_name.strip()),
        Gas.is_deleted == False
    ).first() is not None

def company_name_exists(db: Session, company_name: str) -> bool:
    """Check if company name exists (case-insensitive)"""
    return db.query(Company).filter(
        Company.name.ilike(company_name.strip()),
        Company.is_deleted == False
    ).first() is not None