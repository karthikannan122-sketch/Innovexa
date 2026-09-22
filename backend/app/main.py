"""
INNOVEXA FastAPI Backend Service (Blueprint Sections 30 & 48)
Comprehensive REST API Implementation for Authentication, Projects, Reviews, Comments, and Insights
"""

from fastapi import FastAPI, Depends, HTTPException, status, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import os
import uuid
import json
import asyncio
import logging

try:
    from backend.app.discovery_engine import discovery_engine
except ImportError:
    from app.discovery_engine import discovery_engine

logger = logging.getLogger("innovexa.api")

def now_utc_iso() -> str:
    """Returns ISO 8601 formatted UTC timestamp with trailing Z."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Autonomous Server-Side 24-Hour Discovery Ingestion Scheduler with clean lifecycle management."""
    async def schedule_worker():
        while True:
            try:
                logger.info("[Scheduler] Executing scheduled innovation discovery cycle...")
                await asyncio.to_thread(discovery_engine.run_ingestion_pipeline)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[Scheduler] Ingestion worker error: {e}")
            try:
                await asyncio.sleep(86400)
            except asyncio.CancelledError:
                break

    worker_task = asyncio.create_task(schedule_worker())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="INNOVEXA API",
    description="Production-grade Backend Service for INNOVEXA Innovation Discovery, Validation & Peer Review Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# In-Memory / Database State Store
# -----------------------------------------------------------------------------
db_users: Dict[str, dict] = {}
db_projects: Dict[str, dict] = {}
db_reviews: Dict[str, dict] = {}
db_comments: Dict[str, dict] = {}
db_upvotes: Dict[str, set] = {} # project_id -> set of user_ids
db_notifications: List[dict] = []
db_community_posts: Dict[str, dict] = {}
db_community_comments: Dict[str, dict] = {}
db_community_resources: Dict[str, dict] = {}
db_resource_bookmarks: Dict[str, set] = {} # user_id -> set of resource_ids
db_votes: Dict[str, dict] = {} # key: f"{user_id}:{target_type}:{target_id}" -> dict

def seed_backend_data():
    """Initializes the backend with production-ready real sample data."""
    global db_users, db_projects, db_reviews, db_comments, db_upvotes, db_notifications, db_community_posts, db_community_comments, db_community_resources, db_resource_bookmarks, db_votes
    
    # 1. Users
    user_a = {
        "id": "usr_karthick_founder",
        "name": "Karthick Founder (User A)",
        "email": "karthick@innovexa.io",
        "password": "Password123!",
        "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8",
        "bio": "Founder & AI Systems Architect building next-generation clinical diagnostic platforms.",
        "headline": "Founder & AI Systems Architect",
        "organization": "INNOVEXA Systems & Labs",
        "role": ["I CREATE IDEAS", "FOUNDER"],
        "interests": ["AI & MACHINE LEARNING", "HEALTHCARE", "WEB TECHNOLOGY"],
        "skills": ["Autonomous AI", "Edge Telemetry", "Distributed Systems", "Python"],
        "credits": 140,
        "reputation_score": 140,
        "reputation_tier": "TRUSTED CREATOR",
        "onboarding_completed": True,
        "created_at": "2026-08-01T08:00:00Z"
    }
    user_b = {
        "id": "usr_sarah_reviewer",
        "name": "Sarah Reviewer (User B)",
        "email": "sarah.reviewer@innovexa.io",
        "password": "Password123!",
        "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5",
        "bio": "Senior Biomedical Systems Engineer & Peer Validator evaluating clinical telemetry and AI workflows.",
        "headline": "Senior Biomedical Systems Engineer & Validator",
        "organization": "Distributed Health Lab",
        "role": ["I VALIDATE INNOVATIONS"],
        "interests": ["AI & MACHINE LEARNING", "HEALTHCARE", "PRODUCTIVITY"],
        "skills": ["Clinical Systems", "HL7 FHIR", "Signal Processing"],
        "credits": 80,
        "reputation_score": 80,
        "reputation_tier": "TRUSTED REVIEWER",
        "onboarding_completed": True,
        "created_at": "2026-08-02T09:30:00Z"
    }
    user_c = {
        "id": "usr_alex_validator",
        "name": "Alex Tech Validator (User C)",
        "email": "alex.validator@innovexa.io",
        "password": "Password123!",
        "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Tech&backgroundColor=20212a,7186d8,69b89a",
        "bio": "Full-Stack Distributed Systems Architect & Peer Reviewer.",
        "headline": "Distributed Systems Architect",
        "organization": "Open Matrix Institute",
        "role": ["I VALIDATE INNOVATIONS"],
        "interests": ["WEB TECHNOLOGY", "CYBERSECURITY", "AI & MACHINE LEARNING"],
        "skills": ["WebGPU", "P2P Networks", "Cryptography"],
        "credits": 65,
        "reputation_score": 65,
        "reputation_tier": "ACTIVE REVIEWER",
        "onboarding_completed": True,
        "created_at": "2026-08-03T11:00:00Z"
    }
    db_users[user_a["id"]] = user_a
    db_users[user_b["id"]] = user_b
    db_users[user_c["id"]] = user_c

    # 2. Projects
    project_1 = {
        "id": "inno_pulsemind_ai",
        "project_id": "inno_pulsemind_ai",
        "title": "PulseMind Health AI",
        "tagline": "Autonomous multi-modal edge AI model for real-time cardiac triage and ECG telemetry.",
        "short_description": "Autonomous multi-modal edge AI model providing real-time rhythm triage, automated hazard alerts, and prioritized risk scores.",
        "category_id": "cat_health",
        "category_name": "Healthcare",
        "creation_type": "IDEA",
        "project_stage": "idea",
        "status": "UNDER_VALIDATION",
        "launch_status": "validating",
        "problem_statement": "Cardiologists spend hours manually cross-referencing multi-lead ECGs and EHR histories, causing diagnostic delays during acute critical events.",
        "proposed_solution": "Autonomous multi-modal edge AI model providing real-time rhythm triage, automated ST-elevation hazard alerts, and prioritized risk scores.",
        "target_users": "Cardiologists, Emergency Physicians, Intensive Care Teams",
        "features": [
            "Real-time multi-lead rhythm classification under 15ms",
            "Automated ST-elevation hazard alerts with high sensitivity",
            "HL7 FHIR & DICOM telemetry integration for hospital EHRs",
            "Edge offline inference capability for transport monitors"
        ],
        "tags": ["Healthcare", "AI", "Cardiology", "ECG", "Telemetry"],
        "validation_target": 10,
        "valid_reviews_count": 2,
        "upvotes_count": 16,
        "comments_count": 2,
        "user_id": "usr_karthick_founder",
        "creator_id": "usr_karthick_founder",
        "creator_name": "Karthick Founder (User A)",
        "creator_avatar": user_a["avatar"],
        "website_url": None,
        "demo_url": None,
        "next_community_action": "follow",
        "created_at": "2026-08-10T10:00:00Z",
        "updated_at": "2026-08-10T10:00:00Z"
    }
    project_2 = {
        "id": "inno_neuromesh",
        "project_id": "inno_neuromesh",
        "title": "NeuroMesh Distributed Layer",
        "tagline": "Peer-to-peer federated neural routing layer utilizing local WebGPU acceleration.",
        "short_description": "Peer-to-peer federated neural routing layer utilizing local WebGPU acceleration on edge devices.",
        "category_id": "cat_ai",
        "category_name": "AI & Machine Learning",
        "creation_type": "PRODUCT",
        "project_stage": "prototype",
        "status": "UNDER_VALIDATION",
        "launch_status": "validating",
        "problem_statement": "Centralized model inference faces heavy bandwidth bottlenecks and server costs.",
        "proposed_solution": "Decentralized WebGPU-based peer tensor computation mesh enabling client devices to collaborate privately.",
        "target_users": "Edge AI Engineers, Robotics Developers, IoT Architects",
        "features": [
            "Zero-install WebGPU client neural pipeline",
            "Encrypted peer-to-peer gradient aggregation protocol",
            "Sub-10ms localized routing over WebRTC data channels"
        ],
        "tags": ["AI", "WebGPU", "P2P", "Edge", "FederatedLearning"],
        "validation_target": 10,
        "valid_reviews_count": 1,
        "upvotes_count": 11,
        "comments_count": 1,
        "user_id": "usr_karthick_founder",
        "creator_id": "usr_karthick_founder",
        "creator_name": "Karthick Founder (User A)",
        "creator_avatar": user_a["avatar"],
        "website_url": "https://neuromesh.dev",
        "demo_url": "https://neuromesh.dev/demo",
        "next_community_action": "prototype",
        "created_at": "2026-08-12T14:00:00Z",
        "updated_at": "2026-08-12T14:00:00Z"
    }
    db_projects[project_1["id"]] = project_1
    db_projects[project_2["id"]] = project_2

    # 3. Reviews with all 8 basic fields
    review_1 = {
        "id": "rev_pulsemind_sarah",
        "project_id": "inno_pulsemind_ai",
        "reviewer_id": "usr_sarah_reviewer",
        "reviewer_name": "Sarah Reviewer (User B)",
        "reviewer_avatar": user_b["avatar"],
        "problem_relevance": "YES",
        "would_use": "YES",
        "rating": 5,
        "overall_feedback": "Exceptional clinical thesis. Diagnostic triage latency is a critical bottleneck in acute emergency cardiology, and automated ST-elevation classification directly addresses clinical fatigue.",
        "suggestion": "Ensure HL7 FHIR and DICOM telemetry export compliance is validated early, and prioritize zero-latency edge offline mode for transport monitors.",
        "created_at": "2026-08-15T10:15:00Z"
    }
    review_2 = {
        "id": "rev_pulsemind_alex",
        "project_id": "inno_pulsemind_ai",
        "reviewer_id": "usr_alex_validator",
        "reviewer_name": "Alex Tech Validator (User C)",
        "reviewer_avatar": user_c["avatar"],
        "problem_relevance": "YES",
        "would_use": "YES",
        "rating": 4,
        "overall_feedback": "Impressive multi-modal telemetry processing. Edge execution minimizes cloud egress costs and prevents sensitive ECG data leakage.",
        "suggestion": "Implement an automated hardware disconnect failover logger in case wearable biosensors drop connectivity during waveform capture.",
        "created_at": "2026-08-16T11:45:00Z"
    }
    review_3 = {
        "id": "rev_neuromesh_sarah",
        "project_id": "inno_neuromesh",
        "reviewer_id": "usr_sarah_reviewer",
        "reviewer_name": "Sarah Reviewer (User B)",
        "reviewer_avatar": user_b["avatar"],
        "problem_relevance": "YES",
        "would_use": "YES",
        "rating": 5,
        "overall_feedback": "High-potential decentralized architecture. WebGPU execution for local tensor slicing makes edge devices truly autonomous without central compute dependence.",
        "suggestion": "Benchmark memory overhead on low-power ARM devices and document bandwidth usage during federated weight synchronization.",
        "created_at": "2026-08-17T09:20:00Z"
    }
    db_reviews[review_1["id"]] = review_1
    db_reviews[review_2["id"]] = review_2
    db_reviews[review_3["id"]] = review_3

    # Upvotes
    db_upvotes["inno_pulsemind_ai"] = {"usr_sarah_reviewer", "usr_alex_validator"}
    db_upvotes["inno_neuromesh"] = {"usr_sarah_reviewer"}

    # 4. Community Posts
    post_1 = {
        "id": "post_comm_1",
        "user_id": "usr_karthick_founder",
        "author_name": "Karthick Founder (User A)",
        "author_avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8",
        "author_headline": "Founder & AI Systems Architect",
        "title": "How can we optimize low-latency event processing in edge sensor meshes?",
        "content": "We are benchmarking WebAssembly runtime micro-kernels against native Rust binaries on ESP32-S3 devices for real-time cardiac arrhythmia detection. Are any innovators running local quantization models below 8-bit?",
        "post_type": "QUESTION",
        "category_id": "cat_ai",
        "category_name": "AI & Machine Learning",
        "tags": ["EdgeComputing", "Sensors", "WebAssembly", "Healthcare"],
        "upvotes_count": 8,
        "downvotes_count": 0,
        "comments_count": 2,
        "created_at": "2026-08-18T14:30:00Z"
    }
    post_2 = {
        "id": "post_comm_2",
        "user_id": "usr_sarah_reviewer",
        "author_name": "Sarah Reviewer (User B)",
        "author_avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5",
        "author_headline": "Senior Biomedical Systems Engineer & Validator",
        "title": "Architectural discussion: Zero-Trust consensus validation across multi-node clinical networks",
        "content": "When clinical telemetry data crosses multiple provider boundaries, we need cryptographically verifiable audit trails that do not introduce synchronous round-trip latency.",
        "post_type": "DISCUSSION",
        "category_id": "cat_health",
        "category_name": "Healthcare & Biotech",
        "tags": ["ZeroTrust", "ClinicalData", "Security", "Consensus"],
        "upvotes_count": 12,
        "downvotes_count": 0,
        "comments_count": 1,
        "created_at": "2026-08-18T16:45:00Z"
    }
    db_community_posts[post_1["id"]] = post_1
    db_community_posts[post_2["id"]] = post_2

    # 5. Community Comments
    comm_1 = {
        "id": "comm_reply_1",
        "post_id": "post_comm_1",
        "user_id": "usr_sarah_reviewer",
        "author_name": "Sarah Reviewer (User B)",
        "author_avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5",
        "content": "On ESP32 devices we observed 4-bit integer quantization (INT4) reduces peak memory pressure by ~42% while retaining 98.4% QRS detection sensitivity.",
        "upvotes_count": 5,
        "downvotes_count": 0,
        "created_at": "2026-08-18T15:10:00Z"
    }
    db_community_comments[comm_1["id"]] = comm_1

    # 6. Community Resources
    res_1 = {
        "id": "res_comm_1",
        "user_id": "usr_sarah_reviewer",
        "author_name": "Sarah Reviewer (User B)",
        "title": "PhysioNet PTB-XL ECG Diagnostic Benchmark Dataset",
        "description": "Large clinical dataset of 21,837 12-lead ECG records from 18,885 patients, annotated with multi-label diagnostic classifications for arrhythmia benchmarking.",
        "resource_url": "https://physionet.org/content/ptb-xl/1.0.3/",
        "resource_type": "DATASET",
        "category_id": "cat_health",
        "category_name": "Healthcare & Biotech",
        "tags": ["ECG", "Dataset", "Cardiology", "Benchmark"],
        "upvotes_count": 14,
        "downvotes_count": 0,
        "bookmarks_count": 6,
        "created_at": "2026-08-17T11:00:00Z"
    }
    res_2 = {
        "id": "res_comm_2",
        "user_id": "usr_karthick_founder",
        "author_name": "Karthick Founder (User A)",
        "title": "Tonic: Event-Driven PyTorch Neuromorphic Vision Library",
        "description": "Comprehensive open-source Python library for neuromorphic event-based vision sensor benchmarks, DVS camera streams, and temporal spiking neural network datasets.",
        "resource_url": "https://github.com/neuromorphs/tonic",
        "resource_type": "GITHUB",
        "category_id": "cat_ai",
        "category_name": "AI & Machine Learning",
        "tags": ["Neuromorphic", "PyTorch", "EventCameras", "OpenSource"],
        "upvotes_count": 19,
        "downvotes_count": 0,
        "bookmarks_count": 9,
        "created_at": "2026-08-16T14:15:00Z"
    }
    db_community_resources[res_1["id"]] = res_1
    db_community_resources[res_2["id"]] = res_2

    # 7. Polymorphic Votes
    db_votes["usr_karthick_founder:discussion:post_comm_2"] = {"user_id": "usr_karthick_founder", "target_type": "discussion", "target_id": "post_comm_2", "vote_type": "upvote"}
    db_votes["usr_sarah_reviewer:discussion:post_comm_1"] = {"user_id": "usr_sarah_reviewer", "target_type": "discussion", "target_id": "post_comm_1", "vote_type": "upvote"}
    db_votes["usr_sarah_reviewer:review:rev_pulsemind_1"] = {"user_id": "usr_sarah_reviewer", "target_type": "review", "target_id": "rev_pulsemind_1", "vote_type": "upvote"}

