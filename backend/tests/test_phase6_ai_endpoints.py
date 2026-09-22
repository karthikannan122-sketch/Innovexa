import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app, seed_backend_data

seed_backend_data()
client = TestClient(app)

def test_ai_project_analysis():
    print("\n--- 1. Testing AI Project Analysis ---")
    payload = {
        "project_id": "inno_pulsemind_ai",
        "title": "PulseMind Clinical Telemetry",
        "category_name": "Healthcare",
        "problem_statement": "Acute cardiology diagnosis faces dangerous triage latency in emergency rooms.",
        "proposed_solution": "Real-time edge ECG wave classification using multi-lead micro-models.",
        "target_users": "ER Cardiologists, Emergency Medical Technicians",
        "features": ["15ms inference", "HL7 FHIR export", "Offline edge capability"]
    }
    res = client.post("/api/v1/ai/analyze-project", json=payload)
    assert res.status_code == 200, f"Status: {res.status_code}, {res.text}"
    data = res.json()["data"]
    assert "problem_quality" in data
    assert "solution_quality" in data
    assert "innovation_level" in data
    assert "market_potential" in data
    assert "technical_feasibility" in data
    assert "scalability" in data
    assert "target_user_clarity" in data
    assert "competitive_differentiation" in data
    assert "structured_score" in data
    assert "overall_score" in data["structured_score"]
    print(f"[PASS] AI Project Analysis passed. Overall Score: {data['structured_score']['overall_score']}/100, Grade: {data['structured_score']['grade']}")

