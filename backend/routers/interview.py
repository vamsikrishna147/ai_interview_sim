from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database
import services.ai_service as ai_service
import services.code_analysis as code_analysis
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/interview", tags=["interview"])

class SubmitAnswerRequest(BaseModel):
    session_id: int
    question_id: int
    answer: str

class EvaluateCodeRequest(BaseModel):
    session_id: int
    question_id: int
    code: str
    language: str

@router.post("/submit")
def submit_answer(request: SubmitAnswerRequest, db: Session = Depends(database.get_db)):
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == request.question_id,
        models.InterviewQuestion.session_id == request.session_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.user_answer = request.answer
    db.commit()
    
    evaluation = ai_service.evaluate_answer(
        question.question_text, request.answer
    )
    
    question.accuracy_score = evaluation.get("accuracy_score")
    question.clarity_score = evaluation.get("clarity_score")
    question.feedback_text = evaluation.get("feedback_text")
    question.improvement_suggestion = evaluation.get("improvement_suggestion")
    question.sample_better_answer = evaluation.get("sample_better_answer")
    
    db.commit()
    return evaluation

@router.post("/evaluate_code")
def evaluate_code(request: EvaluateCodeRequest, db: Session = Depends(database.get_db)):
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == request.question_id,
        models.InterviewQuestion.session_id == request.session_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.user_answer = request.code
    db.commit()
    
    evaluation = code_analysis.analyze_code_solution(
        question.question_text, request.code, request.language
    )
    
    question.code_time_complexity = evaluation.get("time_complexity")
    # use accuracy score as correctness score
    question.accuracy_score = evaluation.get("correctness_score")
    question.clarity_score = evaluation.get("readability_score")
    question.feedback_text = evaluation.get("feedback_text")
    question.improvement_suggestion = evaluation.get("improvement_suggestion")
    
    db.commit()
    return evaluation
