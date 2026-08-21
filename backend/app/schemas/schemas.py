"""
INNOVEXA Pydantic Request & Response Schemas (Blueprint Section 48)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# Generic Envelope (Section 48.9)
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[dict] = None

# User & Auth
class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    role: str
    reputation_score: int
    interests: List[str] = []
    expertise: List[dict] = []
    credits: int = 50

class UserInterestsUpdate(BaseModel):
    interests: List[str]

class UserExpertiseItem(BaseModel):
    domain: str
    expertise_level: str

# Innovation
# Innovation
class InnovationCreate(BaseModel):
    creation_type: str = "IDEA" # IDEA | PRODUCT | STARTUP
    innovation_type: str = "IDEA"
    project_stage: str = "idea" # idea | prototype | mvp | beta | live
    development_stage: str = "CONCEPT"
    title: str
    short_description: str
    description: Optional[str] = None
    problem_statement: str
    proposed_solution: str
    target_users: Optional[str] = None
    category_id: str
    tags: List[str] = []
    features: List[str] = []
    technology_stack: Optional[List[str]] = None
    images: List[str] = []
    cover_image: Optional[str] = None
    
    # Optional links
    website_url: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    app_store_url: Optional[str] = None
    play_store_url: Optional[str] = None
    has_live_product: Optional[bool] = False
    next_community_action: Optional[str] = "follow"

class LaunchUpdate(BaseModel):
    project_stage: str # idea | prototype | mvp | beta | live
    website_url: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    app_store_url: Optional[str] = None
    play_store_url: Optional[str] = None
    next_community_action: Optional[str] = "follow"
    launch_status: str = "published" # published | ready_to_launch

class InnovationDetail(BaseModel):
    id: str
    user_id: str
    category_id: str
    category_name: Optional[str] = None
    title: str
    short_description: str
    description: Optional[str] = None
    creation_type: str = "IDEA"
    innovation_type: str = "IDEA"
    project_stage: str = "idea"
    development_stage: str = "CONCEPT"
    status: str = "UNDER_VALIDATION"
    launch_status: str = "validating"
    problem_statement: str
    proposed_solution: str
    target_users: Optional[str] = None
    tags: List[str] = []
    features: List[str] = []
    images: List[str] = []
    cover_image: Optional[str] = None
    website_url: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    app_store_url: Optional[str] = None
    play_store_url: Optional[str] = None
    has_live_product: Optional[bool] = False
    next_community_action: Optional[str] = "follow"
    validation_target: int = 10
    valid_reviews_count: int = 0
    upvotes_count: int = 0
    version: int = 1
    published_at: Optional[datetime] = None
    created_at: datetime

# Related Feedback (Section 48.3)
class RelatedFeedbackCreate(BaseModel):
    related_innovation_id: str
    is_related: str # YES | NO
    solves_similar_problem: str # YES | NO
    is_useful: str # YES | MAYBE | NO
    would_recommend: str # YES | MAYBE | NO
    suggestion: Optional[str] = None

# Reviews (Section 48.5)
class ReviewCreate(BaseModel):
    problem_relevance: str # YES | NO
    solution_usefulness: str # YES | MAYBE | NO
    would_use: str # YES | MAYBE | NO
    rating: int = Field(..., ge=1, le=5)
    liked_text: Optional[str] = None
    improvement_text: Optional[str] = None
    feature_request: Optional[str] = None
    interaction_seconds: int = 0

class ReviewResponse(BaseModel):
    id: str
    innovation_id: str
    reviewer_id: str
    rating: int
    quality_score: int
    review_status: str # VALID | LOW_QUALITY | FLAGGED_SPAM
    created_at: datetime

# Creator Decision (Section 48.6)
class CreatorDecision(BaseModel):
    action: str # IMPROVE | KEEP | RESUBMIT | PUBLISH
    changelog: Optional[str] = None

# Comments (Section 48.7)
class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None
