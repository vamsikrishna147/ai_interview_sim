from fastapi import APIRouter
from pydantic import BaseModel
import services.ml_service as ml_service

router = APIRouter()

class PredictionRequest(BaseModel):
    question_text: str

class PredictionResponse(BaseModel):
    predicted_difficulty: str

@router.post("/api/ml/predict-difficulty", response_model=PredictionResponse)
def predict_difficulty(request: PredictionRequest):
    difficulty = ml_service.predict_difficulty(request.question_text)
    return {"predicted_difficulty": difficulty}
