from pydantic import BaseModel
from typing import Any, Optional

class APIResponse(BaseModel):
    data: Optional[Any] = None
    statusCode: int
    message: str
    technicalMessage: Optional[str] = None
