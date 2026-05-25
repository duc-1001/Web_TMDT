from pydantic import BaseModel
from typing import Optional

class RefundStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None