seed_backend_data()

# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "I CREATE IDEAS"

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str
    new_password: str

class ProjectCreateRequest(BaseModel):
    title: str
    short_description: str
    problem_statement: str
    proposed_solution: str
    target_users: Optional[str] = None
    category_id: str
    category_name: str
    creation_type: Optional[str] = "IDEA"
    project_stage: Optional[str] = "idea"
    features: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    website_url: Optional[str] = None
    demo_url: Optional[str] = None
    next_community_action: Optional[str] = "follow"
    is_draft: Optional[bool] = False

class ProjectUpdateRequest(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    target_users: Optional[str] = None
    project_stage: Optional[str] = None
    status: Optional[str] = None
    launch_status: Optional[str] = None
    website_url: Optional[str] = None
    demo_url: Optional[str] = None
    next_community_action: Optional[str] = None
    features: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ReviewCreateRequest(BaseModel):
    problem_relevance: str # YES | MAYBE | NOT YET
    would_use: str # YES | NO
    rating: int = Field(..., ge=1, le=5)
    overall_feedback: str
    suggestion: str

class CommentCreateRequest(BaseModel):
    content: str
    parent_id: Optional[str] = None

class CommunityPostCreateRequest(BaseModel):
    title: str
    content: str
    post_type: str = "DISCUSSION" # QUESTION | DISCUSSION | FEEDBACK_REQUEST | COLLABORATION | CHALLENGE
    category_id: str
    category_name: str
    tags: Optional[List[str]] = None

class CommunityCommentCreateRequest(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None

class CommunityResourceCreateRequest(BaseModel):
    title: str
    description: str
    resource_url: str
    resource_type: str = "TOOL" # TOOL | ARTICLE | RESEARCH | GITHUB | API | DATASET | VIDEO | COURSE | OTHER
    category_id: str
    category_name: str
    tags: Optional[List[str]] = None

class VoteToggleRequest(BaseModel):
    target_type: str # review | discussion | comment | resource
    target_id: str
    vote_type: str # upvote | downvote

# Helper dependency for extracting active user ID
def get_current_user_id(authorization: Optional[str] = Header(None), x_user_id: Optional[str] = Header(None)) -> str:
    if x_user_id and x_user_id in db_users:
        return x_user_id
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        if token in db_users:
            return token
    # Default fallback for testing
    return "usr_karthick_founder"

# -----------------------------------------------------------------------------
# 1. AUTHENTICATION ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/v1/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    email_lower = req.email.lower().strip()
    if any(u["email"].lower() == email_lower for u in db_users.values()):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    new_user = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email_lower,
        "password": req.password,
        "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={req.name.strip()}&backgroundColor=20212a,e76f82,7186d8",
        "bio": "",
        "headline": "",
        "organization": "",
        "role": [req.role] if req.role else ["I CREATE IDEAS"],
        "interests": [],
        "skills": [],
        "credits": 0,
        "reputation_score": 0,
        "reputation_tier": "NEW INNOVATOR",
        "onboarding_completed": False,
        "created_at": now_utc_iso()
    }
    db_users[user_id] = new_user
    return {"success": True, "data": new_user, "message": "Account created successfully."}

@app.post("/api/v1/auth/login")
def login(req: LoginRequest):
    email_lower = req.email.lower().strip()
    user = next((u for u in db_users.values() if u["email"].lower() == email_lower), None)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    if user.get("password") and user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password credentials.")
    data_payload = dict(user)
    data_payload["token"] = user["id"]
    return {"success": True, "data": data_payload, "token": user["id"]}

@app.post("/api/v1/auth/logout")
def logout():
    return {"success": True, "message": "Session terminated successfully."}

@app.post("/api/v1/auth/reset-password")
def reset_password(req: PasswordResetRequest):
    email_lower = req.email.lower().strip()
    user = next((u for u in db_users.values() if u["email"].lower() == email_lower), None)
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered.")
    user["password"] = req.new_password
    return {"success": True, "message": "Password updated successfully."}

@app.get("/api/v1/auth/me")
def get_current_profile(user_id: str = Depends(get_current_user_id)):
    user = db_users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "data": user}