def test_ai_project_improvement():
    print("\n--- 2. Testing AI Project Improvement ---")
    payload = {
        "project_id": "inno_neuromesh",
        "title": "NeuroMesh Distributed Layer",
        "category_name": "Artificial Intelligence",
        "problem_statement": "Centralized neural inference creates bandwidth bottlenecks and privacy risks.",
        "proposed_solution": "P2P WebGPU neural routing matrix on edge browser nodes.",
        "features": ["Zero-install WebGPU", "Encrypted gradient aggregation"],
        "target_users": "Edge AI Engineers, IoT Architects"
    }
    res = client.post("/api/v1/ai/improve-project", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "problem_refinement" in data and len(data["problem_refinement"]) > 0
    assert "solution_improvement" in data and len(data["solution_improvement"]) > 0
    assert "missing_features" in data and len(data["missing_features"]) > 0
    assert "technical_improvements" in data and len(data["technical_improvements"]) > 0
    assert "business_improvements" in data and len(data["business_improvements"]) > 0
    print(f"[PASS] AI Project Improvement passed. Missing features suggested: {len(data['missing_features'])}")

def test_ai_project_summary():
    print("\n--- 3. Testing AI Project Summary ---")
    payload = {
        "project_id": "inno_pulsemind_ai",
        "title": "PulseMind Clinical Telemetry",
        "category_name": "Healthcare",
        "problem_statement": "Emergency room ECG delays cost lives.",
        "proposed_solution": "Instant on-device rhythm triage.",
        "target_users": "Clinical emergency teams",
        "features": ["Sub-15ms inference", "DICOM export"]
    }
    res = client.post("/api/v1/ai/summarize-project", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "short_summary" in data and len(data["short_summary"]) > 10
    assert "problem_summary" in data
    assert "solution_summary" in data
    assert "target_users" in data
    assert "key_features" in data and len(data["key_features"]) > 0
    print(f"[PASS] AI Project Summary passed. Short summary: {data['short_summary'][:60]}...")

def test_ai_idea_validation():
    print("\n--- 4. Testing AI Idea Validation ---")
    payload = {
        "title": "SolarGrid Zero-Loss Decentralized Battery Mesh",
        "category_name": "Environment",
        "problem": "Residential solar installations waste up to 40% surplus power during midday peak generation.",
        "solution": "Dynamic neighborhood micro-inverter grid sharing stored battery capacity peer-to-peer.",
        "target_market": "Suburban homeowners, renewable energy co-ops"
    }
    res = client.post("/api/v1/ai/validate-idea", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "problem" in data
    assert "solution" in data
    assert "uniqueness" in data
    assert "feasibility" in data
    assert "market_need" in data
    assert "possible_competitors" in data and len(data["possible_competitors"]) > 0
    assert "risks" in data and len(data["risks"]) > 0
    assert "validation_verdict" in data
    assert "overall_score" in data["validation_verdict"]
    print(f"[PASS] AI Idea Validation passed. Verdict: {data['validation_verdict']['status']} ({data['validation_verdict']['overall_score']}/100)")

def test_ai_category_recommendation():
    print("\n--- 5. Testing AI Category Recommendation ---")
    # Project 1: Healthcare
    res1 = client.post("/api/v1/ai/recommend-category", json={
        "title": "CardioWave Biosensor",
        "problem_statement": "Arrhythmia detection is missed outside hospital wards.",
        "proposed_solution": "Continuous wearable cardiac ECG patch with clinical alerts."
    })
    assert res1.status_code == 200
    cat1 = res1.json()["data"]["recommended_category"]
    assert cat1["name"] == "Healthcare", f"Expected Healthcare, got {cat1['name']}"
    
    # Project 2: Cybersecurity
    res2 = client.post("/api/v1/ai/recommend-category", json={
        "title": "ZeroVault Key Protection",
        "problem_statement": "Private cryptographic keys leaked via browser storage.",
        "proposed_solution": "Hardware enclave-backed biometric key insulation."
    })
    assert res2.status_code == 200
    cat2 = res2.json()["data"]["recommended_category"]
    assert cat2["name"] == "Cybersecurity", f"Expected Cybersecurity, got {cat2['name']}"

    # Project 3: AI
    res3 = client.post("/api/v1/ai/recommend-category", json={
        "title": "Autonomous Agent Swarm",
        "problem_statement": "Single LLM agents get stuck on complex coding pipelines.",
        "proposed_solution": "Multi-agent reinforcement learning orchestration with reflection."
    })
    assert res3.status_code == 200
    cat3 = res3.json()["data"]["recommended_category"]
    assert cat3["name"] == "Artificial Intelligence", f"Expected Artificial Intelligence, got {cat3['name']}"

    print(f"[PASS] AI Category Recommendation passed. Strictly matched official public.categories: {cat1['name']}, {cat2['name']}, {cat3['name']}.")

def test_ai_insights_endpoint():
    print("\n--- 6. Testing AI Insights Endpoint ---")
    payload = {
        "project_id": "inno_pulsemind_ai",
        "project_title": "PulseMind Clinical Telemetry",
        "category_name": "Healthcare",
        "problem_statement": "Acute cardiology diagnosis triage latency.",
        "proposed_solution": "Real-time edge ECG wave classification.",
        "target_users": "Emergency Room Physicians",
        "technologies": ["WebGPU", "HL7 FHIR", "Edge ML"],
        "reviews_count": 2,
        "reviews_summary": "Rating: 5/5 | Exceptional clinical thesis. Rating: 4/5 | Impressive edge telemetry."
    }
    res = client.post("/api/v1/ai/generate-insights", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "project_overview" in data
    assert "ai_analysis" in data
    assert "strengths" in data and len(data["strengths"]) > 0
    assert "weaknesses" in data and len(data["weaknesses"]) > 0
    assert "opportunities" in data and len(data["opportunities"]) > 0
    assert "risks" in data and len(data["risks"]) > 0
    assert "recommended_improvements" in data and len(data["recommended_improvements"]) > 0
    assert "innovation_score" in data and "score" in data["innovation_score"]
    assert "feasibility_score" in data and "score" in data["feasibility_score"]
    assert "market_potential" in data and "score" in data["market_potential"]
    print(f"[PASS] AI Insights endpoint passed. Innovation Score: {data['innovation_score']['score']}/100, Feasibility: {data['feasibility_score']['score']}/100, Market: {data['market_potential']['score']}/100")

def test_empty_and_invalid_inputs():
    print("\n--- 7. Testing Empty and Invalid Input Handlers ---")
    # Empty idea validation -> 400
    res_empty = client.post("/api/v1/ai/validate-idea", json={"title": "Empty Idea", "problem": "", "solution": ""})
    assert res_empty.status_code == 400
    print("[PASS] Empty Idea input rejected with 400 Bad Request.")

    # Empty category recommendation -> 400
    res_cat_empty = client.post("/api/v1/ai/recommend-category", json={"title": "", "problem_statement": ""})
    assert res_cat_empty.status_code == 400
    print("[PASS] Empty Category input rejected with 400 Bad Request.")

if __name__ == "__main__":
    test_ai_project_analysis()
    test_ai_project_improvement()
    test_ai_project_summary()
    test_ai_idea_validation()
    test_ai_category_recommendation()
    test_ai_insights_endpoint()
    test_empty_and_invalid_inputs()
    print("\n=======================================================")
    print("ALL PHASE 6 BACKEND AI ENDPOINT TESTS PASSED (100% OK)")
    print("=======================================================\n")
