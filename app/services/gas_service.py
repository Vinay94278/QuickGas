from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.gas import Gas
from app.messages.messages import Message
from fastapi import HTTPException, status

def create_gas(db: Session, name: str, unit: str | None, description: str | None):
     # Check if soft-deleted gas with same name exists
    existing_deleted = db.query(Gas).filter(
        Gas.name == name.strip(),
        Gas.is_deleted == True
    ).first()
    
    if existing_deleted:
        # Restore the soft-deleted gas instead of creating new
        existing_deleted.is_deleted = False
        existing_deleted.unit = unit
        existing_deleted.description = description
        db.commit()
        db.refresh(existing_deleted)
        return existing_deleted
    
    # Otherwise create new gas
    try:
        gas = Gas(name=name.strip(), unit=unit, description=description)
        db.add(gas)
        db.commit()
        db.refresh(gas)
        return gas
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=Message.Error.DUPLICATE_ENTRY
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{Message.Error.COMMON_ERROR}: {str(e)}"
        )

def get_gas_by_id(db: Session, gas_id: int):
    gas = db.query(Gas).filter(Gas.id == gas_id, Gas.is_deleted == False).first()
    if not gas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.NOT_FOUND
        )
    return gas

def list_gases(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Gas).filter(Gas.is_deleted == False).offset(skip).limit(limit).all()

def update_gas(db: Session, gas_id: int, name: str | None, unit: str | None, description: str | None):
    try:
        gas = get_gas_by_id(db, gas_id)
        
        if name is not None:
            gas.name = name.strip()
        if unit is not None:
            gas.unit = unit
        if description is not None:
            gas.description = description
            
        db.commit()
        db.refresh(gas)
        return gas
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=Message.Error.DUPLICATE_ENTRY
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{Message.Error.COMMON_ERROR}: {str(e)}"
        )

def soft_delete_gas(db: Session, gas_id: int):
    try:
        gas = get_gas_by_id(db, gas_id)
        gas.is_deleted = True
        db.commit()
        return gas
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{Message.Error.COMMON_ERROR}: {str(e)}"
        )

def search_gases(db: Session, name: str | None = None, skip: int = 0, limit: int = 50):
    query = db.query(Gas).filter(Gas.is_deleted == False)
    
    if name:
        query = query.filter(Gas.name.ilike(f"%{name}%"))
        
    return query.offset(skip).limit(limit).all()