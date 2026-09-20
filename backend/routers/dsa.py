import os
import requests
import json
import concurrent.futures
from fastapi import APIRouter

router = APIRouter()

CURATED_FALLBACK = [
    {"title": "Two Sum", "link": "https://leetcode.com/problems/two-sum/", "difficulty": "Easy", "frequency": "Very High", "platform": "LeetCode"},
    {"title": "Best Time to Buy and Sell Stock", "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "difficulty": "Easy", "frequency": "Very High", "platform": "LeetCode"},
    {"title": "Valid Parentheses", "link": "https://leetcode.com/problems/valid-parentheses/", "difficulty": "Easy", "frequency": "High", "platform": "LeetCode"},
    {"title": "Merge Two Sorted Lists", "link": "https://leetcode.com/problems/merge-two-sorted-lists/", "difficulty": "Easy", "frequency": "High", "platform": "LeetCode"},
    {"title": "Longest Common Subsequence", "link": "https://leetcode.com/problems/longest-common-subsequence/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "LRU Cache", "link": "https://leetcode.com/problems/lru-cache/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Number of Islands", "link": "https://leetcode.com/problems/number-of-islands/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Trapping Rain Water", "link": "https://leetcode.com/problems/trapping-rain-water/", "difficulty": "Hard", "frequency": "High", "platform": "LeetCode"},
    {"title": "Merge Intervals", "link": "https://leetcode.com/problems/merge-intervals/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Binary Tree Level Order Traversal", "link": "https://leetcode.com/problems/binary-tree-level-order-traversal/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Maximum Subarray (Kadane's)", "link": "https://practice.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1", "difficulty": "Medium", "frequency": "Very High", "platform": "GeeksForGeeks"},
    {"title": "Reverse a Linked List", "link": "https://practice.geeksforgeeks.org/problems/reverse-a-linked-list/1", "difficulty": "Easy", "frequency": "Very High", "platform": "GeeksForGeeks"},
    {"title": "Detect Cycle in a Linked List", "link": "https://practice.geeksforgeeks.org/problems/detect-loop-in-linked-list/1", "difficulty": "Easy", "frequency": "High", "platform": "GeeksForGeeks"},
    {"title": "Largest Rectangle in Histogram", "link": "https://leetcode.com/problems/largest-rectangle-in-histogram/", "difficulty": "Hard", "frequency": "Medium", "platform": "LeetCode"},
    {"title": "Word Break", "link": "https://leetcode.com/problems/word-break/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "0-1 Knapsack Problem", "link": "https://practice.geeksforgeeks.org/problems/0-1-knapsack-problem/1", "difficulty": "Medium", "frequency": "Very High", "platform": "GeeksForGeeks"},
    {"title": "Course Schedule (Topological Sort)", "link": "https://leetcode.com/problems/course-schedule/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Median of Two Sorted Arrays", "link": "https://leetcode.com/problems/median-of-two-sorted-arrays/", "difficulty": "Hard", "frequency": "High", "platform": "LeetCode"},
    {"title": "Longest Palindromic Substring", "link": "https://leetcode.com/problems/longest-palindromic-substring/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
    {"title": "Coin Change", "link": "https://leetcode.com/problems/coin-change/", "difficulty": "Medium", "frequency": "High", "platform": "LeetCode"},
]

@router.get("/api/dsa/trending")
def get_trending_dsa():
    SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

    if not SERPER_API_KEY:
        return {"source": "Curated Top Problems", "questions": CURATED_FALLBACK}

    # Simple queries - NO site: or OR operators (blocked on free tier)
    queries = [
        "top trending leetcode interview problems this month",
        "most asked geeksforgeeks coding interview questions 2024",
        "trending codechef competitive programming problems",
    ]
    url = "https://google.serper.dev/search"
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }

    def fetch_serper(q):
        try:
            payload = json.dumps({"q": q, "num": 10})
            res = requests.post(url, headers=headers, data=payload, timeout=8)
            if res.status_code == 200:
                return res.json().get("organic", [])
            return []
        except Exception:
            return []

    try:
        questions = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            all_results = list(executor.map(fetch_serper, queries))

        seen_links = set()
        for organic in all_results:
            for item in organic:
                link = item.get("link", "")
                title = item.get("title", "").split(" - ")[0].replace(" | GeeksforGeeks", "").replace(" | CodeChef", "").replace(" - LeetCode", "").strip()
                snippet = item.get("snippet", "")

                platform = "Other"
                if "leetcode.com" in link:
                    platform = "LeetCode"
                elif "geeksforgeeks.org" in link or "practice.geeksforgeeks" in link:
                    platform = "GeeksForGeeks"
                elif "codechef.com" in link:
                    platform = "CodeChef"

                if not link or link in seen_links or platform == "Other":
                    continue
                seen_links.add(link)

                questions.append({
                    "title": title,
                    "link": link,
                    "difficulty": "Unknown",
                    "frequency": "Trending Now",
                    "snippet": snippet,
                    "platform": platform
                })

        if not questions:
            raise Exception("No relevant results from Serper")

        return {"source": "Live Internet Data (Serper API)", "questions": questions}

    except Exception as e:
        print(f"Serper DSA Error: {e}")
        return {"source": "Curated Top Problems", "questions": CURATED_FALLBACK}

