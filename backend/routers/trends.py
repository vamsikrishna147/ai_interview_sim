from fastapi import APIRouter
import services.trend_service as trend_service

router = APIRouter()

@router.get("/api/trends/{role}")
def get_trends(role: str):
    data = trend_service.query_latest_trends(role)
    # Guarantee all keys exist with defaults — prevents 422 when Gemini returns partial JSON
    return {
        "trends": data.get("trends", []),
        "opportunities": data.get("opportunities", []),
        "latest_questions": data.get("latest_questions", []),
    }
