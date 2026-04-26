from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict
import services.ai_chat as ai_chat

router = APIRouter(prefix="/api/video", tags=["video_interview"])

class ChatMessage(BaseModel):
    role: str
    content: str

class VideoChatRequest(BaseModel):
    messages: List[ChatMessage]
    job_role: str = "Software Engineer"
    years_experience: int = 2

@router.post("/chat")
def video_chat(request: VideoChatRequest):
    # Convert Pydantic models to dicts for the service
    messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    response = ai_chat.generate_video_chat_response(
        messages=messages_dict,
        job_role=request.job_role,
        years_of_experience=request.years_experience
    )
    
    return response