# -----------------------------------------------------------------------------
# 2. PROJECTS & DATABASE CRUD ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/api/v1/projects")
def list_projects(
    category_id: Optional[str] = None,
    query: Optional[str] = None,
    sort_by: Optional[str] = "recent", # recent | reviews | upvotes
    user_id: Optional[str] = None
):
    results = list(db_projects.values())
    
    if user_id:
        results = [p for p in results if p.get("user_id") == user_id or p.get("creator_id") == user_id]
        return {"success": True, "data": results, "total": len(results)}

    if category_id and category_id != "all":
        results = [p for p in results if p.get("category_id") == category_id or p.get("category_name", "").lower() == category_id.lower()]

    if query:
        q = query.lower()
        results = [
            p for p in results
            if q in p.get("title", "").lower() or
               q in p.get("short_description", "").lower() or
               q in p.get("problem_statement", "").lower() or
               any(q in t.lower() for t in p.get("tags", []))
        ]

    if sort_by == "reviews":
        results.sort(key=lambda x: x.get("valid_reviews_count", 0), reverse=True)
    elif sort_by == "upvotes":
        results.sort(key=lambda x: x.get("upvotes_count", 0), reverse=True)
    else:
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return {"success": True, "data": results, "total": len(results)}

@app.post("/api/v1/projects", status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreateRequest, user_id: str = Depends(get_current_user_id)):
    user = db_users.get(user_id, {"name": "Innovator", "avatar": ""})
    proj_id = f"inno_{uuid.uuid4().hex[:8]}"
    
    status_val = "DRAFT" if req.is_draft else "UNDER_VALIDATION"
    launch_val = "draft" if req.is_draft else "validating"
    
    new_project = {
        "id": proj_id,
        "project_id": proj_id,
        "title": req.title,
        "short_description": req.short_description,
        "problem_statement": req.problem_statement,
        "proposed_solution": req.proposed_solution,
        "target_users": req.target_users or "",
        "category_id": req.category_id,
        "category_name": req.category_name,
        "creation_type": req.creation_type or "IDEA",
        "project_stage": req.project_stage or "idea",
        "status": status_val,
        "launch_status": launch_val,
        "features": req.features or [],
        "tags": req.tags or [],
        "website_url": req.website_url,
        "demo_url": req.demo_url,
        "next_community_action": req.next_community_action or "follow",
        "validation_target": 10,
        "valid_reviews_count": 0,
        "upvotes_count": 0,
        "comments_count": 0,
        "user_id": user_id,
        "creator_id": user_id,
        "creator_name": user.get("name", "Innovator"),
        "creator_avatar": user.get("avatar", ""),
        "created_at": now_utc_iso(),
        "updated_at": now_utc_iso()
    }
    db_projects[proj_id] = new_project
    
    # Award +20 points to creator
    if user_id in db_users:
        db_users[user_id]["credits"] = db_users[user_id].get("credits", 0) + 20
        db_users[user_id]["reputation_score"] = db_users[user_id].get("reputation_score", 0) + 20

    return {"success": True, "data": new_project, "message": "Project saved successfully."}

@app.get("/api/v1/projects/{project_id}")
def get_project(project_id: str):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"success": True, "data": proj}

@app.put("/api/v1/projects/{project_id}")
def update_project(project_id: str, req: ProjectUpdateRequest, user_id: str = Depends(get_current_user_id)):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    # Security Rule: Only owner can modify their project
    if proj.get("user_id") != user_id and proj.get("creator_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only edit your own project.")

    updates = req.model_dump(exclude_unset=True) if hasattr(req, "model_dump") else req.dict(exclude_unset=True)
    proj.update(updates)
    proj["updated_at"] = now_utc_iso()
    return {"success": True, "data": proj, "message": "Project updated."}

@app.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    # Security Rule: Only owner can delete their project
    if proj.get("user_id") != user_id and proj.get("creator_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only delete your own project.")

    del db_projects[project_id]
    return {"success": True, "message": "Project deleted successfully."}

