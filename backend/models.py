from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import database

class User(database.Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sessions = relationship("InterviewSession", back_populates="user")

class InterviewSession(database.Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # made nullable for backwards compatibility
    role = Column(String, index=True)
    interview_type = Column(String)  # Technical, Behavioral, HR
    difficulty = Column(String)
    topic = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session")

class InterviewQuestion(database.Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    question_text = Column(Text)
    question_type = Column(String) # Speech, Text, Code, MCQ
    options = Column(Text, nullable=True) # JSON string for MCQ options
    correct_answer = Column(Text, nullable=True) # string for MCQ correct choice
    
    user_answer = Column(Text, nullable=True)
    
    # AI Feedback
    accuracy_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    feedback_text = Column(Text, nullable=True)
    improvement_suggestion = Column(Text, nullable=True)
    sample_better_answer = Column(Text, nullable=True)
    
    # Coding specific
    code_time_complexity = Column(String, nullable=True)
    
    session = relationship("InterviewSession", back_populates="questions")
