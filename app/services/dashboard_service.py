from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.gas import Gas
from app.models.order_status import OrderStatus

def get_dashboard_insights(db: Session):
    """
    Gathers all the insightful data for the admin dashboard.
    """
    
    # --- Status IDs ---
    PENDING_STATUS_ID = 1
    OUT_FOR_DELIVERY_STATUS_ID = 2
    COMPLETED_STATUS_ID = 3

    # 1. Total Pending Orders
    total_pending_orders = db.query(func.count(Order.id)).filter(
        Order.status_id == PENDING_STATUS_ID,
        Order.is_deleted == False
    ).scalar()

    # 2. Gas requirements for pending orders
    gas_requirements_query = (
        db.query(Gas.name, func.sum(OrderItem.quantity))
        .join(OrderItem, Gas.id == OrderItem.gas_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.status_id == PENDING_STATUS_ID, Order.is_deleted == False)
        .group_by(Gas.name)
        .all()
    )
    
    gas_requirements = {name: quantity for name, quantity in gas_requirements_query}

    # 3. Total Completed Orders
    total_completed_orders = db.query(func.count(Order.id)).filter(
        Order.status_id == COMPLETED_STATUS_ID,
        Order.is_deleted == False
    ).scalar()

    # 4. Total "Out for Delivery" Orders
    total_out_for_delivery_orders = db.query(func.count(Order.id)).filter(
        Order.status_id == OUT_FOR_DELIVERY_STATUS_ID,
        Order.is_deleted == False
    ).scalar()

    return {
        "total_pending_orders": total_pending_orders,
        "gas_requirements": gas_requirements,
        "total_completed_orders": total_completed_orders,
        "total_out_for_delivery_orders": total_out_for_delivery_orders,
    }