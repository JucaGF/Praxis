from pydantic import BaseModel
from typing import Optional, Dict, Any

class FeedbackCreate(BaseModel):
    submission_id: int
    feedback: str
    score: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    raw_ai_response: Optional[Dict[str, Any]] = None