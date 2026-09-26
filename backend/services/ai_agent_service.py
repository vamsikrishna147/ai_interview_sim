"""
Multi-Agent Interview Pipeline using LangGraph.

Architecture:
  Agent 1 (Query Analyzer) --> Agent 2 (Action Executor)

Agent 1: Reads the user request context (role, difficulty, company, type),
         fetches live Serper trends, and builds a structured "Generation Plan"
         as a rich JSON object.

Agent 2: Reads the Generation Plan and executes it — generates the final
         interview questions or evaluations in the exact required JSON schema.
"""

import os
import json
import csv
import random
import requests
from typing import TypedDict, List, Optional

from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
#  Shared Gemini client
# ─────────────────────────────────────────────
try:
    _gemini_client = genai.Client()
except Exception as e:
    _gemini_client = None
    print(f"[AgentService] Gemini client failed to init: {e}")

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "ml_training", "data", "full_interview_questions_dataset.csv"
)


# ─────────────────────────────────────────────
#  LangGraph State
# ─────────────────────────────────────────────
class InterviewState(TypedDict):
    # Inputs
    role: str
    interview_type: str
    difficulty: str
    topic: Optional[str]
    company: str
    count: int
    mode: str  # "generate" or "evaluate"

    # For evaluate mode
    question: Optional[str]
    answer: Optional[str]

    # Internal state passed between agents
    generation_plan: Optional[str]   # Agent 1 → Agent 2

    # Output
    final_output: Optional[str]      # Agent 2 → caller


# ─────────────────────────────────────────────
#  Helper: Serper live search
# ─────────────────────────────────────────────
def _serper_search(query: str, num: int = 5) -> str:
    """Returns a brief summary string from Serper organic results."""
    if not SERPER_API_KEY:
        return ""
    try:
        res = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
            data=json.dumps({"q": query, "num": num}),
            timeout=6,
        )
        if res.status_code == 200:
            snippets = [item.get("snippet", "") for item in res.json().get("organic", [])[:num]]
            return "\n".join(snippets)
    except Exception as e:
        print(f"[AgentService] Serper error: {e}")
    return ""


# ─────────────────────────────────────────────
#  Helper: CSV questions
# ─────────────────────────────────────────────
def _get_csv_questions(role: str, difficulty: str, limit: int) -> List[dict]:
    results = []
    if not os.path.exists(CSV_PATH):
        return results
    try:
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            candidates = [
                row for row in reader
                if role.lower() in row.get("role", "").lower()
                and difficulty.lower() == row.get("difficulty", "").lower()
            ]
            if candidates:
                sampled = random.sample(candidates, min(len(candidates), limit))
                for s in sampled:
                    results.append({"question": s["question"], "type": "Speech"})
    except Exception as e:
        print(f"[AgentService] CSV read error: {e}")
    return results


def _call_gemini_json(prompt: str) -> str:
    """Call Gemini and return the raw text (expected to be JSON)."""
    if not _gemini_client:
        return "{}"
    response = _gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    return response.text


