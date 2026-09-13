import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from pydantic import BaseModel, Field

import database
import models
database.Base.metadata.create_all(bind=database.engine)

import routers.interview
import routers.video_interview
import routers.trends
import routers.ml
import routers.dsa

app = FastAPI(title="AI Interview Simulator API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5174").split(",")
SESSION_SECRET = os.getenv("SESSION_SECRET", "super_secret_session_key")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.interview.router)
app.include_router(routers.video_interview.router)
app.include_router(routers.dsa.router)
app.include_router(routers.trends.router)
app.include_router(routers.ml.router)

class InterviewSetupRequest(BaseModel):
    role: str = Field(..., max_length=100)
    interview_type: str = Field(..., max_length=50)
    difficulty: str = Field(..., max_length=50)
    topic: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field("Generic", max_length=100)

class InterviewSetupResponse(BaseModel):
    session_id: int
    message: str
    questions: list

class AnswerSubmissionRequest(BaseModel):
    session_id: int
    question_id: int
    answer: str = Field(..., max_length=10000)

class CodeEvaluationRequest(BaseModel):
    session_id: int
    question_id: int
    code: str = Field(..., max_length=20000)

@app.post("/api/setup", response_model=InterviewSetupResponse)
def setup_interview(request: InterviewSetupRequest, db: Session = Depends(database.get_db)):
    # Create session
    db_session = models.InterviewSession(
        user_id=None,
        role=request.role,
        interview_type=request.interview_type,
        difficulty=request.difficulty,
        topic=request.topic
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Generate questions using AI
    import services.ai_service as ai
    generated = ai.generate_interview_questions(
        request.role, request.interview_type, request.difficulty, request.topic, request.company
    )
    
    for q in generated:
        db_question = models.InterviewQuestion(
            session_id=db_session.id, 
            question_text=q.get("question", "Sample Q"), 
            question_type=q.get("type", "Speech"),
            options=json.dumps(q.get("options")) if q.get("options") else None,
            correct_answer=q.get("correct_answer")
        )
        db.add(db_question)
    
    db.commit()
    
    return {
        "session_id": db_session.id,
        "message": "Interview session created",
        "questions": [
            {
                "id": q.id, 
                "text": q.question_text, 
                "type": q.question_type,
                "options": json.loads(q.options) if q.options else None
            } for q in db_session.questions
        ]
    }

@app.post("/api/resume/analyze")
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    import services.resume_service as resume_service
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    try:
        content = await file.read()
        result = resume_service.analyze_resume(content, file.filename)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DashboardMetricsRequest(BaseModel):
    session_ids: List[int] = []

@app.post("/api/dashboard/metrics")
def get_dashboard_metrics(request: DashboardMetricsRequest, db: Session = Depends(database.get_db)):
    if not request.session_ids:
        return {
            "total_sessions": 0,
            "average_accuracy": 0,
            "average_clarity": 0
        }
        
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.id.in_(request.session_ids)).all()
    # Basic metrics
    total = len(sessions)
    session_ids = [s.id for s in sessions]
    
    all_questions = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.accuracy_score != None,
        models.InterviewQuestion.session_id.in_(session_ids)
    ).all() if session_ids else []
    
    avg_accuracy = sum(q.accuracy_score for q in all_questions) / len(all_questions) if all_questions else 0
    avg_clarity = sum(q.clarity_score for q in all_questions) / len(all_questions) if all_questions else 0
    
    return {
        "total_sessions": total,
        "average_accuracy": round(avg_accuracy, 2),
        "average_clarity": round(avg_clarity, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
