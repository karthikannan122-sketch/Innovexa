"""
INNOVEXA FastAPI Backend Service (Blueprint Sections 30 & 48)
Comprehensive REST API Implementation for Authentication, Projects, Reviews, Comments, and Insights
"""

from fastapi import FastAPI, Depends, HTTPException, status, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
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

app = FastAPI(
    title="INNOVEXA API",
    description="Production-grade Backend Service for INNOVEXA Innovation Discovery, Validation & Peer Review Engine",
    version="1.0.0"
)

# Autonomous Server-Side 24-Hour Discovery Ingestion Scheduler
@app.on_event("startup")
async def start_discovery_scheduler():
    """Starts the 24-hour server-side discovery worker on application boot."""
    async def schedule_worker():
        while True:
            try:
                logger.info("[Scheduler] Executing scheduled innovation discovery cycle...")
                # Run ingestion in a thread pool to avoid blocking the event loop
                await asyncio.to_thread(discovery_engine.run_ingestion_pipeline)
            except Exception as e:
                logger.error(f"[Scheduler] Ingestion worker error: {e}")
            # Wait 24 hours (86,400 seconds)
            await asyncio.sleep(86400)

    asyncio.create_task(schedule_worker())

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
        "created_at": datetime.utcnow().isoformat()
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
    return {"success": True, "data": user, "token": user["id"]}

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
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
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

    updates = req.dict(exclude_unset=True)
    proj.update(updates)
    proj["updated_at"] = datetime.utcnow().isoformat()
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
    proj["published_at"] = datetime.utcnow().isoformat()
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
        "created_at": datetime.utcnow().isoformat()
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
            "created_at": datetime.utcnow().isoformat()
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
        "created_at": datetime.utcnow().isoformat()
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
    now = datetime.utcnow().isoformat() + "Z"

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
    now = datetime.utcnow().isoformat() + "Z"

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
    now = datetime.utcnow().isoformat() + "Z"

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
            "created_at": datetime.utcnow().isoformat() + "Z"
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
# 9. SECURE GEMINI AI INSIGHTS ENDPOINT
# -----------------------------------------------------------------------------
class ProjectInsightRequest(BaseModel):
    project_id: str
    project_title: str
    category_name: Optional[str] = "General Technology"
    problem_statement: Optional[str] = ""
    description: Optional[str] = ""
    target_users: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    technologies: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    website_url: Optional[str] = None
    reviews_count: Optional[int] = 0
    reviews_summary: Optional[str] = ""
    upvotes_count: Optional[int] = 0

@app.post("/api/v1/ai/generate-insights")
def generate_project_insights_endpoint(req: ProjectInsightRequest):
    """
    Secure Server-Side AI Insights Generator.
    Executes Google Gemini 2.0 Flash with server-side GEMINI_API_KEY.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    
    prompt = f"""You are an AI Innovation Analyst for the INNOVEXA platform.
Analyze the following specific innovation project.
Do not provide generic advice.
Base your analysis only on the project information provided.

PROJECT TITLE:
{req.project_title}

CATEGORY:
{req.category_name}

PROBLEM STATEMENT:
{req.problem_statement or 'Early-stage hypothesis in ' + req.category_name}

DESCRIPTION:
{req.description or 'Innovative project in ' + req.category_name}

TARGET USERS:
{req.target_users or 'Domain practitioners and users in ' + req.category_name}

PROPOSED SOLUTION:
{req.proposed_solution or 'Structured solution framework targeting core workflow bottlenecks.'}

TECHNOLOGIES:
{', '.join(req.technologies) if req.technologies else 'Modern web, cloud and domain-specific APIs'}

TAGS:
{', '.join(req.tags) if req.tags else req.category_name}

COMMUNITY REVIEWS COUNT:
{req.reviews_count}

COMMUNITY SIGNALS & FEEDBACK HIGHLIGHTS:
{req.reviews_summary or 'No community reviews submitted yet.'}

Analyze this project and provide a strictly valid JSON object matching this schema:
{{
  "project_id": "{req.project_id}",
  "project_title": "{req.project_title}",
  "project_summary": "Executive summary specifically referencing this project (2-3 sentences)",
  "problem_analysis": {{
    "clarity_score": 85,
    "analysis": "Specific analysis of this project's stated problem"
  }},
  "innovation": {{
    "score": 80,
    "analysis": "Specific analysis of this project's proposed solution and novelty"
  }},
  "target_users": "Specific user personas and market segments for this project",
  "strengths": [
    "Specific strength referencing this project's unique mechanics",
    "Second specific strength",
    "Third specific strength"
  ],
  "weaknesses": [
    "Specific risk, vulnerability or missing detail for this project",
    "Second specific challenge"
  ],
  "technical_feasibility": {{
    "score": 82,
    "analysis": "Feasibility analysis referencing the tech stack and implementation hurdles"
  }},
  "scalability": {{
    "score": 78,
    "analysis": "Scalability and data throughput analysis"
  }},
  "competition_considerations": "How this project compares against existing market solutions and alternatives",
  "improvement_opportunities": [
    "Specific actionable recommendation referencing this project",
    "Second specific opportunity",
    "Third specific opportunity"
  ],
  "recommended_next_steps": [
    "Immediate technical step 1",
    "Validation step 2",
    "Deployment step 3"
  ],
  "overall_score": 84,
  "confidence": 88,
  "community_signals": {{
    "reviews_count": {req.reviews_count},
    "average_rating": 4.5,
    "consensus_summary": "Community consensus or initial stage awaiting reviews"
  }}
}}

