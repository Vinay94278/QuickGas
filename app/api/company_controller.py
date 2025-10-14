from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.dto.base_response import APIResponse
from app.dto.company_dto import CompanyCreate, CompanyUpdate, CompanyRead, CompanyNameRead
from app.services.company_service import (
    create_company, get_company_by_id, list_companies,
    update_company, soft_delete_company, permanent_delete_company, get_all_companies
)
from app.dependencies import get_db
from app.core.role import AdminOnly, StaffOnly
from app.messages.messages import Message

router = APIRouter(prefix="/companies", tags=["companies"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_company_endpoint(
    payload: CompanyCreate, 
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Create a new company (Admin only)"""
    company = create_company(db, payload.name, payload.address)
    return APIResponse(
        data=CompanyRead.from_orm(company),
        statusCode=status.HTTP_201_CREATED,
        message=Message.Success.COMPANY_CREATED
    )

@router.get("/all", response_model=APIResponse)
def list_all_companies_endpoint(
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """List all companies for dropdowns (Staff only)"""
    companies = get_all_companies(db)
    return APIResponse(
        data=[CompanyNameRead.from_orm(c) for c in companies],
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_RETRIEVED
    )

@router.get("/{company_id}", response_model=APIResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(StaffOnly)
):
    """Get a specific company by ID (Staff only)"""
    company = get_company_by_id(db, company_id)
    return APIResponse(
        data=CompanyRead.from_orm(company),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_RETRIEVED
    )

@router.get("/", response_model=APIResponse)
def list_companies_endpoint(
    skip: int = Query(0, ge=0, alias="start"),
    limit: int = Query(10, ge=1, le=100, alias="length"),
    search: str = Query("", alias="search[value]"), 
    db: Session = Depends(get_db),
    user: dict = Depends(StaffOnly)
):
    """List all companies with server-side processing and search (Staff only)"""
    companies, total_records, filtered_records = list_companies(db, skip=skip, limit=limit, search=search)
    company_data = [CompanyRead.from_orm(c) for c in companies]

    response_data = {
        "recordsTotal": total_records,
        "recordsFiltered": filtered_records,
        "data": company_data
    }
    
    return APIResponse(
        data=response_data,
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_RETRIEVED
    )

@router.put("/{company_id}", response_model=APIResponse)
def update_company_endpoint(
    company_id: int,
    payload: CompanyUpdate,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Update a company (Admin only)"""
    company = update_company(db, company_id, payload.name, payload.address)
    return APIResponse(
        data=CompanyRead.from_orm(company),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_UPDATED
    )

@router.delete("/{company_id}", response_model=APIResponse)
def delete_company_endpoint(
    company_id: int,
    db: Session = Depends(get_db), 
    user: dict = Depends(AdminOnly)
):
    """Soft delete a company (Admin only)"""
    company = soft_delete_company(db, company_id)
    return APIResponse(
        data=CompanyRead.from_orm(company),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_DELETED
    )

@router.delete("/permanent/{company_id}", response_model=APIResponse)
def permanent_delete_company_endpoint(
    company_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(AdminOnly)
):
    """Permanently delete a company (Admin only). Use with caution."""
    permanent_delete_company(db, company_id)
    return APIResponse(
        statusCode=status.HTTP_200_OK,
        message=Message.Success.COMPANY_PERMANENT_DELETE
    )
