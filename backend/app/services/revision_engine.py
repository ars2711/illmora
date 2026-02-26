from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.sql_models import RevisionCard, User
from typing import List, Optional
import math

class RevisionEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_due_cards(self, user_id: str, limit: int = 10) -> List[RevisionCard]:
        """Fetch cards due for review based on Spaced Repetition Schedule"""
        now = datetime.now(timezone.utc)
        return self.db.query(RevisionCard).filter(
            RevisionCard.user_id == user_id,
            RevisionCard.next_review_at <= now
        ).order_by(RevisionCard.next_review_at.asc()).limit(limit).all()

    def create_card(self, user_id: str, concept: str, front: str, back: str, card_type: str = "flashcard"):
        """Manually create a revision card (or AI triggered)"""
        # Initial review is NOW (0 minutes delay) or TOMORROW depending on strategy.
        # Let's set it to tomorrow for "new" material unless it's immediate reinforcement.
        initial_review = datetime.now(timezone.utc) + timedelta(days=1)
        
        card = RevisionCard(
            user_id=user_id,
            concept=concept,
            front_content=front,
            back_content=back,
            type=card_type,
            next_review_at=initial_review,
            interval_days=1,
            ease_factor=2.5,
            repetition_count=0
        )
        self.db.add(card)
        self.db.commit()
        return card

    def process_review(self, card_id: str, quality: int):
        """
        Update card schedule based on user performance (0-5 scale).
        SM-2 Algorithm Implementation.
        Quality:
        5 - perfect response
        4 - correct response after hesitation
        3 - correct response recalled with serious difficulty
        2 - incorrect response; where the correct one seemed easy to recall
        1 - incorrect response; the correct one remembered
        0 - complete blackout.
        """
        card = self.db.query(RevisionCard).filter(RevisionCard.id == card_id).first()
        if not card:
            return None

        if quality >= 3:
            if card.repetition_count == 0:
                card.interval_days = 1
            elif card.repetition_count == 1:
                card.interval_days = 6
            else:
                card.interval_days = math.ceil(card.interval_days * card.ease_factor)
            
            card.repetition_count += 1
            card.ease_factor = card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        else:
            card.repetition_count = 0
            card.interval_days = 1 # Reset interval check
        
        # Minimum ease factor cap
        if card.ease_factor < 1.3:
            card.ease_factor = 1.3

        # Set next review date
        card.next_review_at = datetime.now(timezone.utc) + timedelta(days=card.interval_days)
        
        self.db.add(card)
        self.db.commit()
        return card

    async def generate_concept_traps(self, concept_name: str) -> str:
        """
        Uses AI to generate a 'Concept Trap' - A question designed to expose common misconceptions.
        """
        from app.services.ai.factory import AIFactory
        ai_service = AIFactory.get_service()
        
        prompt = f"""
        Generate a "Concept Trap" for the topic: "{concept_name}".
        A Concept Trap is a question that seems simple but has a counter-intuitive answer designed to reveal deep misconceptions.
        
        Format your response exactly like this:
        **Question:** [The tricky question]
        
        **Common Misconception:** [The intuitive but wrong answer]
        
        **The Reality:** [The correct answer and detailed explanation of why]
        """
        
        response = await ai_service.generate_response(
            prompt, 
            system_instruction="You are a Socratic tutor specializing in revealing hidden misconceptions."
        )
        return response
