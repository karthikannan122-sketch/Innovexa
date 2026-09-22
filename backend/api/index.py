"""
Vercel Serverless Function Entry Point for INNOVEXA Backend API
Exposes the FastAPI 'app' ASGI handler for Vercel Python Runtime.
"""
import sys
import os

# Ensure backend root and app directory are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from app.main import app
except ImportError:
    try:
        from backend.app.main import app
    except ImportError:
        # Fallback if executed from root workspace
        workspace_dir = os.path.dirname(parent_dir)
        if workspace_dir not in sys.path:
            sys.path.insert(0, workspace_dir)
        from backend.app.main import app

# Export app for Vercel Serverless Runtime
__all__ = ["app"]
