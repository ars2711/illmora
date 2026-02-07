from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, JSON, Enum, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
import enum
from typing import List, Optional
from datetime import datetime
from app.db.base_class import Base

# Enums
class ContentType(str, enum.Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"
    VIDEO = "video"

class InteractionType(str, enum.Enum):
    CHAT = "chat"
    QUIZ = "quiz"
    REFLECTION = "reflection"

class EdgeType(str, enum.Enum):
    PREREQUISITE = "prerequisite" # Node A must be learned before B
    DEPENDS_ON = "depends_on"     # Node B depends on logic in A
    COMMON_CONFUSION = "common_confusion" # Students often confuse A and B
    RELATED = "related"
    IS_A = "is_a"

class MemoryType(str, enum.Enum):
    SHORT_TERM = "short_term" # Active session context
    LONG_TERM = "long_term"   # Crystallized knowledge/facts
    EPISODIC = "episodic"     # "Remember when we talked about X?"

class UserRole(str, enum.Enum):
    STUDENT = "student"
    EDUCATOR = "educator"
    INSTITUTION_ADMIN = "institution_admin"
    SYSTEM_ADMIN = "system_admin"

# --- Core User Models ---

class Institution(Base):
    """
    Phase 3: Multi-tenant Architecture.
    Represents a University, School, or Organization.
    """
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True)
    domain: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True) # for auto-join
    
    # Configuration
    config: Mapped[dict] = mapped_column(JSON, default={}) # Features, Limits
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="institution")
    curricula: Mapped[List["Curriculum"]] = relationship(back_populates="institution")

class Curriculum(Base):
    __tablename__ = "curricula"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("institutions.id"), nullable=True) # Null = Global
    
    code: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. 'nust_engineering'
    name: Mapped[str] = mapped_column(String) # e.g. 'NUST (Engineering/CS)'
    description: Mapped[str] = mapped_column(String, nullable=True)
    
    # Configuration for difficulty, ethics, assessment type
    # e.g. { "assessment_style": "mcq_heavy", "ethics_level": "strict", "subjects": ["math", "physics"] }
    config: Mapped[dict] = mapped_column(JSON, default={}) 
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="curriculum")
    institution: Mapped["Institution"] = relationship(back_populates="curricula")

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("institutions.id"), nullable=True)
    
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    
    role: Mapped[UserRole] = mapped_column(String, default=UserRole.STUDENT)
    
    curriculum_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("curricula.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    institution: Mapped["Institution"] = relationship(back_populates="users")
    curriculum: Mapped[Optional["Curriculum"]] = relationship(back_populates="users")
    profile: Mapped["LearningProfile"] = relationship(back_populates="user", uselist=False)
    interactions: Mapped[List["Interaction"]] = relationship(back_populates="user")
    memories: Mapped[List["Memory"]] = relationship(back_populates="user")
    notes: Mapped[List["Note"]] = relationship(back_populates="user")
    passkeys: Mapped[List["PasskeyCredential"]] = relationship(back_populates="user")

class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    
    # Metadata for personalization
    degree_program: Mapped[str] = mapped_column(String, nullable=True) # e.g. "BS Computer Science"
    current_semester: Mapped[str] = mapped_column(String, nullable=True) # e.g. "4th Semester"
    curr_subjects: Mapped[List[str]] = mapped_column(JSON, default=list) # e.g. ["DSA", "Linear Algebra"]
    preferred_language: Mapped[str] = mapped_column(String, default="English") # English / Urdu
    
    # Phase 3: Enhanced Intelligence
    career_goals: Mapped[List[str]] = mapped_column(JSON, default=list) # e.g. ["Software Architect", "Data Scientist"]
    learning_style: Mapped[str] = mapped_column(String, default="visual") # visual, textual, socratic
    
    current_academic_level: Mapped[str] = mapped_column(String, nullable=True) # Legacy/Generic
    preferred_learning_style: Mapped[str] = mapped_column(String, nullable=True) # e.g. "Visual", "Socratic"
    
    # Metric tracking
    strengths: Mapped[List[str]] = mapped_column(JSON, default=list) # e.g. ["Python", "Logic"]
    weaknesses: Mapped[List[str]] = mapped_column(JSON, default=list) # e.g. ["Calculus", "Memory Management"]
    
    # Metric tracking
    total_study_time_minutes: Mapped[int] = mapped_column(Integer, default=0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    user: Mapped["User"] = relationship(back_populates="profile")

class PasskeyCredential(Base):
    __tablename__ = "passkey_credentials"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    credential_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    public_key: Mapped[str] = mapped_column(Text)
    sign_count: Mapped[int] = mapped_column(Integer, default=0)
    transports: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="passkeys")

# --- Content & Interaction Models ---

class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    session_id: Mapped[str] = mapped_column(String, index=True) # Grouping chats
    
    type: Mapped[InteractionType] = mapped_column(String, default=InteractionType.CHAT)
    user_input: Mapped[str] = mapped_column(Text)
    ai_response: Mapped[str] = mapped_column(Text)
    
    # Idempotency & Sync Hardening
    client_ref_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    
    # Metadata to track effectiveness
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    user_sentiment_score: Mapped[float] = mapped_column(Float, nullable=True) # -1.0 to 1.0
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="interactions")

