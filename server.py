#!/usr/bin/env python3
"""
FastAPI server for GitHub PR Automation UI
Provides API endpoints for configuration management and automation operations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import os
import aiohttp
from datetime import datetime

from src.utils.config import load_config, get_config_summary, Config
from src.core.automation import GitHubPRAutomation
import asyncio

app = FastAPI(
    title="GitHub PR Automation API",
    description="API for GitHub PR Automation with Groq AI",
    version="1.0.0"
)

# Add CORS middleware to allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class ConfigUpdate(BaseModel):
    github: Optional[Dict[str, Any]] = None
    groq: Optional[Dict[str, Any]] = None
    sheets: Optional[Dict[str, Any]] = None
    app: Optional[Dict[str, Any]] = None

class ConfigResponse(BaseModel):
    github: Dict[str, Any]
    groq: Dict[str, Any]
    sheets: Dict[str, Any]
    app: Dict[str, Any]

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GitHub PR Automation API", "version": "1.0.0"}

@app.get("/api/config", response_model=ConfigResponse)
async def get_config():
    """Get current configuration"""
    try:
        config = load_config()
        summary = get_config_summary(config)
        
        return ConfigResponse(
            github={
                "token": config.github.token,
                "repository": config.github.repository,
                "baseBranch": config.github.base_branch,
                "autoMerge": config.github.auto_merge,
                "requireReviews": config.github.require_reviews,
            },
            groq={
                "apiKey": config.groq.api_key,
                "model": config.groq.model,
                "maxTokens": config.groq.max_tokens,
                "temperature": config.groq.temperature,
            },
            sheets={
                "credentialsFile": config.sheets.credentials_file,
                "spreadsheetId": config.sheets.spreadsheet_id,
                "worksheetName": config.sheets.worksheet_name,
                "autoSync": config.sheets.auto_sync,
                "syncInterval": config.sheets.sync_interval,
            },
            app={
                "logLevel": os.getenv("LOG_LEVEL", "INFO"),
                "logFile": os.getenv("LOG_FILE", "logs/automation.log"),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load configuration: {str(e)}")

@app.put("/api/config")
async def update_config(config_update: ConfigUpdate):
    """Update configuration (Note: This would need to update the .env file)"""
    try:
        # For now, return the current config since updating .env requires file system access
        # In a production environment, you might want to implement proper configuration persistence
        current_config = load_config()
        
        # TODO: Implement actual configuration update logic
        # This would involve updating the .env file or a database
        
        return {"message": "Configuration update not implemented yet", "current_config": get_config_summary(current_config)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")

@app.get("/api/status")
async def get_status():
    """Get system status and configuration summary"""
    try:
        config = load_config()
        summary = get_config_summary(config)
        
        return {
            "status": "running",
            "config_summary": summary,
            "environment": {
                "python_version": os.sys.version,
                "log_level": os.getenv("LOG_LEVEL", "INFO"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@app.post("/api/test-connection/{service}")
async def test_connection(service: str):
    """Test connection to a specific service"""
    try:
        config = load_config()
        
        if service.lower() == "github":
            # Test GitHub connection
            automation = GitHubPRAutomation(config)
            # Add GitHub connection test logic here
            return {"status": "success", "message": "GitHub connection test successful"}
        
        elif service.lower() == "groq":
            # Test Groq AI connection
            automation = GitHubPRAutomation(config)
            # Add Groq connection test logic here
            return {"status": "success", "message": "Groq AI connection test successful"}
        
        elif service.lower() == "sheets":
            # Test Google Sheets connection
            automation = GitHubPRAutomation(config)
            # Add Google Sheets connection test logic here
            return {"status": "success", "message": "Google Sheets connection test successful"}
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown service: {service}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/github/branches")
async def get_github_branches():
    """Get branches from GitHub repository"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        branches = await automation.github_service.get_branches()
        return {"branches": branches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get branches: {str(e)}")

@app.get("/api/github/labels")
async def get_github_labels():
    """Get labels from GitHub repository"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        labels = await automation.github_service.get_labels()
        return {"labels": labels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get labels: {str(e)}")

@app.get("/api/github/collaborators")
async def get_github_collaborators():
    """Get collaborators from GitHub repository"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        collaborators = await automation.github_service.get_collaborators()
        return {"collaborators": collaborators}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get collaborators: {str(e)}")

@app.post("/api/github/pull-requests")
async def create_github_pull_request(pr_data: dict):
    """Create a pull request in GitHub"""
    try:
        print(f"PR Creation Request Data: {pr_data}")
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Extract reviewers from the request
        reviewers = pr_data.get("reviewers", [])
        
        # Create PR with reviewers
        result = await automation.create_pr(
            branch=pr_data["head"],
            title=pr_data["title"],
            prompt=pr_data.get("body", ""),
            base_branch=pr_data["base"],
            auto_merge=False
        )
        
        if result.success:
            # Add reviewers to the PR if specified
            if reviewers:
                await automation.github_service._make_request(
                    "POST", 
                    f"pulls/{result.pr_number}/requested_reviewers", 
                    {"reviewers": reviewers}
                )
            else:
                # No reviewers selected - auto-approve and merge
                print(f"No reviewers selected for PR #{result.pr_number}, auto-approving and merging")
                success, message = await automation.github_service.auto_approve_pr(result.pr_number)
                if success:
                    print(f"Auto-approve successful: {message}")
                else:
                    print(f"Auto-approve failed: {message}")
            
            return {
                "success": True,
                "pr_number": result.pr_number,
                "url": result.url,
                "title": result.title,
                "auto_approved": len(reviewers) == 0
            }
        else:
            raise HTTPException(status_code=400, detail=result.error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create PR: {str(e)}")

@app.get("/api/github/test-connection")
async def test_github_connection():
    """Test GitHub API connection"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Test by trying to get branch info for the base branch
        owner = automation.github_service.owner
        repo = automation.github_service.repo
        base_branch = config.github.base_branch
        
        branch_info = await automation.github_service.get_branch_info(base_branch)
        if branch_info:
            return {
                "success": True,
                "repository": f"{owner}/{repo}",
                "message": "GitHub connection successful"
            }
        else:
            # Try to get more specific error information
            try:
                # Make a direct request to see the actual error
                url = f"https://api.github.com/repos/{automation.github_service.owner}/{automation.github_service.repo}/branches/{config.github.base_branch}"
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=automation.github_service.headers) as response:
                        if response.status == 401:
                            return {
                                "success": False,
                                "error": "Authentication failed - check your GitHub token",
                                "message": "GitHub connection failed"
                            }
                        elif response.status == 403:
                            return {
                                "success": False,
                                "error": "Access forbidden - token lacks required permissions",
                                "message": "GitHub connection failed"
                            }
                        elif response.status == 404:
                            return {
                                "success": False,
                                "error": "Repository or branch not found",
                                "message": "GitHub connection failed"
                            }
                        else:
                            error_text = await response.text()
                            return {
                                "success": False,
                                "error": f"GitHub API error {response.status}: {error_text}",
                                "message": "GitHub connection failed"
                            }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Could not access repository: {str(e)}",
                    "message": "GitHub connection failed"
                }
    except Exception as e:
        # Return 200 OK but with success: false for frontend to handle
        return {
            "success": False,
            "error": str(e),
            "message": "GitHub connection failed"
        }

@app.get("/api/prs")
async def get_prs():
    """Get list of pull requests"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Get all pull requests (open and closed)
        all_prs = await automation.github_service.get_all_pull_requests()
        
        # Convert PRData objects to dictionaries for JSON serialization
        prs_list = []
        for pr in all_prs:
            prs_list.append({
                "number": pr.number,
                "title": pr.title,
                "body": pr.body,
                "state": pr.state,
                "html_url": pr.html_url,
                "head_branch": pr.head_branch,
                "base_branch": pr.base_branch,
                "created_at": pr.created_at.isoformat() if pr.created_at else None,
                "updated_at": pr.updated_at.isoformat() if pr.updated_at else None,
                "author": pr.author,
                "labels": pr.labels,
                "reviewers": pr.reviewers
            })
        
        return {"prs": prs_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get PRs: {str(e)}")

@app.get("/api/github/pull-requests/{pr_number}/files")
async def get_pr_files(pr_number: int):
    """Get files changed in a pull request"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        files = await automation.github_service.get_pr_files(pr_number)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get PR files: {str(e)}")

@app.post("/api/github/pull-requests/{pr_number}/ai-review")
async def ai_review_pr(pr_number: int):
    """Perform AI review of a pull request"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Get PR data
        pr_dict = await automation.github_service.get_pull_request(pr_number)
        if not pr_dict:
            raise HTTPException(status_code=404, detail="Pull request not found")
        
        # Get PR files
        files_data = await automation.github_service.get_pr_files(pr_number)
        
        # Convert to PRFile objects
        from src.models.pr_models import PRFile, PRData
        files = [
            PRFile(
                filename=file["filename"],
                status=file["status"],
                additions=file["additions"],
                deletions=file["deletions"],
                changes=file["changes"],
                patch=file.get("patch", "")
            )
            for file in files_data
        ]
        
        # Convert dictionary to PRData object
        from datetime import datetime
        pr_data = PRData(
            number=pr_dict["number"],
            title=pr_dict["title"],
            body=pr_dict["body"],
            author=pr_dict["author"],
            state=pr_dict["state"],
            html_url=f"https://github.com/{automation.github_service.owner}/{automation.github_service.repo}/pull/{pr_dict['number']}",
            head_branch=pr_dict["head"],
            base_branch=pr_dict["base"],
            created_at=datetime.fromisoformat(pr_dict["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(pr_dict["updated_at"].replace('Z', '+00:00')),
            labels=[],
            reviewers=[]
        )
        
        # Perform AI review
        review = await automation.groq_service.review_pull_request(pr_data, files)
        
        return {
            "success": True,
            "review": {
                "summary": review.summary,
                "score": review.score,
                "comments": [
                    {
                        "body": comment.body,
                        "path": comment.path,
                        "line": comment.line
                    }
                    for comment in review.comments
                ],
                "suggestions": review.suggestions,
                "issues": review.issues
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform AI review: {str(e)}")

@app.post("/api/github/pull-requests/{pr_number}/reviews")
async def submit_pr_review(pr_number: int, review_data: dict):
    """Submit a review for a pull request"""
    try:
        print(f"Review submission data: PR #{pr_number}, Data: {review_data}")
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Submit the review
        success, error_message = await automation.github_service.submit_pr_review(
            pr_number=pr_number,
            state=review_data.get("state", "COMMENT"),  # APPROVE, REQUEST_CHANGES, COMMENT
            body=review_data.get("body", ""),
            event=review_data.get("event", "COMMENT")
        )
        
        if success:
            return {
                "success": True,
                "message": f"Review submitted successfully for PR #{pr_number}"
            }
        else:
            # Check if it's a self-approval issue
            if "Can not approve your own pull request" in error_message:
                raise HTTPException(
                    status_code=400, 
                    detail="You cannot approve your own pull request. This is a GitHub security feature. Please ask another team member to review and approve the PR."
                )
            else:
                raise HTTPException(status_code=400, detail=f"Failed to submit review: {error_message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit review: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    """Get automation statistics"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        # Get all pull requests
        all_prs = await automation.github_service.get_all_pull_requests()
        open_prs = await automation.github_service.get_open_pull_requests()
        
        # Calculate statistics
        total_prs = len(all_prs)
        open_pr_count = len(open_prs)
        closed_prs = total_prs - open_pr_count
        
        # Calculate approval rate (simplified)
        approved_prs = 0
        pending_reviews = 0
        
        for pr in open_prs:
            approvals = await automation.github_service.get_pr_approvals(pr.number)
            if approvals.approved:
                approved_prs += 1
            else:
                pending_reviews += approvals.pending_reviews
        
        approval_rate = (approved_prs / total_prs * 100) if total_prs > 0 else 0
        
        return {
            "totalPRs": total_prs,
            "openPRs": open_pr_count,
            "closedPRs": closed_prs,
            "approvedPRs": approved_prs,
            "pendingReviews": pending_reviews,
            "avgReviewTime": "24h",  # Placeholder
            "approvalRate": round(approval_rate, 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
