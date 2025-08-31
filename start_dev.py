#!/usr/bin/env python3
"""
Development startup script for GitHub PR Automation
Starts both backend (FastAPI) and frontend (Vite) servers
"""

import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting backend server...")
    try:
        # Start the backend server
        backend_process = subprocess.Popen([
            sys.executable, "start_ui.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Wait a moment for the server to start
        time.sleep(3)
        
        if backend_process.poll() is None:
            print("✅ Backend server started successfully on http://localhost:8000")
            return backend_process
        else:
            stdout, stderr = backend_process.communicate()
            print(f"❌ Backend server failed to start:")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return None
    except Exception as e:
        print(f"❌ Failed to start backend server: {e}")
        return None

def start_frontend():
    """Start the Vite frontend server"""
    print("🚀 Starting frontend server...")
    try:
        # Change to UI directory
        ui_dir = Path("ui")
        if not ui_dir.exists():
            print("❌ UI directory not found")
            return None
            
        # Start the frontend server
        frontend_process = subprocess.Popen([
            "npm", "run", "dev"
        ], cwd=ui_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Wait a moment for the server to start
        time.sleep(5)
        
        if frontend_process.poll() is None:
            print("✅ Frontend server started successfully on http://localhost:5173")
            return frontend_process
        else:
            stdout, stderr = frontend_process.communicate()
            print(f"❌ Frontend server failed to start:")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return None
    except Exception as e:
        print(f"❌ Failed to start frontend server: {e}")
        return None

def main():
    """Main function to start both servers"""
    print("🎯 Starting GitHub PR Automation Development Environment")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("server.py").exists():
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Start backend first
    backend_process = start_backend()
    if not backend_process:
        print("❌ Backend failed to start. Exiting.")
        sys.exit(1)
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("❌ Frontend failed to start. Stopping backend...")
        backend_process.terminate()
        sys.exit(1)
    
    print("\n🎉 Both servers are running!")
    print("📱 Frontend: http://localhost:5173")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop both servers")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend server stopped unexpectedly")
                break
                
            if frontend_process.poll() is not None:
                print("❌ Frontend server stopped unexpectedly")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        
        # Stop both processes
        if backend_process:
            backend_process.terminate()
            print("✅ Backend server stopped")
            
        if frontend_process:
            frontend_process.terminate()
            print("✅ Frontend server stopped")
            
        print("👋 Development environment stopped")

if __name__ == "__main__":
    main()
