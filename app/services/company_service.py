"""
Company Service Layer
---------------------
This module contains business logic and database operations for Company management.
Handles CRUD operations, soft delete/restore, search, and integrity constraints.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from app.models.company import Company
from app.messages.messages import Message
from fastapi import HTTPException, status

def create_company(db: Session, name: str, address: str | None = None) -> Company:
    """
    Create a new company or restore a soft-deleted one with the same name.
    """
    try:
        company = Company(name=name.strip(), address=address)
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    except IntegrityError:
        db.rollback()
        existing = db.query(Company).filter(
            Company.name == name.strip(), 
            Company.is_deleted == True
        ).first()
        if existing:
            existing.is_deleted = False
            existing.address = address
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=Message.Error.DUPLICATE_ENTRY
        )

def get_company_by_id(db: Session, company_id: int) -> Company:
    """
    Retrieve a company by its ID, excluding soft-deleted records.
    """
    company = db.query(Company).filter(Company.id == company_id, Company.is_deleted == False).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.NOT_FOUND
        )
    return company

def list_companies(db: Session, skip: int = 0, limit: int = 10, search: str = "") -> tuple[list[Company], int, int]:
    """
    List active companies with pagination, search, and counts for server-side processing.
    
    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        search: Search term to filter by name or address (case-insensitive)
        
    Returns:
        tuple[list[Company], int, int]: A tuple containing:
                                        - list of company objects
                                        - total number of active companies
                                        - number of companies after filtering
    """
    base_query = db.query(Company).filter(Company.is_deleted == False)
    
    total_records = base_query.count()
    
    search_query = base_query
    if search:
        search_term = f"%{search.strip()}%"
        search_query = base_query.filter(
            or_(
                Company.name.ilike(search_term),
                Company.address.ilike(search_term)
            )
        )
        
    filtered_records = search_query.count()
    
    companies = search_query.offset(skip).limit(limit).all()
    
    return companies, total_records, filtered_records

def update_company(db: Session, company_id: int, name: str | None, address: str | None) -> Company:
    """
    Update company details with duplicate name validation.
    """
    if name:
        existing = db.query(Company).filter(
            Company.name == name.strip(),
            Company.is_deleted == False,
            Company.id != company_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=Message.Error.DUPLICATE_ENTRY
            )
    
    company = get_company_by_id(db, company_id)
    
    if name is not None:
        company.name = name.strip()
    if address is not None:
        company.address = address
        
    db.commit()
    db.refresh(company)
    return company

def search_companies(db: Session, search_term: str, skip: int = 0, limit: int = 20) -> list[Company]:
    """
    Real-time company search for autocomplete and filtering.
    """
    if not search_term or len(search_term.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search term must be at least 2 characters"
        )
    
    companies = db.query(Company).filter(
        Company.name.ilike(f"%{search_term.strip()}%"),
        Company.is_deleted == False
    ).offset(skip).limit(limit).all()
    
    return companies

def soft_delete_company(db: Session, company_id: int) -> Company:
    """
    Soft delete a company by marking it as deleted (is_deleted = True).
    """
    company = get_company_by_id(db, company_id)
    company.is_deleted = True
    db.commit()
    return company

def permanent_delete_company(db: Session, company_id: int) -> None:
    """
    Permanently delete a company from the database (IRREVERSIBLE).
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Message.Error.NOT_FOUND
        )
    
    db.delete(company)
    db.commit()

def get_all_companies(db: Session) -> list[Company]:
    """
    Retrieve all non-deleted companies.
    """
    return db.query(Company).filter(Company.is_deleted == False).all()