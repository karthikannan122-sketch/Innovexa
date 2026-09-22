import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app, seed_backend_data

seed_backend_data()
client = TestClient(app)

PROJECT_SPECIMENS = [
    {
        "id": "inno_cardiopulse",
        "title": "CardioPulse Clinical Telemetry",
        "category": "Healthcare",
        "problem": "Acute myocardial infarction triage suffers deadly 45-minute telemetry delays in standard emergency rooms.",
        "solution": "Sub-15ms edge ECG arrhythmia classification using lightweight quantized neural wavelets with HL7 FHIR sync.",
        "target": "Emergency Cardiologists, EMT Field First Responders",
        "features": ["12-lead wave analysis", "Sub-15ms edge inference", "Offline FHIR buffer", "Hospital EHR bridge"]
    },
    {
        "id": "inno_zerovault",
        "title": "ZeroVault Biometric Enclave",
        "category": "Cybersecurity",
        "problem": "Browser-stored cryptographic private keys are vulnerable to session hijacking and memory extraction attacks.",
        "solution": "Hardware-backed biometric enclave insulation preventing raw key exposure to userland browser scripts.",
        "target": "Web3 Developers, Security Engineers, Crypto Custodians",
        "features": ["Secure enclave attestation", "WebAuthn integration", "Zero raw key memory residency"]
    },
    {
        "id": "inno_ecogrid",
        "title": "EcoGrid Renewable Micro-Mesh",
        "category": "Environment",
        "problem": "Suburban solar installations dump 40% surplus midday solar generation due to lack of local peer storage trading.",
        "solution": "Decentralized automated micro-inverter mesh dynamically routing surplus residential power to neighborhood batteries.",
        "target": "Suburban homeowners, renewable energy co-operatives, municipal utility boards",
        "features": ["Smart inverter mesh", "Dynamic P2P power ledger", "Battery degradation optimizer"]
    },
    {
        "id": "inno_smarttutor",
        "title": "SmartTutor Adaptive Socratic Engine",
        "category": "Education",
        "problem": "Static online courses suffer 85% drop-off rates because they lack personalized real-time Socratic feedback.",
        "solution": "Interactive conversational Socratic tutor guiding students through active self-discovery and targeted problem solving.",
        "target": "K-12 Students, Self-directed learners, STEM Educators",
        "features": ["Socratic dialogue engine", "Real-time concept graph", "Adaptive difficulty scaling"]
    }
]

def test_full_phase6_multi_project_suite():
    print("\n=======================================================")
    print("RUNNING INNOVEXA PHASE 6 MULTI-PROJECT AI TEST SUITE")
    print("=======================================================\n")

    for p in PROJECT_SPECIMENS:
        print(f"\n>> Testing Project Specimen: {p['title']} ({p['category']})")

        # 1. Project Analysis
        analysis_res = client.post("/api/v1/ai/analyze-project", json={
            "project_id": p["id"],
            "title": p["title"],
            "category_name": p["category"],
            "problem_statement": p["problem"],
            "proposed_solution": p["solution"],
            "target_users": p["target"],
            "features": p["features"]
        })
        assert analysis_res.status_code == 200, f"Analysis failed for {p['title']}"
        analysis_data = analysis_res.json()["data"]
        assert analysis_data["structured_score"]["overall_score"] >= 60
        print(f"  [PASS] 1. AI Analysis: Score = {analysis_data['structured_score']['overall_score']}/100, Grade = {analysis_data['structured_score']['grade']}")

        # 2. Project Improvement
        improve_res = client.post("/api/v1/ai/improve-project", json={
            "project_id": p["id"],
            "title": p["title"],
            "category_name": p["category"],
            "problem_statement": p["problem"],
            "proposed_solution": p["solution"],
            "features": p["features"],
            "target_users": p["target"]
        })
        assert improve_res.status_code == 200
        improve_data = improve_res.json()["data"]
        assert len(improve_data["missing_features"]) >= 2
        print(f"  [PASS] 2. AI Improvement: {len(improve_data['missing_features'])} missing features suggested")

        # 3. Project Summary
        summary_res = client.post("/api/v1/ai/summarize-project", json={
            "project_id": p["id"],
            "title": p["title"],
            "category_name": p["category"],
            "problem_statement": p["problem"],
            "proposed_solution": p["solution"],
            "target_users": p["target"],
            "features": p["features"]
        })
        assert summary_res.status_code == 200
        summary_data = summary_res.json()["data"]
        assert len(summary_data["short_summary"]) > 20
        print(f"  [PASS] 3. AI Summary: '{summary_data['short_summary'][:50]}...'")

        # 4. Idea Validation
        validation_res = client.post("/api/v1/ai/validate-idea", json={
            "title": p["title"],
            "problem": p["problem"],
            "solution": p["solution"],
            "target_market": p["target"],
            "category_name": p["category"]
        })
        assert validation_res.status_code == 200
        validation_data = validation_res.json()["data"]
        assert validation_data["validation_verdict"]["overall_score"] >= 60
        assert len(validation_data["possible_competitors"]) > 0
        assert len(validation_data["risks"]) > 0
        print(f"  [PASS] 4. AI Idea Validation: Verdict = {validation_data['validation_verdict']['status']} ({validation_data['validation_verdict']['overall_score']}/100)")

        # 5. Category Recommendation
        cat_res = client.post("/api/v1/ai/recommend-category", json={
            "title": p["title"],
            "problem_statement": p["problem"],
            "proposed_solution": p["solution"]
        })
        assert cat_res.status_code == 200
        cat_data = cat_res.json()["data"]["recommended_category"]
        assert cat_data["name"] == p["category"], f"Expected {p['category']}, got {cat_data['name']}"
        print(f"  [PASS] 5. AI Category Recommendation: Matched '{cat_data['name']}' from public.categories")

        # 6. AI Insights Telemetry
        insights_res = client.post("/api/v1/ai/generate-insights", json={
            "project_id": p["id"],
            "project_title": p["title"],
            "category_name": p["category"],
            "problem_statement": p["problem"],
            "proposed_solution": p["solution"],
            "target_users": p["target"],
            "technologies": p["features"]
        })
        assert insights_res.status_code == 200
        insights_data = insights_res.json()["data"]
        assert "strengths" in insights_data
        assert "weaknesses" in insights_data
        assert "opportunities" in insights_data
        assert "risks" in insights_data
        assert "recommended_improvements" in insights_data
        assert "innovation_score" in insights_data
        assert "feasibility_score" in insights_data
        assert "market_potential" in insights_data
        print(f"  [PASS] 6. AI Insights Page Telemetry: Innovation = {insights_data['innovation_score']['score']}/100, Feasibility = {insights_data['feasibility_score']['score']}/100, Market = {insights_data['market_potential']['score']}/100")

    print("\n=======================================================")
    print("ALL SPECIMENS VALIDATED ACROSS ALL 6 AI SUITE MODULES")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_phase6_multi_project_suite()
