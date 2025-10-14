from sqlalchemy.orm import Session
from app.models.order_item import OrderItem
from app.models.gas import Gas
from app.messages.messages import Message
from app.models.order import Order
from fastapi import HTTPException, status
from app.utils.db_validation import order_exists, gas_exists
from app.messages.messages import Message

def create_order_item(db: Session, order_id: int, gas_id: int, quantity: int):
    # Validate order exists and is not deleted
    if not order_exists(db, order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )
    
    # Validate gas exists and is not deleted
    if not gas_exists(db, gas_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.GAS_NOT_FOUND
        )
    
    # Validate quantity is positive
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.INVALID_QUANTITY
        )
    
    # Create new order item
    order_item = OrderItem(order_id=order_id, gas_id=gas_id, quantity=quantity)
    db.add(order_item)
    db.commit()
    db.refresh(order_item)
    return order_item

def get_order_item_by_id(db: Session, order_item_id: int):
    order_item = db.query(OrderItem).filter(OrderItem.id == order_item_id).first()
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.NOT_FOUND
        )
    return order_item

def get_order_items_by_order(db: Session, order_id: int):
    return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

def update_order_item_quantity(db: Session, order_item_id: int, quantity: int):
    order_item = get_order_item_by_id(db, order_item_id)
    order_item.quantity = quantity
    db.commit()
    db.refresh(order_item)
    return order_item

def delete_order_item(db: Session, order_item_id: int):
    order_item = get_order_item_by_id(db, order_item_id)
    db.delete(order_item)
    db.commit()
    return {"message": "Order item deleted", "id": order_item_id}

def get_order_items_with_gas_details(db: Session, order_id: int):
    """Get order items with gas details for response"""
    items = db.query(OrderItem, Gas.name, Gas.unit).join(
        Gas, OrderItem.gas_id == Gas.id
    ).filter(OrderItem.order_id == order_id).all()
    
    return [{
        "id": item.OrderItem.id,
        "order_id": item.OrderItem.order_id,
        "gas_id": item.OrderItem.gas_id,
        "quantity": item.OrderItem.quantity,
        "gas_name": item.name,
        "gas_unit": item.unit
    } for item in items]