# ═════════════════════════════════════════════
#  AGENT 1: Query Analyzer
# ═════════════════════════════════════════════
def agent_query_analyzer(state: InterviewState) -> InterviewState:
    """
    Reads the user's request, fetches live internet context via Serper,
    pulls CSV baseline questions, and produces a rich, structured
    Generation Plan as a JSON string.
    """
    role = state["role"]
    difficulty = state["difficulty"]
    company = state.get("company", "Generic")
    interview_type = state.get("interview_type", "Technical")
    topic = state.get("topic") or ""
    count = state.get("count", 10)
    mode = state.get("mode", "generate")

    if mode == "evaluate":
        # For evaluation mode, the plan is simpler
        plan = json.dumps({
            "mode": "evaluate",
            "question": state.get("question", ""),
            "answer": state.get("answer", ""),
        })
        return {**state, "generation_plan": plan}

    # ── 1. Fetch live Serper context ──────────────────────────────────────
    serper_query = f"latest {role} interview questions {company} {difficulty} level 2024"
    live_context = _serper_search(serper_query, num=5)

    # ── 2. Pull CSV baseline questions ───────────────────────────────────
    csv_limit = max(count // 2, 1)
    csv_questions = _get_csv_questions(role, difficulty, csv_limit)
    csv_text = "; ".join([q["question"] for q in csv_questions]) if csv_questions else "None available"

    # ── 3. Ask Gemini to analyze and produce a Generation Plan ───────────
    analyzer_prompt = f"""
You are an expert technical interview curriculum designer.
Analyze the following interview setup request and produce a detailed "Generation Plan" 
that the downstream question-generation agent will follow strictly.

REQUEST DETAILS:
- Role: {role}
- Interview Type: {interview_type}
- Difficulty: {difficulty}
- Target Company: {company}
- Specific Topic Focus: {topic if topic else "No specific topic, cover the core stack broadly"}
- Number of questions to generate: {count - len(csv_questions)} (we already have {len(csv_questions)} from our verified dataset)

LIVE INTERNET CONTEXT (from Serper API — use this to make questions current):
{live_context if live_context else "No live data available — rely on your training knowledge."}

VERIFIED DATASET BASELINE (these questions already exist — use as difficulty/tone reference):
{csv_text}

OUTPUT a JSON object with these exact keys:
{{
  "role": "{role}",
  "company_style_notes": "describe {company}'s specific interview style, focus areas, and key differentiators",
  "difficulty_persona": "describe the exact interviewer persona for {difficulty} difficulty",
  "trending_topics": ["list of 3-5 trending tech topics to weave in"],
  "question_type_distribution": {{"Speech": 2, "Text": 3, "Code": 3, "MCQ": 2}},
  "gemini_question_count": {count - len(csv_questions)},
  "csv_questions": {json.dumps(csv_questions)},
  "topic_focus": "{topic if topic else 'broad core stack'}",
  "special_instructions": "any company-specific or topic-specific generation instructions"
}}
"""
    try:
        plan_text = _call_gemini_json(analyzer_prompt)
        # Validate it's parseable
        parsed = json.loads(plan_text)
        parsed["csv_questions"] = csv_questions  # Ensure CSV questions are embedded
        plan = json.dumps(parsed)
    except Exception as e:
        print(f"[Agent1] Plan generation failed, using fallback plan: {e}")
        plan = json.dumps({
            "role": role,
            "company_style_notes": f"Standard {company} interview",
            "difficulty_persona": f"{difficulty} level interviewer",
            "trending_topics": ["System Design", "Algorithms", "OOP"],
            "question_type_distribution": {"Speech": 2, "Text": 3, "Code": 3, "MCQ": 2},
            "gemini_question_count": count - len(csv_questions),
            "csv_questions": csv_questions,
            "topic_focus": topic or "broad core stack",
            "special_instructions": "",
        })

    return {**state, "generation_plan": plan}


# ═════════════════════════════════════════════
#  AGENT 2: Action Executor
# ═════════════════════════════════════════════
def agent_action_executor(state: InterviewState) -> InterviewState:
    """
    Reads the Generation Plan from Agent 1 and executes it.
    For 'generate' mode: produces a final JSON array of interview questions.
    For 'evaluate' mode: produces a final JSON evaluation object.
    """
    plan_text = state.get("generation_plan", "{}")
    mode = state.get("mode", "generate")

    try:
        plan = json.loads(plan_text)
    except Exception:
        plan = {}

    if mode == "evaluate":
        question = plan.get("question", state.get("question", ""))
        answer = plan.get("answer", state.get("answer", ""))

        eval_prompt = f"""
You are a world-class technical interviewer evaluating a candidate's response.

QUESTION: "{question}"
CANDIDATE ANSWER: "{answer}"

Your evaluation must be rigorous, specific, and actionable.

Return ONLY a JSON object:
{{
  "accuracy_score": <float 0-10>,
  "clarity_score": <float 0-10>,
  "feedback_text": "<detailed explanation of what candidate got right and wrong>",
  "improvement_suggestion": "<specific, actionable technical advice>",
  "sample_better_answer": "<a comprehensive, exemplary answer>"
}}
"""
        try:
            result = _call_gemini_json(eval_prompt)
            return {**state, "final_output": result}
        except Exception as e:
            print(f"[Agent2] Evaluation failed: {e}")
            fallback = json.dumps({
                "accuracy_score": 7.0,
                "clarity_score": 7.0,
                "feedback_text": "Could not evaluate at this time.",
                "improvement_suggestion": "Review the topic and try again.",
                "sample_better_answer": "N/A",
            })
            return {**state, "final_output": fallback}

    # ── Generate mode ─────────────────────────────────────────────────────
    gemini_count = plan.get("gemini_question_count", 5)
    csv_questions = plan.get("csv_questions", [])
    dist = plan.get("question_type_distribution", {"Speech": 2, "Text": 2, "Code": 2, "MCQ": 2})
    company_notes = plan.get("company_style_notes", "")
    persona = plan.get("difficulty_persona", "professional interviewer")
    trending = ", ".join(plan.get("trending_topics", []))
    topic_focus = plan.get("topic_focus", "")
    special = plan.get("special_instructions", "")

    generation_prompt = f"""
You are acting as: {persona}

Generate exactly {gemini_count} interview questions following this precise plan:

COMPANY STYLE: {company_notes}
TRENDING TOPICS TO WEAVE IN: {trending}
TOPIC FOCUS: {topic_focus}
SPECIAL INSTRUCTIONS: {special}

QUESTION TYPE DISTRIBUTION (try to match this spread):
{json.dumps(dist)}

CRITICAL RULES:
- If type is 'Code': provide a concrete algorithmic problem with exact input/output examples.
- If type is 'MCQ': provide exactly 4 options and mark the correct one.
- If type is 'Speech': open-ended behavioral/conceptual questions.
- If type is 'Text': short written technical explanations.
- Make questions feel like they genuinely came from a {plan.get("role", "Software Engineer")} interview at this company.
- Do NOT generate generic textbook questions. Questions must feel real and current.

Return ONLY a JSON array of objects:
[
  {{
    "question": "<question text>",
    "type": "<Speech|Text|Code|MCQ>",
    "options": ["A", "B", "C", "D"],       // ONLY for MCQ
    "correct_answer": "<exact option text>" // ONLY for MCQ
  }}
]
"""
    try:
        gemini_raw = _call_gemini_json(generation_prompt)
        gemini_questions = json.loads(gemini_raw)
        if not isinstance(gemini_questions, list):
            gemini_questions = []
    except Exception as e:
        print(f"[Agent2] Question generation failed: {e}")
        gemini_questions = [{"question": "Tell me about yourself.", "type": "Speech"}]

    combined = csv_questions + gemini_questions
    random.shuffle(combined)
    return {**state, "final_output": json.dumps(combined)}


# ═════════════════════════════════════════════
#  LangGraph Workflow
# ═════════════════════════════════════════════
def _build_graph():
    try:
        from langgraph.graph import StateGraph, END

        builder = StateGraph(InterviewState)
        builder.add_node("query_analyzer", agent_query_analyzer)
        builder.add_node("action_executor", agent_action_executor)

        builder.set_entry_point("query_analyzer")
        builder.add_edge("query_analyzer", "action_executor")
        builder.add_edge("action_executor", END)

        return builder.compile()
    except ImportError:
        print("[AgentService] LangGraph not installed — using sequential fallback")
        return None


_graph = _build_graph()


# ─────────────────────────────────────────────
#  Public API (called by ai_service.py)
# ─────────────────────────────────────────────
def run_generate_pipeline(
    role: str,
    interview_type: str,
    difficulty: str,
    topic: Optional[str] = None,
    company: str = "Generic",
    count: int = 10,
) -> List[dict]:
    """Run the 2-agent pipeline and return a list of question dicts."""
    initial_state: InterviewState = {
        "role": role,
        "interview_type": interview_type,
        "difficulty": difficulty,
        "topic": topic,
        "company": company,
        "count": count,
        "mode": "generate",
        "question": None,
        "answer": None,
        "generation_plan": None,
        "final_output": None,
    }

    if _graph:
        result = _graph.invoke(initial_state)
    else:
        # Graceful sequential fallback if LangGraph not available
        s1 = agent_query_analyzer(initial_state)
        result = agent_action_executor(s1)

    try:
        return json.loads(result.get("final_output", "[]"))
    except Exception:
        return [{"question": "Tell me about yourself.", "type": "Speech"}]


def run_evaluate_pipeline(question: str, answer: str) -> dict:
    """Run the 2-agent pipeline for answer evaluation."""
    initial_state: InterviewState = {
        "role": "",
        "interview_type": "",
        "difficulty": "",
        "topic": None,
        "company": "",
        "count": 0,
        "mode": "evaluate",
        "question": question,
        "answer": answer,
        "generation_plan": None,
        "final_output": None,
    }

    if _graph:
        result = _graph.invoke(initial_state)
    else:
        s1 = agent_query_analyzer(initial_state)
        result = agent_action_executor(s1)

    try:
        return json.loads(result.get("final_output", "{}"))
    except Exception:
        return {
            "accuracy_score": 7.0,
            "clarity_score": 7.0,
            "feedback_text": "Evaluation unavailable.",
            "improvement_suggestion": "Try again.",
            "sample_better_answer": "N/A",
        }
