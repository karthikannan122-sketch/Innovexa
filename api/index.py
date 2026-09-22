import os
import sys

# Ensure repository root and backend directory are in python sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

# Explicit top-level bindings for Vercel Python Serverless handler detection
handler = app
application = app
