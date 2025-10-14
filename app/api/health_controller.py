from fastapi import APIRouter
from app.dto.base_response import APIResponse

router = APIRouter()

@router.get("/ping", response_model=APIResponse)
def ping():
    return APIResponse(data={"status": "ok"}, statusCode=200, message="pong", technicalMessage=None)
