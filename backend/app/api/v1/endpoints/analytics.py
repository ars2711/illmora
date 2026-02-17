"""
Analytics, Gamification, and Daily Mix API endpoints.
Powers Illmora's competitive advantage features:
- Smart Analytics Engine (concept-tagged performance)
- Weakness Retargeting (SRS-based daily mix)
- Gamification (streaks, leaderboard)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, Integer
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import (
    User,
    ConceptTag,
    Question,
    QuestionAttempt,
    PracticeSession,
    UserStreak,
    WeeklyLeaderboard,
)
from app.schemas.analytics import (
    ConceptTagCreate,
    ConceptTagResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionAttemptCreate,
    QuestionAttemptResponse,
    PracticeSessionCreate,
    PracticeSessionResponse,
    AnalyticsSummaryResponse,
    ConceptPerformanceResponse,
    WeaknessClusterResponse,
    SessionSummaryResponse,
    DailyActivityResponse,
    UserStreakResponse,
    LeaderboardEntryResponse,
    DailyMixQuestionResponse,
    DailyMixResponse,
)

router = APIRouter()


# ─── Concept Tags ────────────────────────────────────────────────────────────

@router.post("/tags", response_model=ConceptTagResponse)
def create_concept_tag(
    tag: ConceptTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_tag = ConceptTag(
        id=str(uuid.uuid4()),
        name=tag.name,
        subject=tag.subject,
        chapter=tag.chapter,
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.get("/tags", response_model=List[ConceptTagResponse])
def list_concept_tags(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ConceptTag)
    if subject:
        query = query.filter(ConceptTag.subject == subject)
    return query.all()


# ─── Questions ───────────────────────────────────────────────────────────────

@router.post("/questions", response_model=QuestionResponse)
def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_question = Question(
        id=str(uuid.uuid4()),
        text=question.text,
        subject=question.subject,
        difficulty=question.difficulty.value,
        options=[opt.model_dump() for opt in question.options],
        explanation=question.explanation,
        image_url=question.image_url,
        concept_tag_ids=question.concept_tag_ids,
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.get("/questions", response_model=List[QuestionResponse])
def list_questions(
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Question).filter(Question.is_active == True)
    if subject:
        query = query.filter(Question.subject == subject)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    return query.offset(offset).limit(limit).all()


# ─── Practice Sessions ──────────────────────────────────────────────────────

@router.post("/sessions", response_model=PracticeSessionResponse)
def create_practice_session(
    session: PracticeSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_session = PracticeSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        session_type=session.session_type,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.post("/sessions/{session_id}/complete", response_model=PracticeSessionResponse)
def complete_practice_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(PracticeSession).filter(
        PracticeSession.id == session_id,
        PracticeSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Aggregate attempt stats
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.session_id == session_id
    ).all()

    session.total_questions = len(attempts)
    session.correct_answers = sum(1 for a in attempts if a.is_correct)
    session.total_time_seconds = sum(a.time_taken_seconds for a in attempts)
    session.completed_at = datetime.utcnow()

    # Update streak
    _update_streak(db, current_user.id)

    db.commit()
    db.refresh(session)
    return session


# ─── Question Attempts ──────────────────────────────────────────────────────

@router.post("/attempts", response_model=QuestionAttemptResponse)
def submit_attempt(
    attempt: QuestionAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch the question to check correctness
    question = db.query(Question).filter(Question.id == attempt.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check if answer is correct
    correct_option = None
    for opt in (question.options or []):
        if opt.get("is_correct"):
            correct_option = opt.get("label")
            break

    is_correct = attempt.selected_option == correct_option

    db_attempt = QuestionAttempt(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        question_id=attempt.question_id,
        session_id=attempt.session_id,
        selected_option=attempt.selected_option,
        is_correct=is_correct,
        time_taken_seconds=attempt.time_taken_seconds,
        concept_tag_ids=question.concept_tag_ids or [],
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


# ─── Analytics Summary ───────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the full analytics summary for a user:
    - Overall accuracy
    - Concept-level performance with trends
    - Weakness clusters for retargeting
    - Session history
    - Daily activity
    """
    # Use current_user.id if "current-user" or "me" is passed
    target_user_id = current_user.id if user_id in ("current-user", "me") else user_id

    # Fetch all attempts for the user
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.user_id == target_user_id
    ).order_by(desc(QuestionAttempt.attempted_at)).all()

    # Fetch streak
    streak = db.query(UserStreak).filter(
        UserStreak.user_id == target_user_id
    ).first()

    # Fetch concept tags for lookup
    all_tags = {t.id: t for t in db.query(ConceptTag).all()}

    # Calculate overall stats
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    overall_accuracy = round((correct / total * 100) if total > 0 else 0, 1)

    # Weekly stats
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_attempts = [a for a in attempts if a.attempted_at >= week_ago]
    weekly_solved = len(weekly_attempts)

    # Concept performance aggregation
    concept_performances = _aggregate_concept_performance(attempts, all_tags)

    # Weakness clusters (last 3 sessions)
    weakness_clusters = _identify_weaknesses(attempts, all_tags, db, target_user_id)

    # Session summaries
    recent_sessions = _build_session_summaries(db, target_user_id)

    # Daily activity (last 14 days)
    daily_activity = _build_daily_activity(attempts)

    # User role from profile
    user = db.query(User).filter(User.id == target_user_id).first()
    role = "pre-engineering"  # Default; derive from curriculum in production

    return AnalyticsSummaryResponse(
        user_id=target_user_id,
        role=role,
        overall_accuracy=overall_accuracy,
        total_problems_solved=total,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        weekly_problems_solved=weekly_solved,
        concept_performances=concept_performances,
        weakness_clusters=weakness_clusters,
        recent_sessions=recent_sessions,
        daily_activity=daily_activity,
    )


