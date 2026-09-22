import os
import sys

# Ensure backend root directory is in python sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI application
from app.main import app

# Explicit top-level bindings for Vercel Python Serverless handler detection
handler = app
application = app