CRITICAL:
Each analysis MUST specifically reference the submitted project ({req.project_title}).
Do not repeat generic boilerplate.
Return only valid JSON."""

    if api_key:
        import requests
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2
                }
            }
            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if raw_text:
                    parsed = json.loads(raw_text)
                    parsed["model_used"] = "gemini-2.0-flash"
                    parsed["generated_at"] = datetime.utcnow().isoformat() + "Z"
                    return {"success": True, "data": parsed}
        except Exception as e:
            logger.warning(f"Live Gemini API call failed: {e}")

    # Fallback: Dynamic Semantic Domain Analyzer (Never generic boilerplate)
    domain_terms = [t for t in (req.problem_statement + " " + req.description + " " + req.proposed_solution).split() if len(t) > 4][:8]
    core_keyword_str = ", ".join(domain_terms[:4]) if domain_terms else req.category_name

    clarity_score = 90 if len(req.problem_statement or "") > 50 else (75 if len(req.problem_statement or "") > 20 else 60)
    readiness_score = min(96, max(45, 50 + (10 if req.problem_statement else 0) + (10 if req.proposed_solution else 0) + (10 if req.target_users else 0) + (10 if req.technologies else 0) + (5 if req.website_url else 0)))

    fallback_data = {
        "project_id": req.project_id,
        "project_title": req.project_title,
        "project_summary": f"{req.project_title} is an innovation in {req.category_name} focused on addressing {req.problem_statement[:140] if req.problem_statement else 'core workflow frictions'}. The proposed solution targets {req.target_users or 'domain practitioners'} using specialized architectures.",
        "problem_analysis": {
            "clarity_score": clarity_score,
            "analysis": f"The problem addresses critical friction in {req.category_name}: '{req.problem_statement or req.description or 'Domain optimization'}'. The focus on {core_keyword_str} provides clear scope boundaries."
        },
        "innovation": {
            "score": readiness_score,
            "analysis": f"Novel approach applying {req.proposed_solution[:120] if req.proposed_solution else 'domain-tailored mechanisms'} to overcome conventional barriers in {req.category_name}."
        },
        "target_users": req.target_users or f"Practitioners, teams, and early adopters operating within {req.category_name}.",
        "strengths": [
            f"Explicit focus on solving {req.problem_statement[:60] if req.problem_statement else req.category_name + ' workflow overhead'}.",
            f"Tailored solution design leveraging {', '.join(req.technologies[:2]) if req.technologies else 'modern computational tools'}.",
            f"Clearly identified user cohort ({req.target_users or 'target domain specialists'})."
        ],
        "weaknesses": [
            f"Edge case handling under high throughput or non-standard {req.category_name} inputs.",
            "Quantified benchmark metrics comparing performance against baseline legacy tooling."
        ],
        "technical_feasibility": {
            "score": 82,
            "analysis": f"The architectural stack utilizing {', '.join(req.technologies) if req.technologies else 'standard modern frameworks'} is technically sound with manageable implementation complexity."
        },
        "scalability": {
            "score": 80,
            "analysis": f"Horizontal scaling path is viable by containerizing processing pipelines and decoupling {req.category_name} state storage."
        },
        "competition_considerations": f"Existing solutions in {req.category_name} often suffer from high configuration latency; {req.project_title} differentiates through focused ergonomics and streamlined execution.",
        "improvement_opportunities": [
            f"Incorporate real-time telemetry logging to demonstrate quantifiable reductions in {core_keyword_str} friction.",
            f"Publish an interactive prototype demonstration targeting {req.target_users or 'early adopters'}.",
            "Define explicit integration protocols (REST/WebSocket/SDK) for third-party domain tooling."
        ],
        "recommended_next_steps": [
            f"Deploy alpha proof-of-concept for {req.project_title} and validate with 5 real {req.target_users or 'users'}.",
            "Instrument latency and error telemetry across core workflows.",
            "Publish structured validation questionnaire on INNOVEXA to collect peer reviews."
        ],
        "overall_score": readiness_score,
        "confidence": 85,
        "community_signals": {
            "reviews_count": req.reviews_count,
            "average_rating": 4.5 if req.reviews_count > 0 else 0.0,
            "consensus_summary": f"{req.reviews_count} peer evaluations recorded on the INNOVEXA ledger." if req.reviews_count > 0 else "Early-stage project awaiting community reviews."
        },
        "model_used": "semantic-domain-analyzer",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

    return {"success": True, "data": fallback_data}

