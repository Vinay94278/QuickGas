from sqlalchemy.orm import Session
from app.models.order_status import OrderStatus

def get_all_statuses(db: Session):
    return db.query(OrderStatus).all()