# ─── Streak ──────────────────────────────────────────────────────────────────

@router.get("/streak/me", response_model=UserStreakResponse)
def get_my_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    streak = db.query(UserStreak).filter(
        UserStreak.user_id == current_user.id
    ).first()
    if not streak:
        return UserStreakResponse(
            user_id=current_user.id,
            current_streak=0,
            longest_streak=0,
            streak_freeze_available=True,
        )
    return UserStreakResponse(
        user_id=streak.user_id,
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_active_date=streak.last_active_date,
        streak_freeze_available=streak.streak_freeze_count > 0,
    )


# ─── Leaderboard ─────────────────────────────────────────────────────────────

@router.get("/leaderboard/weekly", response_model=List[LeaderboardEntryResponse])
def get_weekly_leaderboard(
    role: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
):
    """
    Returns the weekly leaderboard. Uses materialized cache for performance.
    Falls back to live computation if cache is empty.
    """
    # Get current week's Monday
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    week_start = monday.isoformat()

    entries = db.query(WeeklyLeaderboard).filter(
        WeeklyLeaderboard.week_start == week_start
    ).order_by(WeeklyLeaderboard.rank).limit(limit).all()

    if not entries:
        # Fallback: compute live from attempts
        return _compute_live_leaderboard(db, week_start, role, limit)

    results = []
    for entry in entries:
        user = db.query(User).filter(User.id == entry.user_id).first()
        if not user:
            continue

        streak = db.query(UserStreak).filter(
            UserStreak.user_id == entry.user_id
        ).first()

        results.append(LeaderboardEntryResponse(
            rank=entry.rank,
            user_id=entry.user_id,
            display_name=user.full_name or user.email.split("@")[0],
            problems_solved_this_week=entry.problems_solved,
            accuracy=entry.accuracy,
            streak=streak.current_streak if streak else 0,
            role="pre-engineering",  # Derive from curriculum
        ))

    return results


# ─── Daily Mix ───────────────────────────────────────────────────────────────

