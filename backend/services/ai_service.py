import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
# Assumes GEMINI_API_KEY is defined in environment variables
try:
    client = genai.Client()
except Exception as e:
    client = None
    print("Warning: Google GenAI client failed to initialize. Please check your GEMINI_API_KEY.", e)

def generate_interview_questions(role: str, interview_type: str, difficulty: str, topic: str = None, count: int = 10):
    if not client:
        # Fallback for local testing without API key
        return [
            {"question": "Tell me about yourself.", "type": "Speech"},
            {"question": "What is polymorphism?", "type": "Text"},
            {
                "question": "Which of the following is an HTTP method?",
                "type": "MCQ",
                "options": ["GET", "FETCH", "REQUIRE", "PULL"],
                "correct_answer": "GET"
            }
        ]
        
    topic_context = f"The specific topic for this interview is: {topic}." if topic else ""

    prompt = f"""
    You are an expert, strict senior technical interviewer at a top-tier tech company.
    Generate {count} highly rigorous, extremely realistic interview questions for a {difficulty} level {role} candidate.
    The interview type is {interview_type}.
    {topic_context}
    
    CRITICAL REQUIREMENTS FOR THE QUESTIONS:
    - Questions must NOT be trivial definitions (e.g., "What is polymorphism?").
    - Questions MUST be scenario-based, requiring the candidate to apply knowledge to a realistic problem.
    - If 'difficulty' is 'Hard' or 'Expert', the questions must involve system design trade-offs, edge cases, or deep architectural knowledge.
    - If the type is 'Code', provide a concrete, unambiguous algorithmic problem with specific input/output constraints.
    - Return ONLY a JSON array of objects with the following schema:
      - "question": the question text (ensure it is clear, accurate, scenario-based, and challenging).
      - "type": Choose exactly one of 'Speech', 'Text', 'Code', 'MCQ'.
        - 'Code' ONLY IF the candidate must write a full programming solution in an IDE.
        - 'Text' ONLY IF it is a theoretical/design question needing written explanation.
        - 'Speech' ONLY IF it is a behavioral or conceptual question meant to be answered aloud.
        - 'MCQ' ONLY IF there are multiple choice options.
      - "options": ONLY for 'MCQ' type. An array of exactly 4 plausible but tricky string options (e.g., ["A", "B", "C", "D"]).
      - "correct_answer": ONLY for 'MCQ' type. The exact string of the correct option.
      
    IMPORTANT: Maintain a good mix of all 4 types across the {count} questions if possible.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        questions = json.loads(response.text)
        return questions
    except Exception as e:
        print(f"Error generating questions: {e}")
        return [
            {"question": "Tell me about yourself.", "type": "Speech"},
            {"question": "What is polymorphism?", "type": "Text"}
        ]

def evaluate_answer(question: str, answer: str):
    if not client:
        return {
            "accuracy_score": 8.0,
            "clarity_score": 7.5,
            "feedback_text": "Good start, but lacks depth.",
            "improvement_suggestion": "Try adding real world examples.",
            "sample_better_answer": "A more complete answer would be..."
        }
        
    prompt = f"""
    You are an expert, unyielding senior technical interviewer at a top logic/software firm evaluating a candidate.
    Question asked: "{question}"
    Candidate answer: "{answer}"
    
    CRITICAL REQUIREMENTS FOR EVALUATION:
    - Do NOT sugarcoat feedback. Be extremely objective and appropriately harsh if the answer is wrong or shallow.
    - Provide deep, actionable technical insights.
    - Evaluate the candidate's answer and return ONLY a JSON object with the following keys:
      - "accuracy_score": float between 0 and 10 (be strict; a 10 means absolutely flawless).
      - "clarity_score": float between 0 and 10.
      - "feedback_text": string explaining exactly what the candidate did right and what they got wrong.
      - "improvement_suggestion": string giving actionable, highly technical advice on how to improve.
      - "sample_better_answer": string providing a comprehensive, senior-level sample response to the question.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        return {
            "accuracy_score": 8.0,
            "clarity_score": 7.5,
            "feedback_text": "Good start, but lacks depth.",
            "improvement_suggestion": "Try adding real world examples.",
            "sample_better_answer": "A more complete answer would be..."
        }
