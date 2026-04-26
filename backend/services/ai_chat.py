from typing import List, Dict
import json
from pydantic import BaseModel
from google.genai import types
from .ai_service import client

class ChatMessage(BaseModel):
    role: str
    content: str

def generate_video_chat_response(messages: List[Dict[str, str]], job_role: str, years_of_experience: int):
    """
    Simulates a continuous, conversational interview using Gemini.
    """
    if not client:
        return {
            "ai_response": "I am currently running in offline mode. Let's pretend I asked you a great follow-up question!",
            "evaluation": "Good"
        }

    system_prompt = f"""
    You are an expert technical and behavioral interviewer conducting an interactive video interview.
    The candidate is applying for a {job_role} role with {years_of_experience} years of experience.
    
    This is a continuous spoken conversation. Keep your responses CONCISE, spoken-word friendly (avoid complex markdown), and engaging.
    Ask one question or follow-up at a time. Do not overwhelm the candidate.
    
    You must return ONLY a JSON object with two keys:
    1. "ai_response": A string containing exactly what you want to say next to the candidate.
    2. "evaluation": A brief string analyzing their most recent answer (e.g. "Strong answer, clear communication", or "Lacked specific examples").
    """

    # We need to format the previous history for the Gemini model API. 
    # The models.generate_content takes `contents` which can be a list of dicts.
    
    # Let's pack the system instructions into the first message secretly,
    # or just prepend it to the context block if using simple text strings.
    
    formatted_history = "Interview Context/Rules:\n" + system_prompt + "\n\nConversation History:\n"
    
    for msg in messages:
        formatted_history += f"{'Interviewer' if msg['role'] == 'assistant' else 'Candidate'}: {msg['content']}\n"
        
    formatted_history += "\nInterviewer (Generate JSON response): "

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=formatted_history,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in video chat: {e}")
        return {
            "ai_response": "I'm sorry, I had trouble processing that. Could you repeat?",
            "evaluation": "Error processing answer."
        }