@router.get("/daily-mix/me", response_model=DailyMixResponse)
def get_daily_mix(
    total: int = Query(default=20, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a personalized daily mix using weakness retargeting + SRS.
    60% from weak concepts, 20% spaced repetition, 20% new.
    """
    # Fetch user's recent attempts
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.user_id == current_user.id
    ).order_by(desc(QuestionAttempt.attempted_at)).limit(500).all()

    # Fetch all active question IDs
    all_question_ids = [
        q.id for q in db.query(Question.id).filter(Question.is_active == True).all()
    ]

    mix_questions: List[DailyMixQuestionResponse] = []
    used_ids = set()
    weakness_count = 0
    new_count = 0

    # Phase 1: Weakness retargeting (60%)
    weakness_slots = int(total * 0.6)
    weak_questions = _get_weakness_questions(attempts, weakness_slots, used_ids)
    mix_questions.extend(weak_questions)
    weakness_count = len(weak_questions)

    # Phase 2: Spaced repetition (20%)
    sr_slots = int(total * 0.2)
    sr_questions = _get_spaced_repetition_questions(attempts, sr_slots, used_ids)
    mix_questions.extend(sr_questions)

    # Phase 3: New questions (remaining)
    remaining = total - len(mix_questions)
    attempted_ids = {a.question_id for a in attempts}
    for qid in all_question_ids:
        if len(mix_questions) >= total:
            break
        if qid in used_ids or qid in attempted_ids:
            continue
        used_ids.add(qid)
        mix_questions.append(DailyMixQuestionResponse(
            question_id=qid,
            concept_tag="New",
            reason="new",
            priority=0.2,
        ))
        new_count += 1

    return DailyMixResponse(
        questions=mix_questions[:total],
        total_count=len(mix_questions),
        weakness_count=weakness_count,
        new_count=new_count,
    )


# ─── Helper Functions ────────────────────────────────────────────────────────

def _update_streak(db: Session, user_id: str):
    """Update user's streak after completing a session."""
    today = datetime.utcnow().date().isoformat()

    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
    if not streak:
        streak = UserStreak(user_id=user_id, current_streak=1, longest_streak=1, last_active_date=today)
        db.add(streak)
        return

    if streak.last_active_date == today:
        return  # Already counted today

    yesterday = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
    if streak.last_active_date == yesterday:
        streak.current_streak += 1
    elif streak.streak_freeze_count > 0 and streak.last_active_date:
        # Use a streak freeze if they missed one day
        day_before = (datetime.utcnow().date() - timedelta(days=2)).isoformat()
        if streak.last_active_date == day_before:
            streak.streak_freeze_count -= 1
            streak.current_streak += 1
        else:
            streak.current_streak = 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_active_date = today


def _aggregate_concept_performance(attempts, all_tags):
    """Aggregate attempt data by concept tag."""
    tag_stats = {}

    for attempt in attempts:
        for tag_id in (attempt.concept_tag_ids or []):
            if tag_id not in all_tags:
                continue
            if tag_id not in tag_stats:
                tag_stats[tag_id] = {"correct": 0, "total": 0, "time": 0, "dates": []}

            tag_stats[tag_id]["total"] += 1
            if attempt.is_correct:
                tag_stats[tag_id]["correct"] += 1
            tag_stats[tag_id]["time"] += attempt.time_taken_seconds
            tag_stats[tag_id]["dates"].append(attempt.attempted_at)

    results = []
    for tag_id, stats in tag_stats.items():
        tag = all_tags[tag_id]
        accuracy = round((stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0, 1)
        avg_time = round(stats["time"] / stats["total"]) if stats["total"] > 0 else 0

        # Trend calculation: compare first half vs second half accuracy
        trend = "stable"
        if stats["total"] >= 4:
            sorted_dates = sorted(stats["dates"])
            mid = len(sorted_dates) // 2
            first_half_correct = sum(
                1 for a in attempts
                if any(tid == tag_id for tid in (a.concept_tag_ids or []))
                and a.is_correct
                and a.attempted_at <= sorted_dates[mid]
            )
            second_half_correct = stats["correct"] - first_half_correct
            first_half_total = mid
            second_half_total = stats["total"] - mid

            if first_half_total > 0 and second_half_total > 0:
                diff = (second_half_correct / second_half_total) - (first_half_correct / first_half_total)
                if diff > 0.1:
                    trend = "improving"
                elif diff < -0.1:
                    trend = "declining"

        last_attempted = max(stats["dates"]).isoformat() if stats["dates"] else None

        results.append(ConceptPerformanceResponse(
            tag=ConceptTagResponse(id=tag.id, name=tag.name, subject=tag.subject, chapter=tag.chapter),
            total_attempts=stats["total"],
            correct_attempts=stats["correct"],
            accuracy=accuracy,
            average_time_seconds=avg_time,
            trend=trend,
            last_attempted=last_attempted,
        ))

    return sorted(results, key=lambda x: x.accuracy)


def _identify_weaknesses(attempts, all_tags, db, user_id):
    """Identify weak concepts from last 3 sessions."""
    # Get last 3 session IDs
    recent_sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).order_by(desc(PracticeSession.started_at)).limit(3).all()

    session_ids = {s.id for s in recent_sessions}
    if not session_ids:
        return []

    recent_attempts = [a for a in attempts if a.session_id in session_ids]
    performances = _aggregate_concept_performance(recent_attempts, all_tags)

    weaknesses = []
    for perf in performances:
        if perf.accuracy < 70:
            error_rate = (perf.total_attempts - perf.correct_attempts) / perf.total_attempts if perf.total_attempts > 0 else 0
            trend_mult = 1.5 if perf.trend == "declining" else (1.0 if perf.trend == "stable" else 0.7)
            priority = min(1.0, error_rate * trend_mult)

            wrong_qids = list(set(
                a.question_id for a in recent_attempts
                if not a.is_correct and perf.tag.id in (a.concept_tag_ids or [])
            ))

            weaknesses.append(WeaknessClusterResponse(
                concept_tag=perf.tag,
                error_count=perf.total_attempts - perf.correct_attempts,
                recent_error_rate=round(error_rate * 100, 1),
                priority=round(priority, 2),
                suggested_question_ids=wrong_qids,
            ))

    return sorted(weaknesses, key=lambda x: x.priority, reverse=True)


def _build_session_summaries(db, user_id):
    """Build recent session summaries."""
    sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).order_by(desc(PracticeSession.started_at)).limit(10).all()

    results = []
    for s in sessions:
        results.append(SessionSummaryResponse(
            session_id=s.id,
            date=s.started_at.isoformat() if s.started_at else "",
            total_questions=s.total_questions,
            correct_answers=s.correct_answers,
            incorrect_answers=s.total_questions - s.correct_answers,
            average_time_seconds=round(s.total_time_seconds / s.total_questions) if s.total_questions > 0 else 0,
        ))

    return results


def _build_daily_activity(attempts):
    """Build daily activity for the last 14 days."""
    today = datetime.utcnow().date()
    results = []

    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        day_attempts = [
            a for a in attempts
            if a.attempted_at.date() == day
        ]
        total = len(day_attempts)
        correct = sum(1 for a in day_attempts if a.is_correct)

        results.append(DailyActivityResponse(
            date=day.isoformat(),
            problems_solved=total,
            accuracy=round((correct / total * 100) if total > 0 else 0, 1),
        ))

    return results


def _get_weakness_questions(attempts, max_count, used_ids):
    """Select questions from weak concepts."""
    # Group incorrect attempts by concept
    concept_errors = {}
    for a in attempts:
        if not a.is_correct:
            for tag_id in (a.concept_tag_ids or []):
                if tag_id not in concept_errors:
                    concept_errors[tag_id] = []
                concept_errors[tag_id].append(a)

    # Sort by error count (most errors first)
    sorted_concepts = sorted(concept_errors.items(), key=lambda x: len(x[1]), reverse=True)

    results = []
    for tag_id, wrong_attempts in sorted_concepts:
        if len(results) >= max_count:
            break
        for a in wrong_attempts:
            if len(results) >= max_count:
                break
            if a.question_id in used_ids:
                continue
            used_ids.add(a.question_id)
            results.append(DailyMixQuestionResponse(
                question_id=a.question_id,
                concept_tag=tag_id,
                reason="weakness_retarget",
                priority=0.9,
            ))

    return results


def _get_spaced_repetition_questions(attempts, max_count, used_ids):
    """Select questions due for spaced repetition (1, 3, 7 days after error)."""
    now = datetime.utcnow()
    intervals = [1, 3, 7]
    results = []

    incorrect = [a for a in attempts if not a.is_correct]
    for a in incorrect:
        if len(results) >= max_count:
            break
        if a.question_id in used_ids:
            continue

        days_since = (now - a.attempted_at).days
        if days_since in intervals:
            used_ids.add(a.question_id)
            results.append(DailyMixQuestionResponse(
                question_id=a.question_id,
                concept_tag=a.concept_tag_ids[0] if a.concept_tag_ids else "General",
                reason="spaced_repetition",
                priority=0.8,
            ))

    return results


def _compute_live_leaderboard(db, week_start, role, limit):
    """Compute leaderboard live from attempts when cache is empty."""
    week_start_date = datetime.fromisoformat(week_start)
    week_end_date = week_start_date + timedelta(days=7)

    # Get all attempts this week grouped by user
    user_stats = db.query(
        QuestionAttempt.user_id,
        func.count(QuestionAttempt.id).label("total"),
        func.sum(func.cast(QuestionAttempt.is_correct, Integer)).label("correct"),
    ).filter(
        QuestionAttempt.attempted_at >= week_start_date,
        QuestionAttempt.attempted_at < week_end_date,
    ).group_by(QuestionAttempt.user_id).order_by(
        desc("total")
    ).limit(limit).all()

    results = []
    for rank, (uid, total, correct) in enumerate(user_stats, 1):
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue

        streak = db.query(UserStreak).filter(UserStreak.user_id == uid).first()
        accuracy = round((correct / total * 100) if total > 0 else 0, 1)

        results.append(LeaderboardEntryResponse(
            rank=rank,
            user_id=uid,
            display_name=user.full_name or user.email.split("@")[0],
            problems_solved_this_week=total,
            accuracy=accuracy,
            streak=streak.current_streak if streak else 0,
            role="pre-engineering",
        ))

    return results
