from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.company import Company
from app.models.order_status import OrderStatus
from app.models.users import User
from app.models.gas import Gas
from app.messages.messages import Message
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime
import pytz
from app.services.order_item_service import create_order_item
from app.utils.db_validation import (
    order_exists, company_exists, user_exists, gas_exists, order_status_exists,
    is_admin, is_driver
)
from app.dto.order_dto import OrderRead, OrderWithItemsRead, OrderItemCreate
from app.dto.order_item_dto import OrderItemRead

def create_order(
    db: Session,
    company_id: int,
    admin_id: int,
    area: str,
    mobile_no: str,
    notes: str,
    items: List[OrderItemCreate],
):
    # Validate company exists
    if not company_exists(db, company_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.COMPANY_NOT_FOUND
        )
    
    # Validate admin exists and is actually an admin
    if not user_exists(db, admin_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.USER_NOT_FOUND
        )
    
    # Validate weather the user is admin or not
    if not is_admin(db, admin_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=Message.Error.NOT_ADMIN
        )
    
    # Validate area is provided
    if not area or not area.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.REQUIRED_FIELD
        )
    
    # Validate items are provided
    if not items or len(items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=Message.Error.MINIMUM_ITEM_REQUIRED
        )

    # Create order
    order = Order(
        company_id=company_id,
        admin_id=admin_id,
        area=area.strip(),
        mobile_no=mobile_no.strip() if mobile_no else None,
        notes=notes.strip() if notes else None,
        status_id=1,  # Default: PENDING
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Add order items
    for item in items:
        create_order_item(
            db=db,
            order_id=order.id,
            gas_id=item.gas_id,
            quantity=item.quantity,
        )
    
    db.commit()
    db.refresh(order)

    # Aliases for users (since admin and driver both reference users table)
    AdminUser = aliased(User)
    DriverUser = aliased(User)

    # Fetch full order with joins
    query = (
        db.query(
            Order.id,
            Order.company_id,
            Company.name.label("company_name"),
            Company.address.label("company_address"),
            Order.status_id,
            OrderStatus.name.label("status_name"),
            Order.admin_id,
            AdminUser.name.label("admin_name"),
            Order.driver_id,
            DriverUser.name.label("driver_name"),
            Order.area,
            Order.mobile_no,
            Order.notes,
            Order.created_at,
            Order.updated_at,
        )
        .join(Company, Company.id == Order.company_id)
        .join(OrderStatus, OrderStatus.id == Order.status_id)
        .join(AdminUser, AdminUser.id == Order.admin_id)
        .outerjoin(DriverUser, DriverUser.id == Order.driver_id)  # driver optional
        .filter(Order.id == order.id)
    )

    result = query.first()

    return OrderRead(**result._asdict())

def get_order_with_details(db: Session, order_id: int):
    # Validate order exists
    if not order_exists(db, order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )
    # Aliases for users (since admin and driver both reference users table)
    AdminUser = aliased(User)
    DriverUser = aliased(User)

    # --- Fetch the main order details ---
    query = (
        db.query(
            Order.id,
            Order.company_id,
            Company.name.label("company_name"),
            Company.address.label("company_address"),
            Order.status_id,
            OrderStatus.name.label("status_name"),
            Order.admin_id,
            AdminUser.name.label("admin_name"),
            Order.driver_id,
            DriverUser.name.label("driver_name"),
            Order.area,
            Order.mobile_no,
            Order.notes,
            Order.created_at,
            Order.updated_at,
        )
        .join(Company, Company.id == Order.company_id)
        .join(OrderStatus, OrderStatus.id == Order.status_id)
        .join(AdminUser, AdminUser.id == Order.admin_id)
        .outerjoin(DriverUser, DriverUser.id == Order.driver_id)
        .filter(Order.id == order_id)
    )

    result = query.first()

    # Convert to dictionary
    order_dict = result._asdict()

    # Timezone conversion
    ist = pytz.timezone('Asia/Kolkata')
    order_dict['created_at'] = order_dict['created_at'].astimezone(ist)
    order_dict['updated_at'] = order_dict['updated_at'].astimezone(ist)

    # Convert the main order row to a Pydantic object
    order_read = OrderWithItemsRead.model_validate(order_dict)

    # --- New Query to Fetch Order Items ---
    items = db.query(OrderItem, Gas.name, Gas.unit).join(
        Gas, OrderItem.gas_id == Gas.id
    ).filter(OrderItem.order_id == order_id).all()
    
    items_result = [{
        "id": item.OrderItem.id,
        "order_id": item.OrderItem.order_id,
        "gas_id": item.OrderItem.gas_id,
        "quantity": item.OrderItem.quantity,
        "gas_name": item.name,
        "gas_unit": item.unit
    } for item in items]

    # Convert each OrderItem row to an OrderItemRead Pydantic model
    order_items_list = [OrderItemRead.model_validate(item) for item in items_result]

    # Attach the list of items to the main order object
    order_read.items = order_items_list

    return order_read

def list_orders(
    db: Session,
    start: int = 0,
    length: int = 10,
    search: str = None,
    status_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_order: str = "desc"
):
    # Aliases for users
    AdminUser = aliased(User)
    DriverUser = aliased(User)

    # Base query
    query = (
        db.query(
            Order.id,
            Order.company_id,
            Company.name.label("company_name"),
            Company.address.label("company_address"),
            Order.status_id,
            OrderStatus.name.label("status_name"),
            Order.admin_id,
            AdminUser.name.label("admin_name"),
            Order.driver_id,
            DriverUser.name.label("driver_name"),
            Order.area,
            Order.mobile_no,
            Order.notes,
            Order.created_at,
            Order.updated_at,
        )
        .join(Company, Company.id == Order.company_id)
        .join(OrderStatus, OrderStatus.id == Order.status_id)
        .join(AdminUser, AdminUser.id == Order.admin_id)
        .outerjoin(DriverUser, DriverUser.id == Order.driver_id)
        .filter(Order.is_deleted == False)
    )

    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Company.name.ilike(search_term),
                DriverUser.name.ilike(search_term),
                OrderStatus.name.ilike(search_term)
            )
        )
        
    # Get total records count before filtering
    total_records = db.query(func.count(Order.id)).scalar()


    # Add optional filtering by status_id
    if status_id is not None:
        query = query.filter(Order.status_id == status_id)

    # Add optional filtering by date range
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    # Get filtered records count
    filtered_records = query.count()

    # Dynamic sorting
    if sort_order.lower() == "asc":
        query = query.order_by(Order.created_at.asc())
    else:
        query = query.order_by(Order.created_at.desc())
    
    # Pagination
    query = query.offset(start).limit(length)
    
    results = query.all()
    
    # Efficiently fetch items for the retrieved orders
    order_ids = [row.id for row in results]
    items_map = {}
    if order_ids:
        items_query = (
            db.query(OrderItem, Gas.name, Gas.unit)
            .join(Gas, OrderItem.gas_id == Gas.id)
            .filter(OrderItem.order_id.in_(order_ids))
            .all()
        )
        for item in items_query:
            item_data = {
                "id": item.OrderItem.id, "order_id": item.OrderItem.order_id,
                "gas_id": item.OrderItem.gas_id, "quantity": item.OrderItem.quantity,
                "gas_name": item.name, "gas_unit": item.unit,
            }
            if item.OrderItem.order_id not in items_map:
                items_map[item.OrderItem.order_id] = []
            items_map[item.OrderItem.order_id].append(item_data)
            
    # Combine orders and their items
    orders_list = []
    ist = pytz.timezone('Asia/Kolkata') # Define IST
    for result in results:
        order_dict = result._asdict()
        order_dict['created_at'] = order_dict['created_at'].astimezone(ist)
        order_dict['updated_at'] = order_dict['updated_at'].astimezone(ist)

        order_read = OrderWithItemsRead.model_validate(order_dict)
        order_items_data = items_map.get(order_read.id, [])
        order_read.items = [OrderItemRead.model_validate(item) for item in order_items_data]
        orders_list.append(order_read)

    return {
        "recordsTotal": total_records,
        "recordsFiltered": filtered_records,
        "data": orders_list,
    }

