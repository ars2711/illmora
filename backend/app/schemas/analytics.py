from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# ─── Concept Tag Schemas ─────────────────────────────────────────────────────

class ConceptTagBase(BaseModel):
    name: str
    subject: str
    chapter: Optional[str] = None


class ConceptTagCreate(ConceptTagBase):
    pass


class ConceptTagResponse(ConceptTagBase):
    id: str

    class Config:
        from_attributes = True


# ─── Question Schemas ────────────────────────────────────────────────────────

class QuestionOption(BaseModel):
    label: str  # "A", "B", "C", "D"
    text: str
    is_correct: bool = False


class QuestionCreate(BaseModel):
    text: str
    subject: str
    difficulty: DifficultyLevel = DifficultyLevel.medium
    options: List[QuestionOption]
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    concept_tag_ids: List[str] = []


class QuestionResponse(BaseModel):
    id: str
    text: str
    subject: str
    difficulty: str
    options: List[QuestionOption]
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    concept_tag_ids: List[str] = []

    class Config:
        from_attributes = True


# ─── Question Attempt Schemas ────────────────────────────────────────────────

class QuestionAttemptCreate(BaseModel):
    question_id: str
    session_id: str
    selected_option: str
    time_taken_seconds: int = 0


class QuestionAttemptResponse(BaseModel):
    id: str
    question_id: str
    session_id: str
    selected_option: str
    is_correct: bool
    time_taken_seconds: int
    concept_tag_ids: List[str]
    attempted_at: datetime

    class Config:
        from_attributes = True


# ─── Practice Session Schemas ────────────────────────────────────────────────

class PracticeSessionCreate(BaseModel):
    session_type: str = "daily_mix"


class PracticeSessionResponse(BaseModel):
    id: str
    user_id: str
    session_type: str
    total_questions: int
    correct_answers: int
    total_time_seconds: int
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Analytics Schemas ───────────────────────────────────────────────────────

class ConceptPerformanceResponse(BaseModel):
    tag: ConceptTagResponse
    total_attempts: int
    correct_attempts: int
    accuracy: float  # 0–100
    average_time_seconds: float
    trend: str  # "improving", "declining", "stable"
    last_attempted: Optional[str] = None


class WeaknessClusterResponse(BaseModel):
    concept_tag: ConceptTagResponse
    error_count: int
    recent_error_rate: float  # 0–100
    priority: float  # 0–1
    suggested_question_ids: List[str]


class SessionSummaryResponse(BaseModel):
    session_id: str
    date: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    average_time_seconds: float


class DailyActivityResponse(BaseModel):
    date: str
    problems_solved: int
    accuracy: float


class AnalyticsSummaryResponse(BaseModel):
    user_id: str
    role: str
    overall_accuracy: float
    total_problems_solved: int
    current_streak: int
    longest_streak: int
    weekly_problems_solved: int
    concept_performances: List[ConceptPerformanceResponse]
    weakness_clusters: List[WeaknessClusterResponse]
    recent_sessions: List[SessionSummaryResponse]
    daily_activity: List[DailyActivityResponse]


# ─── Streak Schemas ──────────────────────────────────────────────────────────

class UserStreakResponse(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    last_active_date: Optional[str] = None
    streak_freeze_available: bool = False

    class Config:
        from_attributes = True


# ─── Leaderboard Schemas ─────────────────────────────────────────────────────

class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    problems_solved_this_week: int
    accuracy: float
    streak: int
    role: str


# ─── Daily Mix Schemas ───────────────────────────────────────────────────────

class DailyMixQuestionResponse(BaseModel):
    question_id: str
    concept_tag: str
    reason: str  # "weakness_retarget", "spaced_repetition", "reinforcement", "new"
    priority: float


class DailyMixResponse(BaseModel):
    questions: List[DailyMixQuestionResponse]
    total_count: int
    weakness_count: int
    new_count: int
