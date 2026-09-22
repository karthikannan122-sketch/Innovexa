"""
INNOVEXA SQLAlchemy Data Models
Matches the 15-Table Supabase PostgreSQL Schema Architecture
"""

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, DateTime, BigInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc)

Base = declarative_base()

# 1. profiles
class Profile(Base):
    __tablename__ = 'profiles'

    id = Column(String(64), primary_key=True) # UUID
    username = Column(String(64), unique=True, nullable=True)
    full_name = Column(String(128), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    headline = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(128), nullable=True)
    website = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    role = Column(String(64), default='I CREATE IDEAS')
    reputation_points = Column(Integer, default=100)
    projects_count = Column(Integer, default=0)
    reviews_count = Column(Integer, default=0)
    profile_visibility = Column(String(32), default='public')
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


# 2. user_private_data
class UserPrivateData(Base):
    __tablename__ = 'user_private_data'

    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), primary_key=True)
    phone = Column(String(32), nullable=True)
    date_of_birth = Column(String(32), nullable=True)
    address = Column(Text, nullable=True)
    preferences = Column(Text, default='{}') # JSON string
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


# 3. categories
class Category(Base):
    __tablename__ = 'categories'

    id = Column(String(64), primary_key=True) # UUID
    name = Column(String(128), unique=True, nullable=False)
    slug = Column(String(128), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    projects = relationship("Project", back_populates="category")


# 4. projects (24 columns)
class Project(Base):
    __tablename__ = 'projects'

    id = Column(String(64), primary_key=True) # UUID or TEXT
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    category_id = Column(String(64), ForeignKey('categories.id'), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    short_description = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    problem_statement = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    project_type = Column(String(32), default='idea') # idea | product | startup
    project_stage = Column(String(32), default='idea') # idea | prototype | mvp | beta | live
    innovation_type = Column(String(32), default='idea')
    target_users = Column(Text, nullable=True)
    features = Column(Text, nullable=True) # JSON string or array
    tags = Column(Text, nullable=True)     # JSON string or array
    cover_image = Column(String(512), nullable=True)
    images = Column(Text, nullable=True)   # JSON string or array
    launch_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    demo_url = Column(String(512), nullable=True)
    status = Column(String(32), default='published') # draft | published | archived
    is_public = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("Profile", back_populates="projects")
    category = relationship("Category", back_populates="projects")
    votes = relationship("ProjectVote", back_populates="project", cascade="all, delete-orphan")
    suggestions = relationship("ProjectSuggestion", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="project", cascade="all, delete-orphan")
    follows = relationship("ProjectFollow", back_populates="project", cascade="all, delete-orphan")


# 5. project_votes
class ProjectVote(Base):
    __tablename__ = 'project_votes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    project_id = Column(String(64), ForeignKey('projects.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    vote_type = Column(String(16), nullable=False) # upvote | downvote
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (UniqueConstraint('project_id', 'user_id', name='_user_project_vote_uc'),)
    project = relationship("Project", back_populates="votes")


# 6. project_suggestions
class ProjectSuggestion(Base):
    __tablename__ = 'project_suggestions'

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    suggestion_type = Column(String(32), default='general')
    status = Column(String(32), default='open') # open | accepted | rejected | implemented
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="suggestions")


# 7. reviews
class Review(Base):
    __tablename__ = 'reviews'

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (UniqueConstraint('project_id', 'user_id', name='_user_project_review_uc'),)
    project = relationship("Project", back_populates="reviews")
    user = relationship("Profile", back_populates="reviews")
    suggestions = relationship("ReviewSuggestion", back_populates="review", cascade="all, delete-orphan")
    votes = relationship("ReviewVote", back_populates="review", cascade="all, delete-orphan")


# 8. review_suggestions
class ReviewSuggestion(Base):
    __tablename__ = 'review_suggestions'

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey('reviews.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    review = relationship("Review", back_populates="suggestions")


# 9. review_votes
class ReviewVote(Base):
    __tablename__ = 'review_votes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    review_id = Column(String(64), ForeignKey('reviews.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    vote_type = Column(String(16), nullable=False) # helpful | not_helpful
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (UniqueConstraint('review_id', 'user_id', name='_user_review_vote_uc'),)
    review = relationship("Review", back_populates="votes")


# 10. community_posts
class CommunityPost(Base):
    __tablename__ = 'community_posts'

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    category_id = Column(String(64), ForeignKey('categories.id'), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(512), nullable=True)
    tags = Column(Text, nullable=True) # JSON list
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("CommunityVote", back_populates="post", cascade="all, delete-orphan")


# 11. community_comments
class CommunityComment(Base):
    __tablename__ = 'community_comments'

    id = Column(String(64), primary_key=True)
    post_id = Column(String(64), ForeignKey('community_posts.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    parent_comment_id = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    post = relationship("CommunityPost", back_populates="comments")


# 12. community_votes
class CommunityVote(Base):
    __tablename__ = 'community_votes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(String(64), ForeignKey('community_posts.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    vote_type = Column(String(16), nullable=False) # like | dislike
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (UniqueConstraint('post_id', 'user_id', name='_user_post_vote_uc'),)
    post = relationship("CommunityPost", back_populates="votes")


# 13. messages
class Message(Base):
    __tablename__ = 'messages'

    id = Column(String(64), primary_key=True) # UUID
    sender_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    receiver_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


# 14. notifications
class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(String(64), primary_key=True) # UUID
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    actor_id = Column(String(64), ForeignKey('profiles.id', ondelete="SET NULL"), nullable=True)
    project_id = Column(String(64), ForeignKey('projects.id', ondelete="CASCADE"), nullable=True)
    type = Column(String(32), default='system')
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    link = Column(String(512), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# 15. project_follows
class ProjectFollow(Base):
    __tablename__ = 'project_follows'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    project_id = Column(String(64), ForeignKey('projects.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(String(64), ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (UniqueConstraint('project_id', 'user_id', name='_user_project_follow_uc'),)
    project = relationship("Project", back_populates="follows")
