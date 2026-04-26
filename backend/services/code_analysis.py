from .ai_service import client
from google.genai import types
import json

def analyze_code_solution(question: str, code: str, language: str = 'python'):
    if not client:
        return {
            "correctness_score": 7.0,
            "readability_score": 8.0,
            "time_complexity": "O(N)",
            "feedback_text": "Good approach. Could be optimized.",
            "improvement_suggestion": "Use a hash map to reduce time complexity to O(1)."
        }
        
    prompt = f"""
    You are an expert, strict technical interviewer evaluating a coding challenge submitted in {language}.
    Question: "{question}"
    Candidate Code ({language}):
    ```
    {code}
    ```
    
    CRITICAL EVALUATION REQUIREMENTS:
    - Do not assume their code is good. Find bugs, edge cases they missed, and sub-optimal time/space complexities.
    - Evaluate the candidate's code heavily weighing standard library usage, naming conventions, and performance.
    - Return ONLY a JSON object with the following keys:
    - "correctness_score": float between 0 and 10 (deduct heavily for logic bugs).
    - "readability_score": float between 0 and 10 (deduct for poor names or lack of comments).
    - "time_complexity": string showing big O notation (e.g. O(N)).
    - "feedback_text": string explaining exactly what works, what fails, and why.
    - "improvement_suggestion": string giving actionable advice to write a FAANG-level optimal solution.
    - "execution_output": string containing the simulated standard output (stdout) or traceback errors if the code were to be run with a typical test case. If there are syntax errors, provide the error message here. If the code prints nothing, return "Process exited with 0".
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
        print(f"Error evaluating code: {e}")
        return {
            "correctness_score": 7.0,
            "readability_score": 8.0,
            "time_complexity": "O(N)",
            "feedback_text": "Good approach. Could be optimized.",
            "improvement_suggestion": "Use a hash map to reduce time complexity to O(1)."
        }