class Note(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    
    title: Mapped[str] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    user: Mapped["User"] = relationship(back_populates="notes")

class Document(Base):
    __tablename__ = "documents"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id")) # Audit Fix: Added user ownership
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text) # Raw text content
    file_path: Mapped[str] = mapped_column(String, nullable=True) # If stored in S3/Local
    type: Mapped[ContentType] = mapped_column(String, default=ContentType.TEXT)
    
    embedding: Mapped[Vector] = mapped_column(Vector(1536), nullable=True) # For RAG
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# --- Core AI Pillars: Memory & Knowledge Graph ---

class Memory(Base):
    """
    Persistent Memory Engine.
    Stores vectorized chunks of interactions, notes, and insights.
    """
    __tablename__ = "memories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[Vector] = mapped_column(Vector(1536)) # OpenAI dimensions usually 1536
    
    memory_type: Mapped[MemoryType] = mapped_column(String, default=MemoryType.EPISODIC)
    importance_score: Mapped[float] = mapped_column(Float, default=0.5) # For retrieval weighting
    last_accessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    source_interaction_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("interactions.id"), nullable=True)
    user: Mapped["User"] = relationship(back_populates="memories")

class KnowledgeNode(Base):
    """
    The Global Knowledge Graph.
    Represents a singular concept (e.g. "Python Lists", "Derivative", "Refactoring").
    Shared across ALL users (not user-specific).
    """
    __tablename__ = "knowledge_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. "python-lists"
    name: Mapped[str] = mapped_column(String)
    definition: Mapped[str] = mapped_column(Text)
    
    # Vector for fuzzy finding concepts
    embedding: Mapped[Vector] = mapped_column(Vector(1536))
    
    domain: Mapped[str] = mapped_column(String, index=True) # e.g. "Computer Science", "Mathematics"
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1) # 1-10

class KnowledgeEdge(Base):
    """
    Relationships between knowledge nodes.
    Node A -> [Relation] -> Node B
    """
    __tablename__ = "knowledge_edges"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_node_id: Mapped[str] = mapped_column(String, ForeignKey("knowledge_nodes.id"))
    target_node_id: Mapped[str] = mapped_column(String, ForeignKey("knowledge_nodes.id"))
    
    relation_type: Mapped[EdgeType] = mapped_column(String)
    weight: Mapped[float] = mapped_column(Float, default=1.0) # Strength of relationship

class UserConceptMastery(Base):
    """
    User's mastery over specific graph nodes.
    Link between User and KnowledgeNode.
    """
    __tablename__ = "user_concept_mastery"
    __table_args__ = (
        # COMPOSITE INDEX: Critical for performance (fetching all mastery for a user)
        # Unique constraint prevents duplicate mastery entries for same user/node
        Index("ix_user_node_mastery", "user_id", "node_id", unique=True),
        {"schema": None}, # Explicitly set schema if needed
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    node_id: Mapped[str] = mapped_column(String, ForeignKey("knowledge_nodes.id"))
    
    mastery_score: Mapped[float] = mapped_column(Float, default=0.0) # 0.0 to 1.0
    last_reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    mistake_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # This aids the "What am I missing?" queries

class Feedback(Base):
    """
    User feedback for internal testing/hardening.
    """
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True) # Optional for anon
    
    feature_context: Mapped[str] = mapped_column(String) # e.g. "practice_mode", "upload_flow"
    content: Mapped[str] = mapped_column(Text)
    sentiment: Mapped[Optional[str]] = mapped_column(String) # e.g. "confused", "happy", "bug"
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User")  # Unidirectional is fine for now

