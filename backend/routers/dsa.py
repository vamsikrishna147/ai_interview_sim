import os
import requests
from fastapi import APIRouter

router = APIRouter()

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

@router.get("/api/dsa/trending")
def get_trending_dsa():
    if not SERPER_API_KEY:
        # Fallback dummy data if no Serper API key is provided
        return {
            "source": "Fallback AI Generator",
            "questions": [
                {"title": "Two Sum", "link": "https://leetcode.com/problems/two-sum/", "difficulty": "Easy", "frequency": "Very High"},
                {"title": "LRU Cache", "link": "https://leetcode.com/problems/lru-cache/", "difficulty": "Medium", "frequency": "High"},
                {"title": "Number of Islands", "link": "https://leetcode.com/problems/number-of-islands/", "difficulty": "Medium", "frequency": "High"},
                {"title": "Trapping Rain Water", "link": "https://leetcode.com/problems/trapping-rain-water/", "difficulty": "Hard", "frequency": "Medium"},
                {"title": "Merge Intervals", "link": "https://leetcode.com/problems/merge-intervals/", "difficulty": "Medium", "frequency": "High"}
            ]
        }

    import concurrent.futures
    import json

    queries = [
        "trending most asked interview questions this month site:leetcode.com",
        "trending most asked interview questions this month site:codechef.com",
        "trending most asked interview questions this month site:geeksforgeeks.org"
    ]
    url = "https://google.serper.dev/search"
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }

    def fetch_serper(q):
        try:
            payload = json.dumps({"q": q, "num": 10})
            res = requests.request("POST", url, headers=headers, data=payload)
            if res.status_code == 200:
                return res.json().get("organic", [])
            return []
        except:
            return []

    try:
        questions = []
        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = executor.map(fetch_serper, queries)
            
        for organic in results:
            for item in organic:  
                title = item.get("title", "").split(" - ")[0].replace(" | GeeksforGeeks", "").replace(" | CodeChef", "")
                link = item.get("link", "")
                snippet = item.get("snippet", "")
                
                # If we got a link from one of these domains, it's highly relevant. No need to strictly mandate /problems/
                if link:
                    questions.append({
                        "title": title,
                        "link": link,
                        "difficulty": "Unknown",
                        "frequency": "Trending Now",
                        "snippet": snippet
                    })
                
        if not questions:
            raise Exception("No problem links found from any of the sites.")

        return {
            "source": "Live Internet Data (Serper API)",
            "questions": questions
        }

    except Exception as e:
        print(f"Serper API Error: {e}")
        # Fallback if API fails
        return {
            "source": "Fallback Data (Serper Failed)",
            "questions": [
                {"title": "Reverse Linked List", "link": "https://leetcode.com/problems/reverse-linked-list/", "difficulty": "Easy", "frequency": "High"}
            ]
        }
