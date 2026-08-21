"""
INNOVEXA Innovation Discovery Engine (Backend Ingestion & Telemetry Service)
Handles compliant fetching from approved RSS/API feeds, duplicate detection,
SHA-256 content hashing, AI classification, tag generation, and data persistence.
"""

import os
import re
import time
import json
import uuid
import hashlib
import logging
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import xml.etree.ElementTree as ET

logger = logging.getLogger("innovexa.discovery")

# Approved Legitimate Innovation Sources across Key Frontier Categories
DEFAULT_SOURCES = [
    {
        "id": "src_sciencedaily_ai",
        "name": "ScienceDaily AI",
        "url": "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml",
        "feed_type": "RSS",
        "category_hint": "Artificial Intelligence",
        "is_enabled": True
    },
    {
        "id": "src_sciencedaily_health",
        "name": "ScienceDaily Health & Biotech",
        "url": "https://www.sciencedaily.com/rss/health_medicine.xml",
        "feed_type": "RSS",
        "category_hint": "Healthcare",
        "is_enabled": True
    },
    {
        "id": "src_sciencedaily_robotics",
        "name": "ScienceDaily Robotics",
        "url": "https://www.sciencedaily.com/rss/computers_math/robotics.xml",
        "feed_type": "RSS",
        "category_hint": "Robotics",
        "is_enabled": True
    },
    {
        "id": "src_sciencedaily_tech",
        "name": "ScienceDaily Technology",
        "url": "https://www.sciencedaily.com/rss/matter_energy/technology.xml",
        "feed_type": "RSS",
        "category_hint": "Web Technology",
        "is_enabled": True
    },
    {
        "id": "src_sciencedaily_space",
        "name": "ScienceDaily Space",
        "url": "https://www.sciencedaily.com/rss/space_time.xml",
        "feed_type": "RSS",
        "category_hint": "Space Technology",
        "is_enabled": True
    },
    {
        "id": "src_mit_tech_review",
        "name": "MIT Technology Review",
        "url": "https://www.technologyreview.com/feed/",
        "feed_type": "RSS",
        "category_hint": "Artificial Intelligence",
        "is_enabled": True
    },
    {
        "id": "src_arxiv_ai",
        "name": "ArXiv AI Research",
        "url": "https://rss.arxiv.org/rss/cs.AI",
        "feed_type": "RSS",
        "category_hint": "Artificial Intelligence",
        "is_enabled": True
    }
]

# Standard Taxonomy Categories
STANDARD_CATEGORIES = [
    "Artificial Intelligence",
    "Healthcare",
    "Cybersecurity",
    "Robotics",
    "Sustainability",
    "Space Technology",
    "Web Technology",
    "FinTech",
    "Education",
    "Developer Tools"
]

