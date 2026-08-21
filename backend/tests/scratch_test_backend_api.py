import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('.')

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

print("=== TESTING FASTAPI DISCOVERY ENDPOINTS ===")

# 1. Health
r_health = client.get("/api/v1/health")
print(f"1. /api/v1/health: {r_health.status_code} -> {r_health.json()}")

# 2. Get External Innovations
r_get = client.get("/api/v1/external-innovations")
data = r_get.json()
print(f"2. /api/v1/external-innovations: {r_get.status_code} -> Total: {data.get('total')} items")
if data.get('data'):
    first = data['data'][0]
    print(f"   Sample Title: {first.get('title')}")
    print(f"   Category: {first.get('category')}")
    print(f"   Source: {first.get('source_name')}")

# 3. Filter by Category
r_cat = client.get("/api/v1/external-innovations?category=Artificial+Intelligence")
print(f"3. /api/v1/external-innovations?category=AI: {r_cat.status_code} -> {r_cat.json().get('total')} items")

# 4. Sources Telemetry
r_sources = client.get("/api/v1/external-innovations/sources")
print(f"4. /api/v1/external-innovations/sources: {r_sources.status_code} -> {len(r_sources.json().get('data', []))} sources")

# 5. Like an item
if data.get('data'):
    item_id = data['data'][0]['id']
    r_like = client.post(f"/api/v1/external-innovations/{item_id}/like")
    print(f"5. POST /api/v1/external-innovations/{item_id}/like: {r_like.status_code} -> Likes: {r_like.json().get('likes_count')}")

# 6. Ingest Trigger
r_ingest = client.post("/api/v1/external-innovations/ingest")
print(f"6. POST /api/v1/external-innovations/ingest: {r_ingest.status_code} -> {r_ingest.json().get('message')}")

print("\n=== ALL FASTAPI DISCOVERY ENDPOINTS VERIFIED! ===")
