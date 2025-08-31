#!/usr/bin/env python3
"""
Start script for GitHub PR Automation UI
Starts the FastAPI backend server
"""

import uvicorn
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting GitHub PR Automation API Server...")
    print("📡 API will be available at: http://localhost:8000")
    print("🌐 Frontend should be started separately with: cd ui && npm run dev")
    print("📖 API documentation: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
