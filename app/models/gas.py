from sqlalchemy import (
    Column, Integer, String, Boolean, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class Gas(Base):
    __tablename__ = "gases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    unit = Column(String(50), default="Cubic Meters")
    description = Column(String(500))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    order_items = relationship("OrderItem", back_populates="gas")
