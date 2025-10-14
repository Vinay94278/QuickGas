from sqlalchemy import (
    Column, Integer, String
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class OrderStatus(Base):
    __tablename__ = "order_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String(255))

    orders = relationship("Order", back_populates="status")