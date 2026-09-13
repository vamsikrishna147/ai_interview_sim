from fastapi import APIRouter
from pydantic import BaseModel
import services.trend_service as trend_service

router = APIRouter()

class TrendResponse(BaseModel):
    trends: list[str]
    opportunities: list[str]
    latest_questions: list[str]

@router.get("/api/trends/{role}", response_model=TrendResponse)
def get_trends(role: str):
    data = trend_service.query_latest_trends(role)
    return data