# --- Admin Ops Models ---

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action: Mapped[str] = mapped_column(String)
    actor: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String, default="Low")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="Investigating")
    severity: Mapped[str] = mapped_column(String, default="Medium")
    owner: Mapped[str] = mapped_column(String, default="NOC")
    region: Mapped[str] = mapped_column(String, default="Global")
    impact: Mapped[str] = mapped_column(Text, default="")
    services: Mapped[List[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class IncidentTimelineEvent(Base):
    __tablename__ = "incident_timeline_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id"))
    note: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String, ForeignKey("incidents.id"))
    body: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String, default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class RoleAuditEvent(Base):
    __tablename__ = "role_audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String, default="Low")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class DatabaseRunbookStep(Base):
    __tablename__ = "database_runbook_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    label: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="Pending")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

# --- Collaboration / Social Models ---

class StudyRoom(Base):
    __tablename__ = "study_rooms"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, nullable=True)
    created_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    members: Mapped[List["RoomMember"]] = relationship(back_populates="room")
    messages: Mapped[List["RoomMessage"]] = relationship(back_populates="room")

class RoomMember(Base):
    __tablename__ = "room_members"
    
    room_id: Mapped[str] = mapped_column(String, ForeignKey("study_rooms.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String, default="member") # admin, member
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    room: Mapped["StudyRoom"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship("User")

class RoomMessage(Base):
    __tablename__ = "room_messages"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(String, ForeignKey("study_rooms.id"))
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    is_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    room: Mapped["StudyRoom"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship("User")

# --- Marketplace & Ecosystem Models ---

class CreatorProfile(Base):
    """
    Profile for users who publish content on the marketplace.
    """
    __tablename__ = "creator_profiles"
    
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    user: Mapped["User"] = relationship("User")

class StudyPack(Base):
    """
    A bundle of resources (Notes, Flashcards, Paths) shared/sold on the marketplace.
    """
    __tablename__ = "study_packs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, default=0.0) # 0 = Free
    
    # Metadata
    curriculum_code: Mapped[str] = mapped_column(String, nullable=True) # e.g. "nust_cs" target
    subject_tag: Mapped[str] = mapped_column(String, nullable=True)
    
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    creator: Mapped["User"] = relationship("User")
    reviews: Mapped[List["PackReview"]] = relationship(back_populates="pack")
    items: Mapped[List["PackItem"]] = relationship(back_populates="pack")

class PackItem(Base):
    """
    Content item within a pack (Reference to a Note or Document).
    """
    __tablename__ = "pack_items"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pack_id: Mapped[str] = mapped_column(String, ForeignKey("study_packs.id"))
    
    # We reference the original content. 
    # In a real app, we might clone it to ensure immutability. For Phase 3, we reference.
    # We use a generic content_type + content_id approach or specific FKs.
    # Specific FKs are safer for SQL.
    
    note_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("notes.id"), nullable=True)
    document_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("documents.id"), nullable=True)
    
    title: Mapped[str] = mapped_column(String) # Current title snapshot
    
    pack: Mapped["StudyPack"] = relationship(back_populates="items")

class PackReview(Base):
    __tablename__ = "pack_reviews"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pack_id: Mapped[str] = mapped_column(String, ForeignKey("study_packs.id"))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    
    rating: Mapped[int] = mapped_column(Integer) # 1-5
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    pack: Mapped["StudyPack"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship("User")

# --- Extensibility ---

class Integration(Base):
    """
    External tool integrations (LMS, Calendar, Webhooks).
    Scoped to an Institution.
    """
    __tablename__ = "integrations"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id: Mapped[str] = mapped_column(String, ForeignKey("institutions.id"))
    
    name: Mapped[str] = mapped_column(String) # e.g. "Canvas LMS"
    type: Mapped[str] = mapped_column(String) # "LMS", "PAYMENT", "SSO"
    config: Mapped[dict] = mapped_column(JSON, default={}) 
    
    api_key: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Encrypted
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    institution: Mapped["Institution"] = relationship("Institution")

class WebhookSubscription(Base):
    """
    Outbound webhooks for event notification.
    """
    __tablename__ = "webhook_subscriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id: Mapped[str] = mapped_column(String, ForeignKey("institutions.id"))
    
    event_type: Mapped[str] = mapped_column(String) # e.g. "alert.raised", "pack.published"
    target_url: Mapped[str] = mapped_column(String) 
    secret: Mapped[str] = mapped_column(String) # HMAC secret
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    institution: Mapped["Institution"] = relationship("Institution")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

