
from sqlalchemy.orm import Session, joinedload
from app.models.users import User
from app.dto.user_dto import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_all_users(db: Session, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_dir: str = "asc"):
    query = db.query(User).options(joinedload(User.company), joinedload(User.role))

    if search:
        query = query.filter(User.name.contains(search) | User.email.contains(search))

    total_records = query.count()

    if sort_by and hasattr(User, sort_by):
        column = getattr(User, sort_by)
        if sort_dir == "asc":
            query = query.order_by(column.asc())
        else:
            query = query.order_by(column.desc())

    users = query.offset(skip).limit(limit).all()
    return users, total_records

def get_user(db: Session, user_id: int):
    return db.query(User).options(joinedload(User.company), joinedload(User.role)).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        address=user.address,
        company_id=user.company_id,
        role_id=user.role_id,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            db_user.password_hash = hashed_password
            del update_data["password"]
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

def get_all_drivers(db: Session):
    return db.query(User).filter(User.role_id == 3).all()
