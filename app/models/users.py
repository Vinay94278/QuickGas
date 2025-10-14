from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50))
    email = Column(String(255), unique=True)
    address = Column(String(500))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=4)
    password_hash = Column(String(255))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="users")
    role = relationship("Role", back_populates="users")
    admin_orders = relationship("Order", foreign_keys="Order.admin_id", back_populates="admin")
    driver_orders = relationship("Order", foreign_keys="Order.driver_id", back_populates="driver")