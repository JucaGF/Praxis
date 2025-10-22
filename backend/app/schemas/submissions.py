from pydantic import BaseModel
from typing import Dict, Optional


class SubmissionIn(BaseModel):
    """Schema for POST /submissions request body"""
    files: Dict[str, str]  # {path: content} for code submissions
    answer: str  # String for text/planning submissions
    commit_message: Optional[str] = None  # Optional metadata
    notes: Optional[str] = None  # Optional metadata


class SubmissionOut(BaseModel):
    """Schema for submission response from API"""
    score: float
    metrics: Dict[str, float]  # Additional metrics
    feedback_summary: str
    # Add other response fields as needed

