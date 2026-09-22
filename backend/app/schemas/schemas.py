"""
INNOVEXA Pydantic Request & Response Schemas
Matches the 15-Table Supabase PostgreSQL Schema Architecture
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# Generic Envelope
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[dict] = None

# 1. profiles
class ProfileSchema(BaseModel):
    id: str
    username: Optional[str] = None
    full_name: str
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    role: str = "I CREATE IDEAS"
    reputation_points: int = 100
    projects_count: int = 0
    reviews_count: int = 0
    profile_visibility: str = "public"
    created_at: Optional[datetime] = None

# 2. user_private_data
class UserPrivateDataSchema(BaseModel):
    user_id: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    onboarding_completed: bool = False

# 3. categories
class CategorySchema(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: Optional[datetime] = None

# 4. projects (24 columns)
class ProjectCreate(BaseModel):
    category_id: str
    title: str
    slug: Optional[str] = None
    short_description: str
    description: Optional[str] = None
    problem_statement: str
    proposed_solution: str
    project_type: str = "idea" # idea | product | startup
    project_stage: str = "idea" # idea | prototype | mvp | beta | live
    innovation_type: str = "idea"
    target_users: Optional[str] = None
    features: List[str] = []
    tags: List[str] = []
    cover_image: Optional[str] = None
    images: List[str] = []
    launch_url: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: str = "published"
    is_public: bool = True

class ProjectDetail(ProjectCreate):
    id: str
    user_id: str
    category_name: Optional[str] = None
    view_count: int = 0
    upvotes_count: int = 0
    downvotes_count: int = 0
    valid_reviews_count: int = 0
    created_at: datetime
    updated_at: datetime

# 5. project_votes
class ProjectVoteCreate(BaseModel):
    project_id: str
    vote_type: str = "upvote" # upvote | downvote

# 6. project_suggestions
class ProjectSuggestionCreate(BaseModel):
    project_id: str
    title: str
    content: str
    suggestion_type: str = "general"

# 7. reviews
class ReviewCreate(BaseModel):
    project_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str
    content: str
    is_public: bool = True

class ReviewResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    rating: int
    title: str
    content: str
    is_public: bool
    created_at: datetime

# 8. review_suggestions
class ReviewSuggestionCreate(BaseModel):
    review_id: str
    content: str

# 9. review_votes
class ReviewVoteCreate(BaseModel):
    review_id: str
    vote_type: str = "helpful" # helpful | not_helpful

# 10. community_posts
class CommunityPostCreate(BaseModel):
    category_id: Optional[str] = None
    title: str
    content: str
    image_url: Optional[str] = None
    tags: List[str] = []

# 11. community_comments
class CommunityCommentCreate(BaseModel):
    post_id: str
    parent_comment_id: Optional[str] = None
    content: str

# 12. community_votes
class CommunityVoteCreate(BaseModel):
    post_id: str
    vote_type: str = "like" # like | dislike

# 13. messages
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

# 14. notifications
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    actor_id: Optional[str] = None
    project_id: Optional[str] = None
    type: str
    title: str
    message: Optional[str] = None
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

# 15. project_follows
class ProjectFollowCreate(BaseModel):
    project_id: str
