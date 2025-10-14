from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.core.role import AdminOnly
from app.services.dashboard_service import get_dashboard_insights
from app.dto.base_response import APIResponse
from app.dto.dashboard_dto import DashboardResponse, DashboardInsights
from app.messages.messages import Message

router = APIRouter(tags=["dashboard"])


@router.get("/", response_model=APIResponse, dependencies=[Depends(AdminOnly)])
def get_dashboard_insights_endpoint(db: Session = Depends(get_db)):
    """
    Get insightful data for the admin dashboard.
    """
    insights = get_dashboard_insights(db)
    return APIResponse(
        data=DashboardInsights(**insights),
        statusCode=status.HTTP_200_OK,
        message=Message.Success.FETCHED_SUCCESSFULLY
    )