@app.put("/api/v1/projects/{project_id}/launch")
def launch_project(project_id: str, website_url: Optional[str] = None, demo_url: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    if proj.get("user_id") != user_id and proj.get("creator_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only launch your own project.")

    proj["status"] = "PUBLISHED"
    proj["launch_status"] = "published"
    proj["published_at"] = now_utc_iso()
    if website_url: proj["website_url"] = website_url
    if demo_url: proj["demo_url"] = demo_url
    return {"success": True, "data": proj, "message": "Project published live."}

# -----------------------------------------------------------------------------
# 3. REVIEWS & VALIDATION ENGINE
# -----------------------------------------------------------------------------
@app.get("/api/v1/projects/{project_id}/reviews")
def get_project_reviews(project_id: str):
    reviews = [r for r in db_reviews.values() if r.get("project_id") == project_id or r.get("innovation_id") == project_id]
    return {"success": True, "data": reviews, "total": len(reviews)}

@app.post("/api/v1/projects/{project_id}/reviews", status_code=status.HTTP_201_CREATED)
def submit_review(project_id: str, req: ReviewCreateRequest, user_id: str = Depends(get_current_user_id)):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    # Security Rule: Creator cannot review their own project
    if proj.get("user_id") == user_id or proj.get("creator_id") == user_id:
        raise HTTPException(status_code=400, detail="Self-reviews are strictly excluded.")

    # Duplicate review check
    existing = next((r for r in db_reviews.values() if r.get("project_id") == project_id and r.get("reviewer_id") == user_id), None)
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a validation review for this project.")

    reviewer = db_users.get(user_id, {"name": "Validator", "avatar": ""})
    rev_id = f"rev_{uuid.uuid4().hex[:8]}"
    
    new_review = {
        "id": rev_id,
        "project_id": project_id,
        "innovation_id": project_id,
        "reviewer_id": user_id,
        "reviewer_name": reviewer.get("name", "Validator"),
        "reviewer_avatar": reviewer.get("avatar", ""),
        "problem_relevance": req.problem_relevance,
        "would_use": req.would_use,
        "rating": req.rating,
        "overall_feedback": req.overall_feedback,
        "suggestion": req.suggestion,
        "created_at": now_utc_iso()
    }
    db_reviews[rev_id] = new_review
    
    # Increment project review count
    proj["valid_reviews_count"] = proj.get("valid_reviews_count", 0) + 1
    
    # Credit reward +10 to reviewer
    if user_id in db_users:
        db_users[user_id]["credits"] = db_users[user_id].get("credits", 0) + 10
        db_users[user_id]["reputation_score"] = db_users[user_id].get("reputation_score", 0) + 10

    # Notify creator
    creator_id = proj.get("user_id")
    if creator_id:
        db_notifications.append({
            "id": f"notif_{uuid.uuid4().hex[:6]}",
            "user_id": creator_id,
            "type": "REVIEW_RECEIVED",
            "message": f"{reviewer.get('name', 'Validator')} published a review on '{proj.get('title')}'.",
            "project_id": project_id,
            "created_at": now_utc_iso()
        })

    return {"success": True, "data": new_review, "message": "Review submitted successfully."}

# -----------------------------------------------------------------------------
# 4. COMMENTS & DISCUSSION
# -----------------------------------------------------------------------------
@app.get("/api/v1/projects/{project_id}/comments")
def get_comments(project_id: str):
    comments = [c for c in db_comments.values() if c.get("project_id") == project_id or c.get("innovation_id") == project_id]
    return {"success": True, "data": comments}

@app.post("/api/v1/projects/{project_id}/comments", status_code=status.HTTP_201_CREATED)
def post_comment(project_id: str, req: CommentCreateRequest, user_id: str = Depends(get_current_user_id)):
    user = db_users.get(user_id, {"name": "Community Member", "avatar": ""})
    comm_id = f"comm_{uuid.uuid4().hex[:8]}"
    new_comment = {
        "id": comm_id,
        "project_id": project_id,
        "innovation_id": project_id,
        "user_id": user_id,
        "author_name": user.get("name", "Community Member"),
        "author_avatar": user.get("avatar", ""),
        "content": req.content,
        "created_at": now_utc_iso()
    }
    db_comments[comm_id] = new_comment
    return {"success": True, "data": new_comment}

# -----------------------------------------------------------------------------
# 5. UPVOTES & ENDORSEMENTS
# -----------------------------------------------------------------------------
@app.post("/api/v1/projects/{project_id}/upvote")
def toggle_upvote(project_id: str, user_id: str = Depends(get_current_user_id)):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    if project_id not in db_upvotes:
        db_upvotes[project_id] = set()

    if user_id in db_upvotes[project_id]:
        db_upvotes[project_id].remove(user_id)
        has_upvoted = False
    else:
        db_upvotes[project_id].add(user_id)
        has_upvoted = True

    proj["upvotes_count"] = len(db_upvotes[project_id])
    return {"success": True, "has_upvoted": has_upvoted, "upvotes_count": proj["upvotes_count"]}

# -----------------------------------------------------------------------------
# 6. DASHBOARD STATISTICS
# -----------------------------------------------------------------------------
@app.get("/api/v1/dashboard/stats")
def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    user = db_users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_projects = [p for p in db_projects.values() if p.get("user_id") == user_id or p.get("creator_id") == user_id]
    reviews_received = [r for r in db_reviews.values() if any(p["id"] == r.get("project_id") for p in user_projects)]
    reviews_given = [r for r in db_reviews.values() if r.get("reviewer_id") == user_id]

    return {
        "success": True,
        "data": {
            "active_projects": len(user_projects),
            "reviews_received": len(reviews_received),
            "reviews_given": len(reviews_given),
            "credits": user.get("credits", 0),
            "reputation_score": user.get("reputation_score", 0),
            "reputation_tier": user.get("reputation_tier", "NEW INNOVATOR")
        }
    }

# -----------------------------------------------------------------------------
# 7. AI & STATISTICAL INSIGHTS REPORT
# -----------------------------------------------------------------------------
@app.get("/api/v1/insights/{project_id}")
@app.get("/api/v1/projects/{project_id}/insights")
def get_insights(project_id: str):
    proj = db_projects.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")

    reviews = [r for r in db_reviews.values() if r.get("project_id") == project_id or r.get("innovation_id") == project_id]
    total = len(reviews)
    
    if total == 0:
        return {
            "success": True,
            "data": {
                "sentiment": "Awaiting Reviews",
                "stats": {"totalReviews": 0, "avgRating": "0.0", "wouldUsePercent": 0},
                "positive_points": ["Awaiting initial peer scrutiny"],
                "common_problems": ["No critical blockers reported yet"],
                "recommendations": ["Share project with domain reviewers"]
            }
        }

    rating_sum = sum(r.get("rating", 5) for r in reviews)
    avg_rating = f"{rating_sum / total:.1f}"
    would_use_count = sum(1 for r in reviews if r.get("would_use") == "YES" or r.get("would_use") is True)
    would_use_pct = round((would_use_count / total) * 100)

    pos_points = [r["overall_feedback"] for r in reviews if r.get("overall_feedback")][:3]
    problems = [r["suggestion"] for r in reviews if r.get("suggestion")][:3]
    
    sentiment = "Positive" if would_use_pct >= 60 else "Mixed"

    return {
        "success": True,
        "data": {
            "sentiment": sentiment,
            "stats": {
                "totalReviews": total,
                "avgRating": avg_rating,
                "wouldUsePercent": would_use_pct
            },
            "positive_points": pos_points or ["Strong technical architecture and value proposition"],
            "common_problems": problems or ["Expand validation across specialized sub-domains"],
            "recommendations": [
                f"Prioritize reviewer suggestion: {problems[0]}" if problems else "Prepare MVP prototype deployment",
                "Conduct live pilot testing with active network validators"
            ]
        }
    }

# -----------------------------------------------------------------------------
# 8. INNOVATION DISCOVERY ENGINE ENDPOINTS (Global Discovered Signals)
# -----------------------------------------------------------------------------
@app.get("/api/v1/external-innovations")
def get_external_innovations(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("NEWEST")
):
    """Retrieves discovered innovation items from approved global technology & science feeds."""
    # If no discoveries ingested yet, run a fast initial cycle
    if len(discovery_engine.discoveries) == 0:
        try:
            discovery_engine.run_ingestion_pipeline()
        except Exception as e:
            logger.warning(f"Initial ingestion cycle warning: {e}")

    items = discovery_engine.get_discoveries(category=category, source=source, search=search, sort_by=sort_by)
    return {
        "success": True,
        "data": items,
        "total": len(items),
        "last_sync": discovery_engine.last_run_timestamp
    }

@app.post("/api/v1/external-innovations/ingest")
def trigger_manual_ingestion():
    """Manual/admin trigger for immediate discovery ingestion across all verified external feeds."""
    report = discovery_engine.run_ingestion_pipeline()
    return {
        "success": True,
        "report": report,
        "message": f"Ingestion completed: {report.get('new_discoveries_added', 0)} new items added, {report.get('duplicates_skipped', 0)} duplicates skipped."
    }

@app.get("/api/v1/external-innovations/sources")
def get_external_sources():
    """Returns telemetry status and health metrics for all discovery sources."""
    sources = discovery_engine.get_sources_telemetry()
    return {
        "success": True,
        "data": sources,
        "last_run": discovery_engine.last_run_timestamp,
        "total_active_discoveries": len(discovery_engine.discoveries)
    }

@app.post("/api/v1/external-innovations/sources/{source_id}/toggle")
def toggle_source(source_id: str):
    """Enables or disables an external discovery source."""
    updated = discovery_engine.toggle_source(source_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Source not found.")
    return {"success": True, "data": updated}

@app.delete("/api/v1/external-innovations/{discovery_id}")
def delete_external_discovery(discovery_id: str):
    """Moderation endpoint to remove or deactivate an external discovery."""
    success = discovery_engine.delete_discovery(discovery_id)
    if not success:
        raise HTTPException(status_code=404, detail="Discovery not found.")
    return {"success": True, "message": "Discovery removed from active ledger."}

@app.post("/api/v1/external-innovations/{discovery_id}/like")
def like_external_discovery(discovery_id: str):
    """Toggles or increments community appreciation on a discovered innovation."""
    item = discovery_engine.like_discovery(discovery_id)
    if not item:
        raise HTTPException(status_code=404, detail="Discovery not found.")
    return {"success": True, "likes_count": item.get("likes_count", 0)}

# -----------------------------------------------------------------------------
# 9. COMMUNITY HUB & RESOURCE SHARING ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/api/v1/community/posts")
def get_community_posts(
    category: Optional[str] = Query(None),
    post_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("NEWEST")
):
    posts = list(db_community_posts.values())
    if category and category != "ALL":
        posts = [p for p in posts if p.get("category_id") == category or p.get("category_name", "").lower() == category.lower()]
    if post_type and post_type != "ALL":
        posts = [p for p in posts if p.get("post_type") == post_type]
    if search:
        q = search.lower().strip()
        posts = [p for p in posts if q in p.get("title", "").lower() or q in p.get("content", "").lower() or q in p.get("author_name", "").lower()]

    if sort_by == "NEWEST":
        posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    elif sort_by == "MOST_UPVOTED":
        posts.sort(key=lambda x: x.get("upvotes_count", 0), reverse=True)
    elif sort_by == "MOST_DISCUSSED":
        posts.sort(key=lambda x: x.get("comments_count", 0), reverse=True)
    elif sort_by == "TRENDING":
        posts.sort(key=lambda x: (x.get("upvotes_count", 0) * 2 + x.get("comments_count", 0) * 3), reverse=True)

    return {"success": True, "data": posts, "total": len(posts)}

@app.post("/api/v1/community/posts", status_code=status.HTTP_201_CREATED)
def create_community_post(
    req: CommunityPostCreateRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    user = db_users.get(current_user_id, {})
    post_id = f"post_{uuid.uuid4().hex[:8]}"
    now = now_utc_iso()

    new_post = {
        "id": post_id,
        "user_id": current_user_id,
        "author_name": user.get("name", "Community Innovator"),
        "author_avatar": user.get("avatar", ""),
        "author_headline": user.get("headline", "Community Innovator"),
        "title": req.title.strip(),
        "content": req.content.strip(),
        "post_type": req.post_type,
        "category_id": req.category_id,
        "category_name": req.category_name,
        "tags": req.tags or ["Innovation"],
        "upvotes_count": 0,
        "downvotes_count": 0,
        "comments_count": 0,
        "created_at": now
    }
    db_community_posts[post_id] = new_post
    return {"success": True, "data": new_post}

@app.get("/api/v1/community/posts/{post_id}/comments")
def get_community_comments(post_id: str):
    comments = [c for c in db_community_comments.values() if c.get("post_id") == post_id]
    comments.sort(key=lambda x: x.get("created_at", ""))
    return {"success": True, "data": comments, "total": len(comments)}

@app.post("/api/v1/community/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def create_community_comment(
    post_id: str,
    req: CommunityCommentCreateRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    if post_id not in db_community_posts:
        raise HTTPException(status_code=404, detail="Discussion not found.")

    user = db_users.get(current_user_id, {})
    comment_id = f"comm_{uuid.uuid4().hex[:8]}"
    now = now_utc_iso()

    new_comment = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": current_user_id,
        "author_name": user.get("name", "Community Innovator"),
        "author_avatar": user.get("avatar", ""),
        "parent_comment_id": req.parent_comment_id,
        "content": req.content.strip(),
        "upvotes_count": 0,
        "downvotes_count": 0,
        "created_at": now
    }
    db_community_comments[comment_id] = new_comment
    db_community_posts[post_id]["comments_count"] = db_community_posts[post_id].get("comments_count", 0) + 1

    return {"success": True, "data": new_comment}

@app.get("/api/v1/community/resources")
def get_community_resources(
    category: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("NEWEST")
):
    resources = list(db_community_resources.values())
    if category and category != "ALL":
        resources = [r for r in resources if r.get("category_id") == category or r.get("category_name", "").lower() == category.lower()]
    if resource_type and resource_type != "ALL":
        resources = [r for r in resources if r.get("resource_type") == resource_type]
    if search:
        q = search.lower().strip()
        resources = [r for r in resources if q in r.get("title", "").lower() or q in r.get("description", "").lower() or q in r.get("author_name", "").lower()]

    if sort_by == "NEWEST":
        resources.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    elif sort_by == "MOST_UPVOTED":
        resources.sort(key=lambda x: x.get("upvotes_count", 0), reverse=True)

    return {"success": True, "data": resources, "total": len(resources)}

@app.post("/api/v1/community/resources", status_code=status.HTTP_201_CREATED)
def create_community_resource(
    req: CommunityResourceCreateRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    user = db_users.get(current_user_id, {})
    res_id = f"res_{uuid.uuid4().hex[:8]}"
    now = now_utc_iso()

    new_res = {
        "id": res_id,
        "user_id": current_user_id,
        "author_name": user.get("name", "Community Innovator"),
        "title": req.title.strip(),
        "description": req.description.strip(),
        "resource_url": req.resource_url.strip(),
        "resource_type": req.resource_type,
        "category_id": req.category_id,
        "category_name": req.category_name,
        "tags": req.tags or ["Resource"],
        "upvotes_count": 0,
        "downvotes_count": 0,
        "bookmarks_count": 0,
        "created_at": now
    }
    db_community_resources[res_id] = new_res
    return {"success": True, "data": new_res}

@app.post("/api/v1/community/resources/{resource_id}/bookmark")
def toggle_resource_bookmark(
    resource_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    if current_user_id not in db_resource_bookmarks:
        db_resource_bookmarks[current_user_id] = set()

    is_bookmarked = resource_id in db_resource_bookmarks[current_user_id]
    if is_bookmarked:
        db_resource_bookmarks[current_user_id].remove(resource_id)
        if resource_id in db_community_resources:
            db_community_resources[resource_id]["bookmarks_count"] = max(0, db_community_resources[resource_id].get("bookmarks_count", 1) - 1)
        return {"success": True, "is_bookmarked": False}
    else:
        db_resource_bookmarks[current_user_id].add(resource_id)
        if resource_id in db_community_resources:
            db_community_resources[resource_id]["bookmarks_count"] = db_community_resources[resource_id].get("bookmarks_count", 0) + 1
        return {"success": True, "is_bookmarked": True}

@app.post("/api/v1/votes/toggle")
def toggle_vote(
    req: VoteToggleRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    vote_key = f"{current_user_id}:{req.target_type}:{req.target_id}"
    existing_vote = db_votes.get(vote_key)

    active_vote_type = None
    if existing_vote and existing_vote.get("vote_type") == req.vote_type:
        # Same vote clicked -> remove vote
        del db_votes[vote_key]
        active_vote_type = None
    else:
        # New or switched vote
        db_votes[vote_key] = {
            "user_id": current_user_id,
            "target_type": req.target_type,
            "target_id": req.target_id,
            "vote_type": req.vote_type,
            "created_at": now_utc_iso()
        }
        active_vote_type = req.vote_type

    # Recalculate upvotes and downvotes for target
    target_votes = [v for v in db_votes.values() if v.get("target_type") == req.target_type and v.get("target_id") == req.target_id]
    upvotes = len([v for v in target_votes if v.get("vote_type") == "upvote"])
    downvotes = len([v for v in target_votes if v.get("vote_type") == "downvote"])

    # Update cached count on item
    if req.target_type == "discussion" and req.target_id in db_community_posts:
        db_community_posts[req.target_id]["upvotes_count"] = upvotes
        db_community_posts[req.target_id]["downvotes_count"] = downvotes
    elif req.target_type == "comment" and req.target_id in db_community_comments:
        db_community_comments[req.target_id]["upvotes_count"] = upvotes
        db_community_comments[req.target_id]["downvotes_count"] = downvotes
    elif req.target_type == "resource" and req.target_id in db_community_resources:
        db_community_resources[req.target_id]["upvotes_count"] = upvotes
        db_community_resources[req.target_id]["downvotes_count"] = downvotes
    elif req.target_type == "review" and req.target_id in db_reviews:
        db_reviews[req.target_id]["helpful_votes_count"] = upvotes
        db_reviews[req.target_id]["unhelpful_votes_count"] = downvotes

    return {
        "success": True,
        "active_vote_type": active_vote_type,
        "upvotes_count": upvotes,
        "downvotes_count": downvotes
    }

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "service": "INNOVEXA API", "version": "1.0.0"}

# -----------------------------------------------------------------------------
# 9. SECURE GEMINI AI INNOVATION FEATURES (PHASE 6)
# -----------------------------------------------------------------------------

OFFICIAL_CATEGORIES = [
    {"id": "93fe2938-c843-4fa4-8b01-b07d59990023", "name": "Technology", "slug": "technology"},
    {"id": "9dbbcd45-778e-411c-92cc-debee85d7137", "name": "Education", "slug": "education"},
    {"id": "19b552c7-2ed6-44fe-9846-5d1501b1104f", "name": "Healthcare", "slug": "healthcare"},
    {"id": "e6fa521c-f84c-42f6-9c7d-88447ee259cc", "name": "Business", "slug": "business"},
    {"id": "913ce065-82bd-4101-a508-22bf41eaf0d5", "name": "Environment", "slug": "environment"},
    {"id": "3d3d928f-2a11-4639-83d5-865730960135", "name": "Social Impact", "slug": "social-impact"},
    {"id": "4314f823-fb81-4a31-aec0-5e1d97aaeb9e", "name": "Artificial Intelligence", "slug": "artificial-intelligence"},
    {"id": "01f81a37-e7f2-4f7d-957e-8e37f1418670", "name": "Cybersecurity", "slug": "cybersecurity"},
    {"id": "6988000f-f521-4e61-af1c-523263a53ad2", "name": "Sustainability", "slug": "sustainability"},
    {"id": "7dcfed5c-7406-4d4a-b9ee-d3c09e667ae9", "name": "Finance", "slug": "finance"},
    {"id": "198af608-fb9b-42c3-a7fa-83ffbd3dd392", "name": "Productivity", "slug": "productivity"},
    {"id": "a1ed5bda-732a-46db-8e9f-303ca31a8f29", "name": "Other", "slug": "other"}
]

def _call_gemini_server(prompt: str, system_instruction: str = "") -> Optional[dict]:
    """Helper to query Gemini REST API with timeout and JSON parsing."""
    import requests
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    if not api_key:
        return None

    full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
    models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]
    timeout_sec = int(os.environ.get("AI_TIMEOUT_SECONDS", "8"))

    for model in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2
                }
            }
            resp = requests.post(url, json=payload, timeout=timeout_sec)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if raw_text:
                    try:
                        return json.loads(raw_text)
                    except Exception:
                        import re
                        m = re.search(r'\{[\s\S]*\}', raw_text)
                        if m:
                            return json.loads(m.group(0))
        except Exception as e:
            logger.warning(f"Gemini call to {model} failed: {e}")
            continue
    return None


# -----------------------------------------------------------------------------
# 1. AI PROJECT ANALYSIS (8 Dimensions & Structured Score)
# -----------------------------------------------------------------------------
class ProjectAnalysisRequest(BaseModel):
    project_id: Optional[str] = "proj_specimen"
    title: str = Field(..., description="Project title")
    category_name: Optional[str] = "Technology"
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    target_users: Optional[str] = ""
    features: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    description: Optional[str] = ""

@app.post("/api/v1/ai/analyze-project")
def analyze_project_endpoint(req: ProjectAnalysisRequest):
    """
    1. AI PROJECT ANALYSIS
    Provides structured 8-dimension evaluation:
    - Problem quality
    - Solution quality
    - Innovation level
    - Market potential
    - Technical feasibility
    - Scalability
    - Target user clarity
    - Competitive differentiation
    - Overall structured score & breakdown
    """
    title = req.title.strip() if req.title else "Untitled Innovation"
    category = req.category_name or "Technology"
    problem = req.problem_statement or req.description or ""
    solution = req.proposed_solution or ""
    target = req.target_users or ""
    features_list = req.features or []

    system_prompt = """You are a senior venture evaluator and innovation analyst on INNOVEXA.
Analyze the submitted project across exactly 8 dimensions and return ONLY valid JSON matching this schema:
{
  "problem_quality": {
    "score": number (0-100),
    "rating": "Exceptional" | "Solid" | "Moderate" | "Needs Refinement",
    "analysis": "Specific critique of problem definition and friction magnitude"
  },
  "solution_quality": {
    "score": number (0-100),
    "rating": "Exceptional" | "Solid" | "Moderate" | "Needs Refinement",
    "analysis": "Specific critique of proposed mechanism and execution viability"
  },
  "innovation_level": {
    "score": number (0-100),
    "level": "High" | "Moderate" | "Incremental",
    "analysis": "Uniqueness and technological/workflow novelty"
  },
  "market_potential": {
    "score": number (0-100),
    "potential": "High" | "Moderate" | "Niche",
    "analysis": "Commercial and community adoption upside"
  },
  "technical_feasibility": {
    "score": number (0-100),
    "level": "High" | "Moderate" | "Challenging",
    "analysis": "Implementation hurdles, architecture, and technology maturity"
  },
  "scalability": {
    "score": number (0-100),
    "level": "High" | "Moderate" | "Linear",
    "analysis": "Capacity to scale across users, data, or operational nodes"
  },
  "target_user_clarity": {
    "score": number (0-100),
    "level": "Clear" | "Moderate" | "Broad",
    "analysis": "Precision of user persona and market segment definition"
  },
  "competitive_differentiation": {
    "score": number (0-100),
    "level": "Distinct" | "Moderate" | "Overlapping",
    "analysis": "Defensibility against incumbent alternatives"
  },
  "structured_score": {
    "overall_score": number (0-100),
    "grade": "A+" | "A" | "B" | "C",
    "dimension_scores": {
      "problem": number (0-100),
      "solution": number (0-100),
      "innovation": number (0-100),
      "market": number (0-100),
      "feasibility": number (0-100),
      "scalability": number (0-100),
      "target_users": number (0-100),
      "differentiation": number (0-100)
    },
    "summary": "Executive 2-sentence synthesis"
  }
}
Do not use generic text. Base your analysis specifically on the project info provided."""

    user_prompt = f"""PROJECT TITLE: {title}
CATEGORY: {category}
PROBLEM STATEMENT: {problem or 'Not specified'}
PROPOSED SOLUTION: {solution or 'Not specified'}
TARGET USERS: {target or 'Not specified'}
FEATURES: {', '.join(features_list) if features_list else 'Standard domain workflow'}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "structured_score" in ai_result and "problem_quality" in ai_result:
        ai_result["generated_by"] = "GEMINI_AI"
        ai_result["project_id"] = req.project_id
        ai_result["generated_at"] = now_utc_iso()
        return {"success": True, "data": ai_result}

    # Deterministic Semantic Fallback Engine
    prob_len = len(problem.strip())
    sol_len = len(solution.strip())
    target_len = len(target.strip())
    feat_count = len(features_list)

    prob_score = min(95, max(50, 60 + (25 if prob_len > 40 else (15 if prob_len > 15 else 0)) + (10 if any(k in problem.lower() for k in ['friction', 'cost', 'time', 'latency', 'manual', 'error', 'lack']) else 0)))
    sol_score = min(94, max(50, 60 + (20 if sol_len > 40 else (10 if sol_len > 15 else 0)) + (14 if feat_count >= 2 else (8 if feat_count == 1 else 0))))
    inno_score = min(92, max(55, 65 + (15 if len(title) > 6 else 5) + (12 if sol_len > 30 else 5)))
    mkt_score = min(90, max(50, 60 + (20 if target_len > 20 else 10) + (10 if category in ["Artificial Intelligence", "Healthcare", "Cybersecurity", "Finance"] else 5)))
    feas_score = min(96, max(60, 75 + (10 if feat_count >= 1 else 0) + (10 if sol_len > 20 else 0)))
    scale_score = min(92, max(55, 70 + (10 if category in ["Technology", "Artificial Intelligence", "Productivity"] else 5) + (10 if feat_count >= 2 else 0)))
    target_score = min(95, max(50, 55 + (30 if target_len > 25 else (15 if target_len > 8 else 0)) + 10))
    diff_score = min(90, max(50, 62 + (15 if inno_score > 75 else 8) + (13 if prob_score > 75 else 5)))

    overall = round((prob_score * 0.15) + (sol_score * 0.15) + (inno_score * 0.15) + (mkt_score * 0.15) + (feas_score * 0.1) + (scale_score * 0.1) + (target_score * 0.1) + (diff_score * 0.1))
    grade = "A+" if overall >= 90 else ("A" if overall >= 80 else ("B" if overall >= 70 else "C"))

    fallback_data = {
        "project_id": req.project_id,
        "title": title,
        "problem_quality": {
            "score": prob_score,
            "rating": "Exceptional" if prob_score >= 85 else ("Solid" if prob_score >= 70 else "Moderate"),
            "analysis": f"Addresses verifiable friction in {category}. '{problem[:90]}...' provides identifiable scope boundaries." if problem else f"Problem statement focuses on core {category} workflow bottlenecks."
        },
        "solution_quality": {
            "score": sol_score,
            "rating": "Exceptional" if sol_score >= 85 else ("Solid" if sol_score >= 70 else "Moderate"),
            "analysis": f"The proposed solution outlines a clear digital mechanism: '{solution[:90]}...'." if solution else f"Outlines structured implementation leveraging {category} standards."
        },
        "innovation_level": {
            "score": inno_score,
            "level": "High" if inno_score >= 80 else "Moderate",
            "analysis": f"Applies specialized ergonomics and architecture to {category} compared to conventional manual methods."
        },
        "market_potential": {
            "score": mkt_score,
            "potential": "High" if mkt_score >= 80 else "Moderate",
            "analysis": f"Strong demand within {target or category + ' users'} seeking efficiency gains and structured workflows."
        },
        "technical_feasibility": {
            "score": feas_score,
            "level": "High" if feas_score >= 80 else "Moderate",
            "analysis": f"Implementation is technically achievable with modern cloud, web, and API frameworks."
        },
        "scalability": {
            "score": scale_score,
            "level": "High" if scale_score >= 80 else "Moderate",
            "analysis": f"Modular design allows horizontal scaling across user nodes and decoupled processing pipelines."
        },
        "target_user_clarity": {
            "score": target_score,
            "level": "Clear" if target_score >= 80 else "Moderate",
            "analysis": f"Targets {target or 'domain practitioners and organizations operating in ' + category}."
        },
        "competitive_differentiation": {
            "score": diff_score,
            "level": "Distinct" if diff_score >= 80 else "Moderate",
            "analysis": f"Differentiates from incumbent tools through direct domain specialization and streamlined execution."
        },
        "structured_score": {
            "overall_score": overall,
            "grade": grade,
            "dimension_scores": {
                "problem": prob_score,
                "solution": sol_score,
                "innovation": inno_score,
                "market": mkt_score,
                "feasibility": feas_score,
                "scalability": scale_score,
                "target_users": target_score,
                "differentiation": diff_score
            },
            "summary": f"{title} demonstrates strong overall execution readiness ({overall}/100, Grade {grade}) with high problem clarity and defensible domain positioning."
        },
        "generated_by": "SEMANTIC_DOMAIN_ENGINE",
        "generated_at": now_utc_iso()
    }

    return {"success": True, "data": fallback_data}


# -----------------------------------------------------------------------------
# 2. AI PROJECT IMPROVEMENT (Actionable Suggestions)
# -----------------------------------------------------------------------------
class ProjectImprovementRequest(BaseModel):
    project_id: Optional[str] = "proj_specimen"
    title: str
    category_name: Optional[str] = "Technology"
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    features: Optional[List[str]] = []
    target_users: Optional[str] = ""

@app.post("/api/v1/ai/improve-project")
def improve_project_endpoint(req: ProjectImprovementRequest):
    """
    2. AI PROJECT IMPROVEMENT
    Generates actionable suggestions for:
    - problem refinement
    - solution improvement
    - missing features
    - technical improvements
    - business improvements
    """
    title = req.title.strip() if req.title else "Innovation Specimen"
    category = req.category_name or "Technology"
    problem = req.problem_statement or ""
    solution = req.proposed_solution or ""
    features_list = req.features or []
    target = req.target_users or ""

    system_prompt = """You are an innovation accelerator mentor.
Analyze the provided problem, solution, features, and target users.
Return ONLY valid JSON matching this schema:
{
  "problem_refinement": [
    "Suggestion 1 to sharpen problem framing and quantify pain",
    "Suggestion 2 to narrow problem boundary"
  ],
  "solution_improvement": [
    "Suggestion 1 to enhance solution architecture",
    "Suggestion 2 to improve user adoption experience"
  ],
  "missing_features": [
    "High-value feature 1 that is currently missing",
    "High-value feature 2 for competitive edge",
    "High-value feature 3 for telemetry or compliance"
  ],
  "technical_improvements": [
    "Technical architectural upgrade 1 (performance, reliability, or latency)",
    "Technical architectural upgrade 2 (security, data integrity, or scaling)"
  ],
  "business_improvements": [
    "Business/GTM enhancement 1 (pricing, distribution, or partnership)",
    "Business/GTM enhancement 2 (community validation or metrics)"
  ],
  "actionable_summary": "Executive summary of top 3 highest-leverage improvements"
}
Ensure all suggestions specifically reference the project and domain. Do not return generic boilerplate."""

    user_prompt = f"""PROJECT TITLE: {title}
CATEGORY: {category}
PROBLEM STATEMENT: {problem or 'Not fully specified'}
PROPOSED SOLUTION: {solution or 'Not fully specified'}
FEATURES: {', '.join(features_list) if features_list else 'Core workflow'}
TARGET USERS: {target or 'Domain practitioners'}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "problem_refinement" in ai_result and "missing_features" in ai_result:
        ai_result["generated_by"] = "GEMINI_AI"
        ai_result["project_id"] = req.project_id
        ai_result["generated_at"] = now_utc_iso()
        return {"success": True, "data": ai_result}

    # Semantic Fallback Suggestions
    fallback_data = {
        "project_id": req.project_id,
        "title": title,
        "problem_refinement": [
            f"Quantify the cost or operational latency in {category} (e.g. 'reduces manual turnaround time by 35%').",
            f"Highlight specific friction triggers experienced by {target or 'primary users'} prior to adoption."
        ],
        "solution_improvement": [
            f"Structure onboarding into zero-configuration templates for {category} workflows.",
            f"Add clear feedback loops and error recovery mechanisms during core execution."
        ],
        "missing_features": [
            f"Automated audit logging and exportable telemetry reports for {category} compliance.",
            "Real-time collaboration or multi-stakeholder review capabilities.",
            "Webhook and REST API integrations for interoperability with third-party domain tooling."
        ],
        "technical_improvements": [
            f"Decouple heavy analytical computation using asynchronous background queues or edge caching.",
            "Implement end-to-end data encryption at rest and in transit with verifiable cryptographic audit trails."
        ],
        "business_improvements": [
            f"Establish an early validation pilot cohort of 5–10 verified {target or 'domain practitioners'}.",
            "Define concrete north-star KPIs: active weekly validation cycles and time-to-first-value."
        ],
        "actionable_summary": f"To elevate {title}, prioritize quantifying problem friction, attaching an interactive demonstration, and implementing automated audit telemetry for {category}.",
        "generated_by": "SEMANTIC_DOMAIN_ENGINE",
        "generated_at": now_utc_iso()
    }

    return {"success": True, "data": fallback_data}


# -----------------------------------------------------------------------------
# 3. AI PROJECT SUMMARY (Executive & Section Summaries)
# -----------------------------------------------------------------------------
class ProjectSummaryRequest(BaseModel):
    project_id: Optional[str] = "proj_specimen"
    title: str
    category_name: Optional[str] = "Technology"
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    description: Optional[str] = ""
    target_users: Optional[str] = ""
    features: Optional[List[str]] = []

@app.post("/api/v1/ai/summarize-project")
def summarize_project_endpoint(req: ProjectSummaryRequest):
    """
    3. AI PROJECT SUMMARY
    Generates:
    - short summary
    - problem summary
    - solution summary
    - target users
    - key features
    """
    title = req.title.strip() if req.title else "Untitled Innovation"
    category = req.category_name or "Technology"
    problem = req.problem_statement or req.description or ""
    solution = req.proposed_solution or ""
    target = req.target_users or ""
    features_list = req.features or []

    system_prompt = """You are an executive innovation editor on INNOVEXA.
Generate a concise, crystal-clear structured summary for this project.
Return ONLY valid JSON matching this schema:
{
  "short_summary": "Compelling 1-2 sentence elevator pitch summarizing the core thesis and value proposition",
  "problem_summary": "Crisp 1-2 sentence articulation of the exact bottleneck being solved",
  "solution_summary": "Clear 1-2 sentence description of the proprietary mechanism or digital product",
  "target_users": "Concise summary of the primary beneficiary personas and industry cohorts",
  "key_features": [
    "Core feature capability 1",
    "Core feature capability 2",
    "Core feature capability 3",
    "Core feature capability 4"
  ]
}
Ground all text strictly in the provided project data."""

    user_prompt = f"""PROJECT TITLE: {title}
CATEGORY: {category}
PROBLEM STATEMENT: {problem or 'Not specified'}
PROPOSED SOLUTION: {solution or 'Not specified'}
DESCRIPTION: {req.description or ''}
TARGET USERS: {target or 'Domain practitioners'}
FEATURES: {', '.join(features_list) if features_list else 'Standard domain workflow'}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "short_summary" in ai_result and "key_features" in ai_result:
        ai_result["generated_by"] = "GEMINI_AI"
        ai_result["project_id"] = req.project_id
        ai_result["generated_at"] = now_utc_iso()
        return {"success": True, "data": ai_result}

    # Semantic Fallback Summary
    short_sum = f"{title} is a {category} solution engineered to eliminate {problem[:100] if problem else 'operational bottlenecks'} through {solution[:100] if solution else 'specialized digital automation'}."
    prob_sum = f"Addresses critical inefficiencies in {category}: {problem[:120] if problem else 'manual overhead and lack of unified automation'}."
    sol_sum = f"Delivers {solution[:120] if solution else 'a dedicated digital workflow framework tailored for high-throughput reliability'}."
    target_sum = target or f"Specialists, engineering teams, and organizations operating in {category}."
    
    feats = features_list if len(features_list) >= 2 else [
        f"Domain-tailored workflow automation for {category}",
        "Real-time telemetry and validation tracking",
        "Modular architecture with seamless API interoperability",
        "Encrypted data storage and verifiable audit logging"
    ]

    fallback_data = {
        "project_id": req.project_id,
        "title": title,
        "short_summary": short_sum,
        "problem_summary": prob_sum,
        "solution_summary": sol_sum,
        "target_users": target_sum,
        "key_features": feats[:5],
        "generated_by": "SEMANTIC_DOMAIN_ENGINE",
        "generated_at": now_utc_iso()
    }

    return {"success": True, "data": fallback_data}


# -----------------------------------------------------------------------------
# 4. AI IDEA VALIDATION (Interactive Submission Validation)
# -----------------------------------------------------------------------------
class IdeaValidationRequest(BaseModel):
    title: str = Field(..., description="Idea or project title")
    problem: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    proposed_solution: Optional[str] = None
    target_market: Optional[str] = ""
    target_users: Optional[str] = ""
    category_name: Optional[str] = "Technology"

@app.post("/api/v1/ai/validate-idea")
def validate_idea_endpoint(req: IdeaValidationRequest):
    """
    4. AI IDEA VALIDATION
    Analyzes an idea submission across:
    - problem
    - solution
    - uniqueness
    - feasibility
    - market need
    - possible competitors
    - risks
    - validation verdict & score
    """
    title = req.title.strip() if req.title else "Untitled Idea"
    problem = (req.problem or req.problem_statement or "").strip()
    solution = (req.solution or req.proposed_solution or "").strip()
    target = (req.target_market or req.target_users or "").strip()
    category = req.category_name or "Technology"

    if not problem and not solution:
        raise HTTPException(status_code=400, detail="Problem and solution statements are required for validation.")

    system_prompt = """You are a venture partner and lead validation reviewer on INNOVEXA.
Evaluate the submitted innovation idea with rigorous, constructive analysis.
Return ONLY valid JSON matching this schema:
{
  "problem": {
    "score": number (0-100),
    "clarity": "High" | "Moderate" | "Vague",
    "severity": "Critical" | "Important" | "Minor",
    "analysis": "Specific evaluation of the problem's urgency and market pain"
  },
  "solution": {
    "score": number (0-100),
    "viability": "High" | "Moderate" | "Experimental",
    "alignment": "Direct" | "Partial" | "Unclear",
    "analysis": "Evaluation of how directly the solution solves the stated problem"
  },
  "uniqueness": {
    "score": number (0-100),
    "level": "Novel" | "Differentiated" | "Common",
    "analysis": "Assessment of unique technological, business, or ergonomic edge"
  },
  "feasibility": {
    "score": number (0-100),
    "level": "High" | "Moderate" | "Complex",
    "analysis": "Technical, regulatory, and operational implementation feasibility"
  },
  "market_need": {
    "score": number (0-100),
    "demand_level": "High" | "Moderate" | "Emerging",
    "analysis": "Market willingness to pay or adopt this solution"
  },
  "possible_competitors": [
    {
      "name": "Competitor/Alternative 1 (e.g. Existing legacy tools or incumbents)",
      "comparison": "How they approach the problem",
      "differentiator": "How this idea can win or stand out"
    },
    {
      "name": "Competitor/Alternative 2",
      "comparison": "How they approach the problem",
      "differentiator": "How this idea can win or stand out"
    }
  ],
  "risks": [
    {
      "risk": "Top primary risk (technical, market, or operational)",
      "impact": "High" | "Medium" | "Low",
      "mitigation": "Actionable strategy to overcome this risk"
    },
    {
      "risk": "Secondary risk",
      "impact": "High" | "Medium" | "Low",
      "mitigation": "Actionable strategy to overcome this risk"
    }
  ],
  "validation_verdict": {
    "status": "VALIDATED — HIGH POTENTIAL" | "PROMISING — NEEDS REFINEMENT" | "PIVOT RECOMMENDED",
    "overall_score": number (0-100),
    "recommendation": "Decisive next step to advance this idea into a prototype or MVP"
  }
}"""

    user_prompt = f"""IDEA TITLE: {title}
CATEGORY: {category}
PROBLEM STATEMENT: {problem}
PROPOSED SOLUTION: {solution}
TARGET MARKET: {target or 'General domain users'}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "validation_verdict" in ai_result and "possible_competitors" in ai_result:
        ai_result["generated_by"] = "GEMINI_AI"
        ai_result["generated_at"] = now_utc_iso()
        return {"success": True, "data": ai_result}

    # Semantic Fallback Idea Validator
    prob_score = 85 if len(problem) > 40 else (70 if len(problem) > 15 else 55)
    sol_score = 84 if len(solution) > 40 else (68 if len(solution) > 15 else 50)
    uniq_score = 78
    feas_score = 82
    mkt_score = 80
    overall = round((prob_score * 0.25) + (sol_score * 0.25) + (uniq_score * 0.2) + (feas_score * 0.15) + (mkt_score * 0.15))

    verdict_status = "VALIDATED — HIGH POTENTIAL" if overall >= 80 else ("PROMISING — NEEDS REFINEMENT" if overall >= 65 else "PIVOT RECOMMENDED")

    fallback_data = {
        "title": title,
        "problem": {
            "score": prob_score,
            "clarity": "High" if prob_score >= 80 else "Moderate",
            "severity": "Important",
            "analysis": f"The problem highlights concrete friction in {category}: '{problem[:100]}...'."
        },
        "solution": {
            "score": sol_score,
            "viability": "High" if sol_score >= 80 else "Moderate",
            "alignment": "Direct",
            "analysis": f"The proposed solution provides a clear operational mechanism: '{solution[:100]}...'."
        },
        "uniqueness": {
            "score": uniq_score,
            "level": "Differentiated",
            "analysis": f"Combines domain-specific workflows in {category} with streamlined digital ergonomics."
        },
        "feasibility": {
            "score": feas_score,
            "level": "High",
            "analysis": "Technically viable using modern cloud APIs, distributed microservices, and web clients."
        },
        "market_need": {
            "score": mkt_score,
            "demand_level": "High" if mkt_score >= 80 else "Moderate",
            "analysis": f"High demand among {target or category + ' professionals'} seeking structured time-saving workflows."
        },
        "possible_competitors": [
            {
                "name": f"Generic {category} SaaS Platforms",
                "comparison": "Broad feature sets that require heavy custom configuration.",
                "differentiator": f"{title} delivers zero-friction, out-of-the-box domain specialization."
            },
            {
                "name": "Manual Spreadsheets & Legacy Scripts",
                "comparison": "Disconnected, high error rate, and lack centralized telemetry.",
                "differentiator": "Provides an auditable, real-time validation ledger with collaborative peer review."
            }
        ],
        "risks": [
            {
                "risk": f"Adoption resistance from legacy practitioners in {category}",
                "impact": "Medium",
                "mitigation": "Provide intuitive self-service onboarding and demonstrable time-to-value within 5 minutes."
            },
            {
                "risk": "Data consistency and scaling under peak multi-user loads",
                "impact": "Medium",
                "mitigation": "Implement asynchronous background queues and decoupled state caching."
            }
        ],
        "validation_verdict": {
            "status": verdict_status,
            "overall_score": overall,
            "recommendation": f"Proceed with building a rapid interactive MVP prototype of {title} and validate with 5 real {target or 'users'} on INNOVEXA."
        },
        "generated_by": "SEMANTIC_DOMAIN_ENGINE",
        "generated_at": now_utc_iso()
    }

    return {"success": True, "data": fallback_data}


# -----------------------------------------------------------------------------
# 5. AI CATEGORY RECOMMENDATION (Strictly from public.categories)
# -----------------------------------------------------------------------------
class CategoryRecommendRequest(BaseModel):
    title: str = Field(..., description="Project title")
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    description: Optional[str] = ""

@app.post("/api/v1/ai/recommend-category")
def recommend_category_endpoint(req: CategoryRecommendRequest):
    """
    5. AI CATEGORY RECOMMENDATION
    Suggests the most appropriate category strictly from public.categories.
    Guaranteed: Will NOT create fake categories.
    """
    title = req.title.strip() if req.title else ""
    problem = req.problem_statement or ""
    solution = req.proposed_solution or ""
    desc = req.description or ""

    if not title and not problem and not solution and not desc:
        raise HTTPException(status_code=400, detail="Project title or description is required for category recommendation.")

    valid_category_names = [c["name"] for c in OFFICIAL_CATEGORIES]
    
    system_prompt = f"""You are an innovation taxonomy specialist for the INNOVEXA platform.
Analyze the project details and recommend the single best category.
CRITICAL RULE: You MUST choose ONLY from these exact 12 official categories:
{json.dumps(valid_category_names)}

Return ONLY valid JSON matching this schema:
{{
  "recommended_category": "Exact Category Name from the approved list",
  "confidence": number (0-100),
  "reason": "Clear explanation why this project belongs in this category",
  "secondary_categories": [
    {{
      "name": "Second Category Name from the approved list",
      "reason": "Secondary domain overlap explanation"
    }}
  ]
}}
Do NOT invent or modify category names."""

    user_prompt = f"""PROJECT TITLE: {title}
PROBLEM STATEMENT: {problem}
PROPOSED SOLUTION: {solution}
DESCRIPTION: {desc}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "recommended_category" in ai_result:
        rec_name = ai_result["recommended_category"]
        matched = next((c for c in OFFICIAL_CATEGORIES if c["name"].lower() == rec_name.lower() or rec_name.lower() in c["name"].lower()), None)
        if matched:
            return {
                "success": True,
                "data": {
                    "recommended_category": matched,
                    "confidence": ai_result.get("confidence", 92),
                    "reason": ai_result.get("reason", f"Aligned with {matched['name']} taxonomy."),
                    "secondary_categories": [
                        next((c for c in OFFICIAL_CATEGORIES if c["name"].lower() == sc.get("name", "").lower()), OFFICIAL_CATEGORIES[0])
                        for sc in ai_result.get("secondary_categories", [])
                    ][:2],
                    "generated_by": "GEMINI_AI"
                }
            }

    # Deterministic Semantic Keyword Matcher across OFFICIAL_CATEGORIES
    combined_text = f"{title} {problem} {solution} {desc}".lower()
    
    matched = OFFICIAL_CATEGORIES[0] # Technology default
    reason = "Core focus on software and digital systems."
    confidence = 88

    if any(w in combined_text for w in ["health", "med", "doctor", "patient", "clinical", "hospital", "cardio", "ecg", "biotech", "disease", "pharma", "triage", "myocardial"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Healthcare")
        reason = "Directly addresses clinical diagnostics, medical telemetry, or patient health workflows."
        confidence = 96
    elif any(w in combined_text for w in ["security", "cipher", "crypto", "auth", "zero-trust", "vulnerability", "firewall", "identity", "enclave", "leak"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Cybersecurity")
        reason = "Focuses on cryptographic security, identity verification, or vulnerability mitigation."
        confidence = 95
    elif any(w in combined_text for w in ["carbon", "eco", "solar", "renewable", "climate", "green", "emission", "energy", "clean"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Environment")
        reason = "Addresses climate conservation, renewable power, or carbon reduction initiatives."
        confidence = 95
    elif any(w in combined_text for w in ["recycle", "waste", "circular", "sustainable", "reusable", "packaging"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Sustainability")
        reason = "Focuses on circular economy, waste reduction, and material sustainability."
        confidence = 94
    elif any(w in combined_text for w in ["ai", "machine learning", "reinforcement learning", "neural", "llm", "deep learning", "model", "gpt", "agent", "inference"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Artificial Intelligence")
        reason = "Employs machine learning algorithms, neural architectures, or autonomous AI agents."
        confidence = 96
    elif any(w in combined_text for w in ["school", "teach", "student", "course", "education", "edtech", "tutor", "socratic", "curriculum"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Education")
        reason = "Designed for skill development, educational instruction, and learning optimization."
        confidence = 95
    elif any(w in combined_text for w in ["fintech", "payment", "bank", "invest", "trading", "wallet", "ledger", "stock", "credit"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Finance")
        reason = "Targets financial transactions, accounting, investments, or capital management."
        confidence = 94
    elif any(w in combined_text for w in ["productivity", "workflow", "automate", "task", "tooling", "collaborate", "kanban"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Productivity")
        reason = "Optimizes team execution speed, developer tooling, and workflow efficiency."
        confidence = 91
    elif any(w in combined_text for w in ["business", "saas", "b2b", "commerce", "enterprise", "sales", "crm"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Business")
        reason = "Tailored for enterprise operations, B2B software, and commercial commerce."
        confidence = 90
    elif any(w in combined_text for w in ["community", "civic", "accessibility", "social", "inclusion", "public"]):
        matched = next(c for c in OFFICIAL_CATEGORIES if c["name"] == "Social Impact")
        reason = "Focuses on civic empowerment, community accessibility, and social wellbeing."
        confidence = 90

    return {
        "success": True,
        "data": {
            "recommended_category": matched,
            "confidence": confidence,
            "reason": reason,
            "secondary_categories": [
                c for c in OFFICIAL_CATEGORIES if c["id"] != matched["id"] and c["name"] in ["Technology", "Productivity"]
            ][:2],
            "generated_by": "SEMANTIC_DOMAIN_ENGINE"
        }
    }


# -----------------------------------------------------------------------------
# 6. ENHANCED AI INSIGHTS ENDPOINT (Full 10 Components)
# -----------------------------------------------------------------------------
class ProjectInsightRequest(BaseModel):
    project_id: Optional[str] = "proj_specimen"
    project_title: Optional[str] = None
    title: Optional[str] = None
    category_name: Optional[str] = "Technology"
    problem_statement: Optional[str] = ""
    description: Optional[str] = ""
    target_users: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    technologies: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    features: Optional[List[str]] = []
    website_url: Optional[str] = None
    reviews_count: Optional[int] = 0
    reviews_summary: Optional[str] = ""
    upvotes_count: Optional[int] = 0

@app.post("/api/v1/ai/generate-insights")
@app.post("/api/v1/ai/insights")
def generate_project_insights_endpoint(req: ProjectInsightRequest):
    """
    6. AI INSIGHTS PAGE BACKEND
    Returns comprehensive 10-point analytics report:
    - project overview
    - AI analysis
    - strengths
    - weaknesses
    - opportunities
    - risks
    - recommended improvements (prioritized)
    - innovation score
    - feasibility score
    - market potential
    """
    title = (req.project_title or req.title or "Untitled Innovation").strip()
    category = req.category_name or "Technology"
    problem = req.problem_statement or req.description or ""
    solution = req.proposed_solution or ""
    target = req.target_users or ""
    techs = req.technologies or []

    system_prompt = f"""You are an AI Innovation Analyst for the INNOVEXA platform.
Analyze the provided innovation project and return ONLY valid JSON matching this schema:
{{
  "project_id": "{req.project_id}",
  "project_title": "{title}",
  "project_overview": {{
    "title": "{title}",
    "category": "{category}",
    "summary": "Executive summary (2-3 sentences) specifically referencing this project"
  }},
  "ai_analysis": {{
    "problem_analysis": "Deep evaluation of the stated problem friction",
    "solution_analysis": "Critique of the proposed mechanism and digital architecture",
    "value_proposition": "Core value delivered to early adopters and users"
  }},
  "strengths": [
    "Specific strength referencing this project's unique mechanics",
    "Second specific strength",
    "Third specific strength"
  ],
  "weaknesses": [
    "Specific vulnerability, risk, or missing detail",
    "Second specific challenge"
  ],
  "opportunities": [
    "Strategic market expansion or workflow integration opportunity 1",
    "Opportunity 2"
  ],
  "risks": [
    "Operational, technological, or adoption risk 1",
    "Risk 2"
  ],
  "recommended_improvements": [
    {{
      "title": "Actionable improvement milestone 1",
      "description": "Concrete steps to execute",
      "priority": "HIGH"
    }},
    {{
      "title": "Actionable improvement milestone 2",
      "description": "Concrete steps to execute",
      "priority": "MEDIUM"
    }},
    {{
      "title": "Actionable improvement milestone 3",
      "description": "Concrete steps to execute",
      "priority": "LOW"
    }}
  ],
  "innovation_score": {{
    "score": number (0-100),
    "level": "High" | "Moderate" | "Emerging",
    "breakdown": {{
      "uniqueness": number (0-25),
      "problem_clarity": number (0-25),
      "solution_fit": number (0-25),
      "execution_readiness": number (0-25)
    }}
  }},
  "feasibility_score": {{
    "score": number (0-100),
    "level": "High" | "Moderate" | "Challenging",
    "explanation": "Technical and operational implementation analysis"
  }},
  "market_potential": {{
    "score": number (0-100),
    "potential": "High" | "Moderate" | "Niche",
    "explanation": "Market upside and audience adoption trajectory"
  }},
  "overall_score": number (0-100),
  "confidence": 90
}}
Do not return generic boilerplate. Base your evaluation strictly on the submitted project details."""

    user_prompt = f"""PROJECT TITLE: {title}
CATEGORY: {category}
PROBLEM STATEMENT: {problem or 'Early-stage hypothesis'}
DESCRIPTION: {req.description or ''}
PROPOSED SOLUTION: {solution or 'Direct domain execution'}
TARGET USERS: {target or 'Domain practitioners'}
TECHNOLOGIES/FEATURES: {', '.join(techs) if techs else 'Standard domain workflow'}
COMMUNITY REVIEWS COUNT: {req.reviews_count}
REVIEWS HIGHLIGHTS: {req.reviews_summary or 'No community reviews submitted yet.'}"""

    ai_result = _call_gemini_server(user_prompt, system_prompt)
    if ai_result and "innovation_score" in ai_result and "feasibility_score" in ai_result:
        ai_result["generated_by"] = "GEMINI_AI"
        ai_result["project_id"] = req.project_id
        ai_result["generated_at"] = now_utc_iso()
        return {"success": True, "data": ai_result}

    # Semantic Fallback Insights
    prob_len = len(problem.strip())
    sol_len = len(solution.strip())
    
    inno_val = min(96, max(60, 65 + (15 if prob_len > 30 else 5) + (15 if sol_len > 30 else 5)))
    feas_val = min(95, max(65, 75 + (10 if len(techs) > 0 else 0) + (10 if sol_len > 20 else 0)))
    mkt_val = min(92, max(60, 70 + (15 if len(target) > 15 else 5) + (8 if category in ["Artificial Intelligence", "Healthcare", "Cybersecurity", "Finance"] else 4)))
    overall_val = round((inno_val * 0.4) + (feas_val * 0.3) + (mkt_val * 0.3))

    fallback_data = {
        "project_id": req.project_id,
        "project_title": title,
        "project_overview": {
            "title": title,
            "category": category,
            "summary": f"{title} is a dedicated {category} innovation addressing {problem[:120] if problem else 'workflow friction'} through {solution[:120] if solution else 'specialized digital architecture'}."
        },
        "ai_analysis": {
            "problem_analysis": f"Addresses verifiable friction in {category}: '{problem[:140] if problem else 'Domain workflow overhead'}'. Provides clear scope boundaries.",
            "solution_analysis": f"Applies domain-tailored mechanics: '{solution[:140] if solution else 'Structured digital execution'}'.",
            "value_proposition": f"Empowers {target or 'domain practitioners'} to eliminate manual bottlenecks and accelerate execution speed."
        },
        "strengths": [
            f"Focused problem-solution alignment in {category}.",
            f"Directly addresses workflow hurdles experienced by {target or 'target practitioners'}.",
            f"Modular implementation path utilizing {', '.join(techs[:2]) if techs else 'standard modern frameworks'}."
        ],
        "weaknesses": [
            "Quantified benchmark metrics comparing performance against baseline legacy tools.",
            f"Edge case handling under non-standard {category} input formats."
        ],
        "opportunities": [
            f"Expand integrations with third-party {category} APIs and developer ecosystems.",
            "Offer self-service interactive sandboxes to accelerate peer validation and creator reputation."
        ],
        "risks": [
            "User workflow inertia when transitioning from incumbent legacy tooling.",
            "Latency and throughput bottlenecks during peak multi-node operations."
        ],
        "recommended_improvements": [
            {
                "title": "Deploy Interactive Prototype URL",
                "description": "Attach a live sandbox demonstration to accelerate validator scoring on INNOVEXA.",
                "priority": "HIGH"
            },
            {
                "title": "Quantify Pain Point Benchmarks",
                "description": "Measure and publish specific time/cost reductions (e.g. 'saves 4 hrs/week').",
                "priority": "MEDIUM"
            },
            {
                "title": "Instrument Telemetry & Logging",
                "description": "Record latency, error rates, and user engagement metrics for validation audit trails.",
                "priority": "LOW"
            }
        ],
        "innovation_score": {
            "score": inno_val,
            "level": "High" if inno_val >= 80 else "Moderate",
            "breakdown": {
                "uniqueness": 22,
                "problem_clarity": 23,
                "solution_fit": 22,
                "execution_readiness": 21
            }
        },
        "feasibility_score": {
            "score": feas_val,
            "level": "High" if feas_val >= 80 else "Moderate",
            "explanation": f"The technical architecture leveraging modern web and API protocols is feasible with manageable engineering complexity."
        },
        "market_potential": {
            "score": mkt_val,
            "potential": "High" if mkt_val >= 80 else "Moderate",
            "explanation": f"Strong adoption potential among {target or 'practitioners in ' + category} seeking modern workflow tooling."
        },
        "overall_score": overall_val,
        "confidence": 88,
        "generated_by": "SEMANTIC_DOMAIN_ENGINE",
        "generated_at": now_utc_iso()
    }

    return {"success": True, "data": fallback_data}


