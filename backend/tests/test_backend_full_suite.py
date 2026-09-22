"""
Comprehensive End-to-End Test Suite for INNOVEXA Backend API
Validates all routes across Auth, Projects, Reviews, Community, Discovery, and AI Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_01_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "INNOVEXA" in data["service"]

def test_02_auth_workflow(client):
    # 1. Signup
    signup_payload = {
        "name": "E2E Test Innovator",
        "email": "e2e.test@innovexa.io",
        "password": "SecurePassword123!",
        "role": "I CREATE IDEAS"
    }
    res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert res.status_code in [200, 201]
    user = res.json().get("data")
    assert user["email"] == "e2e.test@innovexa.io"

    # 2. Login
    login_payload = {
        "email": "e2e.test@innovexa.io",
        "password": "SecurePassword123!"
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    assert res_login.json()["success"] is True
    token = res_login.json()["data"]["token"]
    assert token is not None

def test_03_project_lifecycle(client):
    headers = {"Authorization": "Bearer usr_karthick_founder"}

    # 1. Create Project
    create_payload = {
        "title": "Autonomous Quantum Sensor Mesh",
        "short_description": "Distributed quantum gravimeter telemetry node network for subterranean mapping.",
        "problem_statement": "Subterranean infrastructure mapping requires heavy seismic machinery with high environmental impact.",
        "proposed_solution": "Quantum cold-atom gravimeter sensor arrays communicating over encrypted mesh protocols.",
        "target_users": "Geologists, Civil Engineers, Infrastructure Architects",
        "category_id": "cat_tech",
        "category_name": "Web Technology",
        "creation_type": "PRODUCT",
        "project_stage": "prototype",
        "features": ["Quantum gravimetry sensing", "Sub-meter subterranean mesh", "Zero environmental footprint"],
        "tags": ["Quantum", "Sensors", "Geology", "Mesh"],
        "is_draft": False
    }
    res = client.post("/api/v1/projects", json=create_payload, headers=headers)
    assert res.status_code in [200, 201]
    project = res.json()["data"]
    project_id = project["id"]
    assert project["title"] == "Autonomous Quantum Sensor Mesh"

    # 2. Get Project Details
    res_get = client.get(f"/api/v1/projects/{project_id}")
    assert res_get.status_code == 200
    assert res_get.json()["data"]["id"] == project_id

    # 3. Update Project
    update_payload = {"short_description": "Updated high-precision distributed quantum gravimeter telemetry node network."}
    res_up = client.put(f"/api/v1/projects/{project_id}", json=update_payload, headers=headers)
    assert res_up.status_code == 200
    assert "high-precision" in res_up.json()["data"]["short_description"]

    # 4. Upvote Project
    res_vote = client.post(f"/api/v1/projects/{project_id}/upvote", headers={"Authorization": "Bearer usr_sarah_reviewer"})
    assert res_vote.status_code == 200
    assert res_vote.json()["success"] is True

def test_04_review_and_insights_lifecycle(client):
    headers_creator = {"Authorization": "Bearer usr_karthick_founder"}
    headers_reviewer = {"Authorization": "Bearer usr_alex_validator"}

    # 1. Create a fresh project to review
    proj_res = client.post("/api/v1/projects", json={
        "title": "Bio-Telemetry Optical Ring",
        "short_description": "Continuous PPG and SpO2 monitoring with edge neural anomaly detection.",
        "problem_statement": "Wearables suffer from high motion artifact distortions during exercise.",
        "proposed_solution": "Multi-wavelength adaptive filtering with local quantization neural network.",
        "target_users": "Athletes, Cardiac Patients",
        "category_id": "cat_health",
        "category_name": "Healthcare",
        "is_draft": False
    }, headers=headers_creator)
    assert proj_res.status_code in [200, 201]
    project_id = proj_res.json()["data"]["id"]

    # 2. Submit Peer Review
    review_payload = {
        "problem_relevance": "YES",
        "would_use": "YES",
        "rating": 5,
        "overall_feedback": "Outstanding clinical architecture and real-time edge processing.",
        "suggestion": "Expand benchmark telemetry across transport monitors."
    }
    res_rev = client.post(f"/api/v1/projects/{project_id}/reviews", json=review_payload, headers=headers_reviewer)
    assert res_rev.status_code in [200, 201]
    assert res_rev.json()["success"] is True

    # 3. Get Project Reviews
    res_get_rev = client.get(f"/api/v1/projects/{project_id}/reviews")
    assert res_get_rev.status_code == 200
    assert len(res_get_rev.json()["data"]) >= 1

    # 4. Get Project Authoritative Insights
    res_ins = client.get(f"/api/v1/projects/{project_id}/insights")
    assert res_ins.status_code == 200
    assert res_ins.json()["data"]["sentiment"] in ["Positive", "Mixed", "Constructive"]

def test_05_community_hub(client):
    headers = {"Authorization": "Bearer usr_karthick_founder"}

    # 1. Create Community Post
    post_payload = {
        "title": "Best approaches for zero-knowledge biometric authentication?",
        "content": "Exploring Circom and SnarkJS for client-side cryptographic proof generation in mobile apps.",
        "post_type": "DISCUSSION",
        "category_id": "cat_ai",
        "category_name": "Artificial Intelligence",
        "tags": ["ZK", "Cryptography", "Security"]
    }
    res_post = client.post("/api/v1/community/posts", json=post_payload, headers=headers)
    assert res_post.status_code == 201
    post_id = res_post.json()["data"]["id"]

    # 2. Comment on Community Post
    comm_payload = {
        "content": "Check out Plonky2 for sub-100ms client proof generation on WebAssembly runtimes."
    }
    res_comm = client.post(f"/api/v1/community/posts/{post_id}/comments", json=comm_payload, headers={"Authorization": "Bearer usr_sarah_reviewer"})
    assert res_comm.status_code == 201
    assert res_comm.json()["data"]["post_id"] == post_id

    # 3. Share Resource
    res_payload = {
        "title": "WebGPU Zero-Knowledge Accelerators",
        "description": "Open source benchmarks for running lattice cryptography inside the browser.",
        "resource_url": "https://github.com/innovexa/zk-webgpu",
        "resource_type": "TOOL",
        "category_id": "cat_tech",
        "category_name": "Web Technology"
    }
    res_share = client.post("/api/v1/community/resources", json=res_payload, headers=headers)
    assert res_share.status_code == 201

def test_06_discovery_and_sources(client):
    # 1. Get External Innovations Feed
    res_disc = client.get("/api/v1/external-innovations")
    assert res_disc.status_code == 200
    data = res_disc.json()
    assert data["total"] >= 1
    sample_id = data["data"][0]["id"]

    # 2. Like Discovery Item
    res_like = client.post(f"/api/v1/external-innovations/{sample_id}/like")
    assert res_like.status_code == 200
    assert res_like.json()["likes_count"] >= 1

    # 3. Sources Telemetry
    res_src = client.get("/api/v1/external-innovations/sources")
    assert res_src.status_code == 200
    assert len(res_src.json()["data"]) >= 5

def test_07_ai_phase6_suite(client):
    req_body = {
        "title": "Autonomous Clinical Neural Sentry",
        "category_name": "Healthcare",
        "problem_statement": "Delayed detection of acute cardiac deterioration in rural clinics.",
        "proposed_solution": "Edge AI telemetry module monitoring continuous multi-lead ECGs and vitals.",
        "target_users": "Rural clinical care teams, paramedics",
        "features": ["15ms arrhythmia inference", "Offline battery mode", "HL7 FHIR sync"]
    }

    # 1. AI Analysis
    r1 = client.post("/api/v1/ai/analyze-project", json=req_body)
    assert r1.status_code == 200
    assert "problem_quality" in r1.json()["data"]
    assert "solution_quality" in r1.json()["data"]

    # 2. AI Improvement
    r2 = client.post("/api/v1/ai/improve-project", json=req_body)
    assert r2.status_code == 200
    assert "actionable_summary" in r2.json()["data"]

    # 3. AI Summary
    r3 = client.post("/api/v1/ai/summarize-project", json=req_body)
    assert r3.status_code == 200
    assert "short_summary" in r3.json()["data"]
    assert "problem_summary" in r3.json()["data"]

    # 4. AI Idea Validation
    r4 = client.post("/api/v1/ai/validate-idea", json=req_body)
    assert r4.status_code == 200
    assert "validation_verdict" in r4.json()["data"]

    # 5. AI Comprehensive Insights
    r5 = client.post("/api/v1/ai/insights", json=req_body)
    assert r5.status_code == 200
    assert "innovation_score" in r5.json()["data"]
    assert "feasibility_score" in r5.json()["data"]