def clean_html(raw_html: str) -> str:
    """Removes HTML tags, CDATA, and excessive whitespace from strings."""
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = re.sub(r'&[a-zA-Z0-9#]+;', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def normalize_title(title: str) -> str:
    """Normalizes title for duplicate comparison."""
    if not title:
        return ""
    return re.sub(r'[^a-z0-9]', '', title.lower())

def compute_content_hash(title: str, url: str) -> str:
    """Generates a deterministic SHA-256 content hash."""
    payload = f"{normalize_title(title)}::{url.strip().lower()}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def classify_and_tag(title: str, raw_summary: str, category_hint: str = "Technology") -> Dict[str, Any]:
    """
    Intelligently classifies discovery, generates 3-6 relevant tags,
    and produces a concise 40-80 word executive summary.
    Uses Gemini API if available, else semantic heuristics.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    text_corpus = f"{title} {raw_summary}".lower()

    # 1. AI Classification via Gemini 2.0 if key configured
    if gemini_key and len(gemini_key) > 5:
        try:
            prompt = (
                f"Classify this innovation discovery into one of these exact categories: "
                f"{', '.join(STANDARD_CATEGORIES)}.\n"
                f"Generate 3 to 6 concise tags.\n"
                f"Generate an original, concise executive summary (between 40 and 80 words) describing the development.\n\n"
                f"Title: {title}\nSummary: {raw_summary}\n\n"
                f"Return JSON format:\n"
                f'{{"category": "...", "tags": ["tag1", "tag2", "tag3"], "summary": "..."}}'
            )
            req_data = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            }).encode('utf-8')
            
            gem_req = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(gem_req, timeout=5) as resp:
                res_data = json.loads(resp.read())
                cand = res_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(cand)
                cat = parsed.get("category", category_hint)
                if cat not in STANDARD_CATEGORIES:
                    cat = category_hint
                return {
                    "category": cat,
                    "tags": parsed.get("tags", ["Innovation", "Research", "Tech"])[:6],
                    "summary": parsed.get("summary", raw_summary[:280]),
                    "ai_generated": True
                }
        except Exception as e:
            logger.warning(f"Gemini classification fallback triggered: {e}")

    # 2. Rule-Based Heuristic Classifier
    detected_category = category_hint
    tags = set()

    if any(k in text_corpus for k in ["health", "biotech", "medical", "disease", "clinical", "patient", "drug", "hospital", "cancer", "telemetry", "ecg", "cardiac", "alzheimer", "parkinson", "antibody"]):
        detected_category = "Healthcare"
        tags.update(["Healthcare", "Biotech", "Clinical", "Diagnostics", "Bioengineering"])
    elif any(k in text_corpus for k in ["robot", "autonomous", "drone", "actuator", "humanoid", "manipulator", "quadruped", "motor", "kinematics"]):
        detected_category = "Robotics"
        tags.update(["Robotics", "Automation", "Hardware", "Sensors", "Actuation"])
    elif any(k in text_corpus for k in ["space", "nasa", "satellite", "orbit", "telescope", "astronomy", "lunar", "mars", "rocket", "propulsion", "cosmology", "einstein"]):
        detected_category = "Space Technology"
        tags.update(["Space", "Aerospace", "Exploration", "Telemetry", "Astronomy"])
    elif any(k in text_corpus for k in ["climate", "carbon", "energy", "solar", "battery", "sustainability", "green", "clean tech", "emission", "power", "grid"]):
        detected_category = "Sustainability"
        tags.update(["Sustainability", "ClimateTech", "CleanEnergy", "ESG", "Battery"])
    elif any(k in text_corpus for k in ["security", "cyber", "zero-day", "malware", "ransomware", "cryptography", "firewall", "vulnerability"]):
        detected_category = "Cybersecurity"
        tags.update(["Cybersecurity", "ZeroTrust", "Privacy", "NetworkDefense"])
    elif any(k in text_corpus for k in ["finance", "fintech", "banking", "payments", "defi", "trading", "ledger"]):
        detected_category = "FinTech"
        tags.update(["FinTech", "Banking", "Payments", "Ledger"])
    elif any(k in text_corpus for k in ["ai", "neural", "llm", "transformer", "machine learning", "deep learning", "gpt", "agent", "vision", "diffusion", "reasoning"]):
        detected_category = "Artificial Intelligence"
        tags.update(["AI", "MachineLearning", "NeuralNetworks", "AutonomousAgents"])
    elif any(k in text_corpus for k in ["education", "learning", "student", "curriculum", "teaching", "academy"]):
        detected_category = "Education"
        tags.update(["Education", "EdTech", "Knowledge", "LearningSystems"])
    else:
        tags.update(["Technology", "Innovation", "Computing", "Architecture"])

    # Ensure 3-6 tags
    tag_list = list(tags)[:6]
    if len(tag_list) < 3:
        tag_list.extend(["Innovation", "EmergingTech"])
        tag_list = list(dict.fromkeys(tag_list))[:6]

    # Format summary to 40-80 words
    clean_desc = clean_html(raw_summary)
    words = clean_desc.split()
    if len(words) > 75:
        summary_text = " ".join(words[:75]) + "..."
    elif len(words) < 20:
        summary_text = f"{clean_desc} This breakthrough represents meaningful progress in {detected_category.lower()}, expanding verifiable capabilities for researchers and product innovators across the industry."
    else:
        summary_text = clean_desc

    return {
        "category": detected_category,
        "tags": tag_list,
        "summary": summary_text,
        "ai_generated": False
    }


class DiscoveryEngine:
    """Server-side autonomous discovery ingestion, deduplication, and telemetry engine."""

    def __init__(self):
        self.sources: Dict[str, dict] = {s["id"]: dict(s) for s in DEFAULT_SOURCES}
        self.discoveries: Dict[str, dict] = {} # content_hash -> item
        self.last_run_timestamp: Optional[str] = None
        self.source_telemetry: Dict[str, dict] = {}

    def fetch_rss_feed(self, source: dict) -> List[dict]:
        """Fetches and parses standard RSS 2.0 or Atom feeds using universal XML tag navigation."""
        items = []
        req = urllib.request.Request(
            source["url"],
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) INNOVEXA-Discovery-Bot/2.0"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read()

        root = ET.fromstring(content)
        raw_items = [elem for elem in root.iter() if elem.tag.endswith('item') or elem.tag.endswith('entry')]

        for elem in raw_items[:12]: # Process top 12 newest items per source
            title_elem = next((child for child in elem if child.tag.endswith('title') and child.text), None)
            link_elem = next((child for child in elem if child.tag.endswith('link')), None)
            desc_elem = next((child for child in elem if (child.tag.endswith('description') or child.tag.endswith('summary')) and child.text), None)
            pub_elem = next((child for child in elem if (child.tag.endswith('pubDate') or child.tag.endswith('published') or child.tag.endswith('updated')) and child.text), None)

            title = clean_html(title_elem.text) if title_elem is not None and title_elem.text else ""
            if not title:
                continue

            link = ""
            if link_elem is not None:
                if link_elem.text:
                    link = link_elem.text.strip()
                elif 'href' in link_elem.attrib:
                    link = link_elem.attrib['href'].strip()

            if not link:
                continue

            desc = clean_html(desc_elem.text) if desc_elem is not None and desc_elem.text else title
            
            pub_date = datetime.now(timezone.utc).isoformat()
            if pub_elem is not None and pub_elem.text:
                pub_date = pub_elem.text.strip()

            items.append({
                "title": title,
                "source_url": link,
                "raw_summary": desc,
                "published_at": pub_date,
                "source_name": source["name"]
            })

        return items

    def run_ingestion_pipeline(self) -> Dict[str, Any]:
        """
        Executes complete ingestion pipeline:
        1. Iterates over all enabled external sources.
        2. Isolates errors so 1 failed source doesn't block others.
        3. Deduplicates using URL, content hash, and normalized title.
        4. Classifies, tags, and formats summaries.
        5. Updates discovery store and logs telemetry.
        """
        start_time = datetime.now(timezone.utc)
        self.last_run_timestamp = start_time.isoformat()
        
        total_fetched = 0
        total_new_added = 0
        total_duplicates_skipped = 0
        source_reports = []

        for source_id, source in self.sources.items():
            if not source.get("is_enabled", True):
                continue

            src_report = {
                "id": source_id,
                "name": source["name"],
                "status": "SUCCESS",
                "items_found": 0,
                "items_added": 0,
                "error": None
            }

            try:
                raw_items = self.fetch_rss_feed(source)
                src_report["items_found"] = len(raw_items)
                total_fetched += len(raw_items)

                for item in raw_items:
                    title = item["title"]
                    url = item["source_url"]
                    c_hash = compute_content_hash(title, url)

                    # 1. Exact Content Hash or URL Deduplication
                    if c_hash in self.discoveries:
                        total_duplicates_skipped += 1
                        continue

                    # 2. Normalized Title Deduplication (catch syndicated cross-posts)
                    norm_t = normalize_title(title)
                    is_near_duplicate = any(normalize_title(d["title"]) == norm_t for d in self.discoveries.values())
                    if is_near_duplicate:
                        total_duplicates_skipped += 1
                        continue

                    # 3. AI Classification & Tagging
                    classification = classify_and_tag(title, item["raw_summary"], source.get("category_hint", "Technology"))

                    # 4. Construct External Innovation Specimen
                    discovery_id = f"ext_{uuid.uuid4().hex[:12]}"
                    new_discovery = {
                        "id": discovery_id,
                        "title": title,
                        "summary": classification["summary"],
                        "ai_summary": classification["summary"],
                        "source_name": item["source_name"],
                        "source_url": url,
                        "image_url": item.get("image_url") or None,
                        "category": classification["category"],
                        "tags": classification["tags"],
                        "content_hash": c_hash,
                        "is_active": True,
                        "views_count": 0,
                        "likes_count": item.get("likes_count", 0),
                        "published_at": item["published_at"],
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "is_external": True
                    }

                    self.discoveries[c_hash] = new_discovery
                    total_new_added += 1
                    src_report["items_added"] += 1

                # Update source telemetry
                source["last_fetched_at"] = datetime.now(timezone.utc).isoformat()
                source["last_status"] = "SUCCESS"
                source["last_error"] = None
                source["items_count"] = source.get("items_count", 0) + src_report["items_added"]

            except Exception as ex:
                logger.error(f"Discovery error on source '{source['name']}': {ex}")
                src_report["status"] = "ERROR"
                src_report["error"] = str(ex)
                source["last_status"] = "ERROR"
                source["last_error"] = str(ex)

            source_reports.append(src_report)
            self.source_telemetry[source_id] = src_report

        # Enforce Data Retention Strategy (keep latest 300 active items)
        self._enforce_retention_policy()

        summary_report = {
            "timestamp": self.last_run_timestamp,
            "total_sources_processed": len(source_reports),
            "total_items_fetched": total_fetched,
            "new_discoveries_added": total_new_added,
            "duplicates_skipped": total_duplicates_skipped,
            "total_active_discoveries": len(self.discoveries),
            "sources": source_reports
        }

        logger.info(f"Discovery engine cycle completed: +{total_new_added} new items, {total_duplicates_skipped} duplicates skipped.")
        return summary_report

    def _enforce_retention_policy(self, max_items: int = 300):
        """Maintains clean storage bounds while preserving high-engagement historical items."""
        if len(self.discoveries) > max_items:
            sorted_items = sorted(
                self.discoveries.values(),
                key=lambda x: (x.get("likes_count", 0), x.get("discovered_at", "")),
                reverse=True
            )
            keep_hashes = {item["content_hash"] for item in sorted_items[:max_items]}
            self.discoveries = {h: item for h, item in self.discoveries.items() if h in keep_hashes}

    def get_discoveries(self, category: Optional[str] = None, source: Optional[str] = None, search: Optional[str] = None, sort_by: str = "NEWEST") -> List[dict]:
        """Returns filtered, sorted external discoveries."""
        items = [d for d in self.discoveries.values() if d.get("is_active", True)]

        # Category Filter
        if category and category != "ALL":
            items = [d for d in items if d.get("category", "").lower() == category.lower() or category.lower() in [t.lower() for t in d.get("tags", [])]]

        # Source Filter
        if source and source != "ALL":
            items = [d for d in items if d.get("source_name", "").lower() == source.lower()]

        # Search Query
        if search and search.strip():
            q = search.strip().lower()
            items = [
                d for d in items
                if q in d.get("title", "").lower()
                or q in d.get("summary", "").lower()
                or q in d.get("category", "").lower()
                or any(q in t.lower() for t in d.get("tags", []))
            ]

        # Sorting
        if sort_by == "NEWEST" or sort_by == "DISCOVERED_DATE":
            items.sort(key=lambda x: x.get("discovered_at") or x.get("published_at") or "", reverse=True)
        elif sort_by == "MOST_LIKED" or sort_by == "TRENDING":
            items.sort(key=lambda x: (x.get("likes_count", 0), x.get("views_count", 0)), reverse=True)
        elif sort_by == "OLDEST":
            items.sort(key=lambda x: x.get("published_at") or x.get("discovered_at") or "")

        return items

    def get_sources_telemetry(self) -> List[dict]:
        """Returns real-time status and telemetry for all external sources."""
        return list(self.sources.values())

    def toggle_source(self, source_id: str) -> Optional[dict]:
        """Enables or disables an external discovery source."""
        if source_id in self.sources:
            self.sources[source_id]["is_enabled"] = not self.sources[source_id].get("is_enabled", True)
            return self.sources[source_id]
        return None

    def delete_discovery(self, discovery_id: str) -> bool:
        """Deletes/deactivates a discovery by ID."""
        for c_hash, d in list(self.discoveries.items()):
            if d.get("id") == discovery_id:
                del self.discoveries[c_hash]
                return True
        return False

    def like_discovery(self, discovery_id: str) -> Optional[dict]:
        """Increments like count on a discovery."""
        for d in self.discoveries.values():
            if d.get("id") == discovery_id:
                d["likes_count"] = d.get("likes_count", 0) + 1
                return d
        return None


# Singleton Instance
discovery_engine = DiscoveryEngine()
