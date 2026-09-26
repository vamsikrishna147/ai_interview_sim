"""
ai_service.py — thin wrapper that delegates to the multi-agent pipeline.

All heavy lifting (prompt engineering, Serper fetching, CSV injection,
question formatting) is now handled by ai_agent_service.py.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

# Import the multi-agent pipeline
import services.ai_agent_service as agent_service


def generate_interview_questions(
    role: str,
    interview_type: str,
    difficulty: str,
    topic: str = None,
    company: str = "Generic",
    count: int = 10,
):
    """
    Delegates to the 2-agent LangGraph pipeline:
      Agent 1 → Query Analyzer (context, trends, CSV)
      Agent 2 → Action Executor (question generation)
    """
    return agent_service.run_generate_pipeline(
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        topic=topic,
        company=company,
        count=count,
    )


def evaluate_answer(question: str, answer: str):
    """
    Delegates to the 2-agent LangGraph pipeline for evaluation:
      Agent 1 → passes context through
      Agent 2 → generates detailed evaluation JSON
    """
    return agent_service.run_evaluate_pipeline(question=question, answer=answer)

