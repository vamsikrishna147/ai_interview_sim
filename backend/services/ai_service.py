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

import services.trend_service as trend_service
import csv
import random

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml_training", "data", "full_interview_questions_dataset.csv")

def get_csv_questions(role: str, difficulty: str, limit: int):
    results = []
    if not os.path.exists(CSV_PATH):
        return results
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Filter by simple substring match for robustness
            candidates = [
                row for row in reader 
                if role.lower() in row.get('role', '').lower() 
                and difficulty.lower() == row.get('difficulty', '').lower()
            ]
            if candidates:
                sampled = random.sample(candidates, min(len(candidates), limit))
                for s in sampled:
                    results.append({
                        "question": s['question'],
                        "type": "Speech"  # Default type for simple text questions
                    })
    except Exception as e:
        print(f"Error reading CSV dataset: {e}")
    return results
def generate_interview_questions(role: str, interview_type: str, difficulty: str, topic: str = None, company: str = "Generic", count: int = 10):
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
    company_context = f"The target company is {company}. Ensure questions perfectly mimic {company}'s actual interview style, rigorous constraints, and cultural framework (e.g. Amazon Leadership Principles, Google's algorithmic complexity focus)." if company and company != "Generic" else ""

    # Fetch recent trends to inject into the prompt
    trends_data = trend_service.query_latest_trends(role)
    trends_str = ", ".join(trends_data.get("trends", []))
    trending_context = f"Ensure the questions incorporate these latest industry trends for {role}: {trends_str}." if trends_str else ""

    # 1. Fetch from CSV dataset
    csv_count = count // 2
    csv_questions = get_csv_questions(role, difficulty, csv_count)
    
    # 2. Generate remainder with Gemini
    gemini_count = count - len(csv_questions)
    gemini_questions = []
    
    if gemini_count > 0:
        if difficulty.lower() == 'easy':
            persona = "You are a friendly, encouraging technical interviewer."
            diff_rules = "- Keep questions fundamental, straightforward, and easy to understand.\n        - Do NOT ask overly complex system design or advanced algorithmic puzzles."
        elif difficulty.lower() == 'medium':
            persona = "You are a standard, professional technical interviewer."
            diff_rules = "- Ask practical, mid-level questions that test real-world application."
        else:
            persona = "You are a rigorous, demanding senior technical interviewer at a top-tier tech company."
            diff_rules = "- Questions must involve massive system design trade-offs, extreme edge cases, or deep architectural knowledge."

        csv_context = "Use the following verified questions as a baseline for difficulty and tone: " + " ".join([q['question'] for q in csv_questions]) if csv_questions else ""

        prompt = f"""
        {persona}
        Generate {gemini_count} realistic interview questions for a {difficulty} level {role} candidate.
        The interview type is {interview_type}.
        {topic_context}
        {company_context}
        {trending_context}
        {csv_context}
        
        CRITICAL REQUIREMENTS FOR THE QUESTIONS:
        {diff_rules}
        - If the type is 'Code', provide a concrete algorithmic problem with specific input/output constraints.
        - Return ONLY a JSON array of objects with the following schema:
          - "question": the question text (ensure it is clear and accurate).
          - "type": Choose exactly one of 'Speech', 'Text', 'Code', 'MCQ'.
          - "options": ONLY for 'MCQ' type. An array of exactly 4 plausible options (e.g., ["A", "B", "C", "D"]).
          - "correct_answer": ONLY for 'MCQ' type. The exact string of the correct option.
          
        IMPORTANT: Maintain a good mix of all 4 types across the {gemini_count} questions if possible.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            gemini_questions = json.loads(response.text)
        except Exception as e:
            print(f"Error generating questions: {e}")
            gemini_questions = [
                {"question": "Tell me about yourself.", "type": "Speech"}
            ]

    # Combine and shuffle
    combined = csv_questions + gemini_questions
    random.shuffle(combined)
    return combined

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
    You are an expert technical interviewer evaluating a candidate.
    Question asked: "{question}"
    Candidate answer: "{answer}"
    
    CRITICAL REQUIREMENTS FOR EVALUATION:
    - Provide objective, constructive feedback.
    - Provide deep, actionable technical insights.
    - Evaluate the candidate's answer and return ONLY a JSON object with the following keys:
      - "accuracy_score": float between 0 and 10.
      - "clarity_score": float between 0 and 10.
      - "feedback_text": string explaining exactly what the candidate did right and what they got wrong.
      - "improvement_suggestion": string giving actionable, highly technical advice on how to improve.
      - "sample_better_answer": string providing a comprehensive, sample response to the question.
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
