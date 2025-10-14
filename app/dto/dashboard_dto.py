from pydantic import BaseModel
from typing import Dict

class DashboardInsights(BaseModel):
    total_pending_orders: int
    gas_requirements: Dict[str, float]
    total_completed_orders: int
    total_out_for_delivery_orders: int

class DashboardResponse(BaseModel):
    data: DashboardInsights
    message: str
