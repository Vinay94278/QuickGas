from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    ForeignKey,
    TIMESTAMP,
    func,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    status_id = Column(
        Integer, ForeignKey("order_status.id"), nullable=False, default=1
    )
    admin_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )  # Admin who created order
    driver_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Driver assigned for delivery
    area = Column(String(255), nullable=False)  # Delivery area
    mobile_no = Column(String(20), nullable=True)  # Customer mobile for delivery
    notes = Column(Text, nullable=True)  # Optional notes
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    company = relationship("Company", back_populates="orders")
    status = relationship("OrderStatus", back_populates="orders")
    admin = relationship("User", foreign_keys=[admin_id])  # Admin who created order
    driver = relationship("User", foreign_keys=[driver_id])  # Driver assigned
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