def update_order(db: Session, order_id: int, **kwargs):
    if not order_exists(db, order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )

    order = db.query(Order).filter(Order.id == order_id, Order.is_deleted == False).first()

    if 'status_id' in kwargs and kwargs['status_id'] is not None:
        if not order_status_exists(db, kwargs['status_id']):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=Message.Error.STATUS_NOT_FOUND
            )
    
    if 'driver_id' in kwargs and kwargs['driver_id'] is not None:
        if not user_exists(db, kwargs['driver_id']):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=Message.Error.USER_NOT_FOUND
            )
        if not is_driver(db, kwargs['driver_id']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=Message.Error.NOT_DRIVER
            )

    if 'company_id' in kwargs and kwargs['company_id'] is not None:
        if not company_exists(db, kwargs['company_id']):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=Message.Error.COMPANY_NOT_FOUND
            )

    if 'area' in kwargs and kwargs['area'] is not None and not kwargs['area'].strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Area cannot be empty"
        )

    for key, value in kwargs.items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order

def soft_delete_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id, Order.is_deleted == False).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )

    order.is_deleted = True
    db.commit()
    return order

def hard_delete_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )

    db.delete(order)
    db.commit()

def get_order_items(db: Session, order_id: int):
    if not order_exists(db, order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.ORDER_NOT_FOUND
        )
    
    items = (
        db.query(
            OrderItem,
            Gas.name.label("gas_name"),
            Gas.unit.label("gas_unit")
        )
        .join(Gas, OrderItem.gas_id == Gas.id)
        .filter(OrderItem.order_id == order_id)
        .all()
    )

    return [
        {
            "id": item.OrderItem.id,
            "gas_id": item.OrderItem.gas_id,
            "gas_name": item.gas_name,
            "gas_unit": item.gas_unit,
            "quantity": item.OrderItem.quantity
        }
        for item in items
    ]
