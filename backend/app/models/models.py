"""
INNOVEXA SQLAlchemy Data Models (Blueprint Section 30)
PostgreSQL Schema Definition
"""

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    profile_image = Column(String(512), nullable=True)
    role = Column(String(32), default='user')  # user | creator | expert | admin
    reputation_score = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)

    interests = relationship("UserInterest", back_populates="user", cascade="all, delete-orphan")
    expertise = relationship("UserExpertise", back_populates="user", cascade="all, delete-orphan")
    innovations = relationship("Innovation", back_populates="user")
    reviews = relationship("Review", back_populates="reviewer")


class UserInterest(Base):
    __tablename__ = 'user_interests'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    interest_name = Column(String(128), nullable=False)

    user = relationship("User", back_populates="interests")


class UserExpertise(Base):
    __tablename__ = 'user_expertise'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    domain = Column(String(128), nullable=False)
    expertise_level = Column(String(32), default='Beginner')  # Beginner | Intermediate | Advanced

    user = relationship("User", back_populates="expertise")


class Category(Base):
    __tablename__ = 'categories'

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)

    innovations = relationship("Innovation", back_populates="category")


class Innovation(Base):
    __tablename__ = 'innovations'

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    category_id = Column(String(64), ForeignKey('categories.id'), nullable=False)
    title = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    innovation_type = Column(String(32), default='IDEA')  # IDEA | PRODUCT | STARTUP
    creation_type = Column(String(32), default='IDEA')    # IDEA | PRODUCT | STARTUP
    project_stage = Column(String(32), default='idea')    # idea | prototype | mvp | beta | live
    development_stage = Column(String(32), default='CONCEPT') # CONCEPT, PROTOTYPE, MVP, BETA, LIVE
    launch_status = Column(String(32), default='validating') # draft | validating | improving | ready_to_launch | published
    status = Column(String(32), default='UNDER_VALIDATION') # DRAFT | UNDER_VALIDATION | VALIDATION_COMPLETE | PUBLISHED
    problem_statement = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    target_users = Column(Text, nullable=True)
    technology_stack = Column(Text, nullable=True)  # JSON or comma-separated
    features = Column(Text, nullable=True)          # JSON list of features
    images = Column(Text, nullable=True)            # JSON list of image URLs
    cover_image = Column(String(512), nullable=True)
    
    # Launch & Destination Links (Optional)
    website_url = Column(String(512), nullable=True)
    demo_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    app_store_url = Column(String(512), nullable=True)
    play_store_url = Column(String(512), nullable=True)
    has_live_product = Column(Boolean, default=False)
    next_community_action = Column(String(64), default='follow') # follow | waitlist | feedback | contact | prototype

    validation_target = Column(Integer, default=10)
    valid_reviews_count = Column(Integer, default=0)
    upvotes_count = Column(Integer, default=0)
    version = Column(Integer, default=1)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="innovations")
    category = relationship("Category", back_populates="innovations")
    reviews = relationship("Review", back_populates="innovation")
    assignments = relationship("ReviewAssignment", back_populates="innovation")


class ReviewAssignment(Base):
    __tablename__ = 'review_assignments'

    id = Column(String(64), primary_key=True)
    innovation_id = Column(String(64), ForeignKey('innovations.id', ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    match_score = Column(Float, nullable=False)
    assignment_status = Column(String(32), default='PENDING') # PENDING | IN_PROGRESS | COMPLETED | EXPIRED
    assigned_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    innovation = relationship("Innovation", back_populates="assignments")


class Review(Base):
    __tablename__ = 'reviews'

    id = Column(String(64), primary_key=True)
    innovation_id = Column(String(64), ForeignKey('innovations.id', ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    problem_relevance = Column(String(16), nullable=False)  # YES | NO
    solution_usefulness = Column(String(16), nullable=False) # YES | MAYBE | NO
    would_use = Column(String(16), nullable=False)           # YES | MAYBE | NO
    rating = Column(Integer, nullable=False)                # 1 to 5
    liked_text = Column(Text, nullable=True)
    improvement_text = Column(Text, nullable=True)
    feature_request = Column(Text, nullable=True)
    quality_score = Column(Integer, default=80)
    review_status = Column(String(32), default='VALID')     # VALID | LOW_QUALITY | FLAGGED_SPAM
    interaction_seconds = Column(Integer, default=0)
    helpful_votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    innovation = relationship("Innovation", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")


class AIInsight(Base):
    __tablename__ = 'ai_insights'

    id = Column(String(64), primary_key=True)
    innovation_id = Column(String(64), ForeignKey('innovations.id', ondelete="CASCADE"), nullable=False)
    feedback_summary = Column(Text, nullable=True)
    sentiment = Column(String(32), default='Positive')
    positive_points = Column(Text, nullable=True)  # JSON string
    common_problems = Column(Text, nullable=True)  # JSON string
    feature_requests = Column(Text, nullable=True) # JSON string
    recommendations = Column(Text, nullable=True)  # JSON string
    generated_by = Column(String(32), default='GEMINI_AI') # GEMINI_AI | RULE_BASED_FALLBACK
    created_at = Column(DateTime, default=datetime.utcnow)


class Comment(Base):
    __tablename__ = 'comments'

    id = Column(String(64), primary_key=True)
    innovation_id = Column(String(64), ForeignKey('innovations.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    parent_comment_id = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Upvote(Base):
    __tablename__ = 'upvotes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    innovation_id = Column(String(64), ForeignKey('innovations.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('innovation_id', 'user_id', name='_user_inno_upvote_uc'),)


class RecentReviewPair(Base):
    __tablename__ = 'recent_review_pairs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    reviewer_id = Column(String(64), nullable=False)
    creator_id = Column(String(64), nullable=False)
    last_reviewed_at = Column(DateTime, default=datetime.utcnow)
