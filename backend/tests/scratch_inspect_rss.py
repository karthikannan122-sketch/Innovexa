import urllib.request
import xml.etree.ElementTree as ET
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

test_urls = [
    ("ScienceDaily AI", "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml"),
    ("ScienceDaily Tech", "https://www.sciencedaily.com/rss/matter_energy/technology.xml"),
    ("ScienceDaily Health", "https://www.sciencedaily.com/rss/health_medicine.xml"),
    ("ScienceDaily Robotics", "https://www.sciencedaily.com/rss/computers_math/robotics.xml"),
    ("ScienceDaily Space", "https://www.sciencedaily.com/rss/space_time.xml"),
    ("ArXiv AI", "https://rss.arxiv.org/rss/cs.AI"),
    ("MIT Tech Review", "https://www.technologyreview.com/feed/"),
    ("Hacker News Top", "https://hacker-news.firebaseio.com/v0/topstories.json")
]

for name, url in test_urls:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) INNOVEXA-Discovery/1.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = r.read()
            if url.endswith(".json"):
                ids = json.loads(data)
                print(f"[OK] {name}: SUCCESS ({len(ids)} IDs)")
            else:
                root = ET.fromstring(data)
                items = [elem for elem in root.iter() if elem.tag.endswith("item") or elem.tag.endswith("entry")]
                print(f"[OK] {name}: SUCCESS ({len(items)} items)")
                if items:
                    title_elem = next((child for child in items[0] if child.tag.endswith("title")), None)
                    t_text = title_elem.text if title_elem is not None and title_elem.text else "N/A"
                    print(f"     Sample: {t_text[:80]}")
    except Exception as e:
        print(f"[FAIL] {name}: FAILED ({e})")
