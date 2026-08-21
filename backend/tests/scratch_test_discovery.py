import sys
import os

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('.')
from backend.app.discovery_engine import discovery_engine

print("=== STARTING DISCOVERY INGESTION PIPELINE ===")
report = discovery_engine.run_ingestion_pipeline()
print(f"Added: {report['new_discoveries_added']} items, Total active: {report['total_active_discoveries']}")
for s in report['sources']:
    print(f" - {s['name']}: {s['status']} (Found: {s['items_found']}, Added: {s['items_added']}, Error: {s['error']})")

items = discovery_engine.get_discoveries()
print(f"\nTotal in discovery feed: {len(items)}")
if items:
    print("\n--- SAMPLE DISCOVERY ITEM ---")
    print("Title:", items[0]['title'])
    print("Source:", items[0]['source_name'])
    print("URL:", items[0]['source_url'])
    print("Category:", items[0]['category'])
    print("Tags:", items[0]['tags'])
    print("Summary:", items[0]['summary'])
    print("Content Hash:", items[0]['content_hash'])

print("\n--- TESTING DUPLICATE DETECTION ---")
dup_report = discovery_engine.run_ingestion_pipeline()
print(f"Second Run (Duplicate check) -> Added: {dup_report['new_discoveries_added']}, Duplicates skipped: {dup_report['duplicates_skipped']}")
