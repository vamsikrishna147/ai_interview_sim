import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

try:
    client = genai.Client()
except Exception as e:
    client = None
    print("Warning: Google GenAI client failed to initialize in trend_service.", e)

def query_latest_trends(role: str):
    SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
    live_context = ""
    
    if SERPER_API_KEY:
        import requests
        url = "https://google.serper.dev/search"
        payload = json.dumps({"q": f"latest interview trends and frequently asked questions for {role} this month"})
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            data = response.json()
            snippets = [item.get("snippet", "") for item in data.get("organic", [])[:5]]
            live_context = "LIVE INTERNET SEARCH CONTEXT (Use this real-time data to ground your response):\n" + "\n".join(snippets)
        except Exception as e:
            print(f"Serper API Error in trends: {e}")

    if not client:
        return {
            "trends": ["AI Integration", "Cloud Native", "Remote Work Optimization"],
            "opportunities": ["High demand for specialized AI skills", "Growth in cybersecurity"],
            "latest_questions": [
                "How do you optimize an application for LLM latency?",
                "Design a scalable microservices architecture."
            ]
        }
    
    prompt = f"""
    You are an expert career analyst and technical recruiter.
    Analyze the current job market and provide the latest trends, opportunities, and most recent interview questions for the following role: "{role}".
    
    {live_context}
    
    Return ONLY a JSON object with the following schema:
    - "trends": Array of strings (top 3-5 current trends in this role/tech stack).
    - "opportunities": Array of strings (top 3-5 growth areas, certifications, or niche skills in demand).
    - "latest_questions": Array of strings (top 3-5 recently asked, real-world interview questions for this role).
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error generating trends: {e}")
        return {
            "trends": ["Error fetching trends - check API key or quota"],
            "opportunities": [],
            "latest_questions": []
        }
