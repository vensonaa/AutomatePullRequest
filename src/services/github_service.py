"""
GitHub service for PR management
"""

import aiohttp
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass

from src.models.pr_models import (
    BranchInfo, PRData, PRFile, PRComment, 
    ApprovalInfo, AIContent
)

logger = logging.getLogger(__name__)

@dataclass
class GitHubConfig:
    token: str
    repository: str
    base_branch: str = "main"
    auto_merge: bool = False
    require_reviews: bool = True

class GitHubService:
    """Service for GitHub API interactions"""
    
    def __init__(self, config: GitHubConfig):
        self.config = config
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {config.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-PR-Automation/1.0"
        }
        self.owner, self.repo = config.repository.split("/")
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request to GitHub API"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            try:
                if method.upper() == "GET":
                    async with session.get(url, headers=self.headers) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            logger.error(f"GitHub API error: {response.status}")
                            return None
                elif method.upper() == "POST":
                    async with session.post(url, headers=self.headers, json=data) as response:
                        if response.status in [200, 201]:
                            return await response.json()
                        else:
                            logger.error(f"GitHub API error: {response.status}")
                            return None
                elif method.upper() == "PATCH":
                    async with session.patch(url, headers=self.headers, json=data) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            logger.error(f"GitHub API error: {response.status}")
                            return None
            except Exception as e:
                logger.error(f"Request error: {e}")
                return None
    
    async def get_branch_info(self, branch_name: str) -> Optional[BranchInfo]:
        """Get information about a branch"""
        try:
            # Get branch details
            branch_data = await self._make_request("GET", f"branches/{branch_name}")
            if not branch_data:
                return None
            
            # Get recent commits
            commits_data = await self._make_request("GET", f"commits?sha={branch_name}&per_page=5")
            
            # Get files changed
            files_changed = []
            additions = 0
            deletions = 0
            
            if commits_data:
                for commit in commits_data:
                    commit_detail = await self._make_request("GET", f"commits/{commit['sha']}")
                    if commit_detail:
                        for file in commit_detail.get('files', []):
                            files_changed.append(file['filename'])
                            additions += file.get('additions', 0)
                            deletions += file.get('deletions', 0)
            
            return BranchInfo(
                name=branch_name,
                sha=branch_data['commit']['sha'],
                commit_message=branch_data['commit']['commit']['message'],
                author=branch_data['commit']['commit']['author']['name'],
                files_changed=list(set(files_changed)),  # Remove duplicates
                additions=additions,
                deletions=deletions
            )
            
        except Exception as e:
            logger.error(f"Error getting branch info: {e}")
            return None
    
    async def create_pull_request(
        self,
        title: str,
        head_branch: str,
        base_branch: str,
        body: str = "",
        labels: List[str] = None,
        reviewers: List[str] = None,
        auto_merge: bool = False
    ) -> Optional[PRData]:
        """Create a new pull request"""
        try:
            data = {
                "title": title,
                "head": head_branch,
                "base": base_branch,
                "body": body,
                "draft": False
            }
            
            if labels:
                data["labels"] = labels
            
            pr_data = await self._make_request("POST", "pulls", data)
            if not pr_data:
                return None
            
            # Add reviewers if specified
            if reviewers:
                await self._make_request("POST", f"pulls/{pr_data['number']}/requested_reviewers", {
                    "reviewers": reviewers
                })
            
            # Enable auto-merge if requested
            if auto_merge:
                await self._make_request("PUT", f"pulls/{pr_data['number']}/merge", {
                    "merge_method": "squash"
                })
            
            return PRData(
                number=pr_data['number'],
                title=pr_data['title'],
                body=pr_data['body'] or "",
                state=pr_data['state'],
                html_url=pr_data['html_url'],
                head_branch=pr_data['head']['ref'],
                base_branch=pr_data['base']['ref'],
                created_at=datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00')),
                author=pr_data['user']['login'],
                labels=[label['name'] for label in pr_data.get('labels', [])],
                reviewers=[reviewer['login'] for reviewer in pr_data.get('requested_reviewers', [])]
            )
            
        except Exception as e:
            logger.error(f"Error creating PR: {e}")
            return None
    
    async def get_pull_request(self, pr_number: int) -> Optional[PRData]:
        """Get pull request details"""
        try:
            pr_data = await self._make_request("GET", f"pulls/{pr_number}")
            if not pr_data:
                return None
            
            return PRData(
                number=pr_data['number'],
                title=pr_data['title'],
                body=pr_data['body'] or "",
                state=pr_data['state'],
                html_url=pr_data['html_url'],
                head_branch=pr_data['head']['ref'],
                base_branch=pr_data['base']['ref'],
                created_at=datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00')),
                author=pr_data['user']['login'],
                labels=[label['name'] for label in pr_data.get('labels', [])],
                reviewers=[reviewer['login'] for reviewer in pr_data.get('requested_reviewers', [])]
            )
            
        except Exception as e:
            logger.error(f"Error getting PR #{pr_number}: {e}")
            return None
    
    async def get_open_pull_requests(self) -> List[PRData]:
        """Get all open pull requests"""
        try:
            prs_data = await self._make_request("GET", "pulls?state=open&sort=updated&direction=desc")
            if not prs_data:
                return []
            
            prs = []
            for pr_data in prs_data:
                prs.append(PRData(
                    number=pr_data['number'],
                    title=pr_data['title'],
                    body=pr_data['body'] or "",
                    state=pr_data['state'],
                    html_url=pr_data['html_url'],
                    head_branch=pr_data['head']['ref'],
                    base_branch=pr_data['base']['ref'],
                    created_at=datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00')),
                    author=pr_data['user']['login'],
                    labels=[label['name'] for label in pr_data.get('labels', [])],
                    reviewers=[reviewer['login'] for reviewer in pr_data.get('requested_reviewers', [])]
                ))
            
            return prs
            
        except Exception as e:
            logger.error(f"Error getting open PRs: {e}")
            return []
    
    async def get_all_pull_requests(self) -> List[PRData]:
        """Get all pull requests (open and closed)"""
        try:
            prs_data = await self._make_request("GET", "pulls?state=all&sort=updated&direction=desc&per_page=100")
            if not prs_data:
                return []
            
            prs = []
            for pr_data in prs_data:
                prs.append(PRData(
                    number=pr_data['number'],
                    title=pr_data['title'],
                    body=pr_data['body'] or "",
                    state=pr_data['state'],
                    html_url=pr_data['html_url'],
                    head_branch=pr_data['head']['ref'],
                    base_branch=pr_data['base']['ref'],
                    created_at=datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00')),
                    author=pr_data['user']['login'],
                    labels=[label['name'] for label in pr_data.get('labels', [])],
                    reviewers=[reviewer['login'] for reviewer in pr_data.get('requested_reviewers', [])]
                ))
            
            return prs
            
        except Exception as e:
            logger.error(f"Error getting all PRs: {e}")
            return []
    
    async def get_pr_files(self, pr_number: int) -> List[PRFile]:
        """Get files changed in a pull request"""
        try:
            files_data = await self._make_request("GET", f"pulls/{pr_number}/files")
            if not files_data:
                return []
            
            files = []
            for file_data in files_data:
                files.append(PRFile(
                    filename=file_data['filename'],
                    status=file_data['status'],
                    additions=file_data['additions'],
                    deletions=file_data['deletions'],
                    changes=file_data['changes'],
                    patch=file_data.get('patch')
                ))
            
            return files
            
        except Exception as e:
            logger.error(f"Error getting PR files: {e}")
            return []
    
    async def add_pr_comment(
        self,
        pr_number: int,
        body: str,
        path: Optional[str] = None,
        line: Optional[int] = None
    ) -> bool:
        """Add a comment to a pull request"""
        try:
            data = {"body": body}
            
            if path and line:
                data["path"] = path
                data["line"] = line
            
            result = await self._make_request("POST", f"pulls/{pr_number}/comments", data)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error adding PR comment: {e}")
            return False
    
    async def get_pr_approvals(self, pr_number: int) -> ApprovalInfo:
        """Get approval status for a pull request"""
        try:
            # Get reviews
            reviews_data = await self._make_request("GET", f"pulls/{pr_number}/reviews")
            if not reviews_data:
                return ApprovalInfo(
                    approved=False,
                    approved_by=[],
                    required_reviews=1,
                    approved_reviews=0,
                    pending_reviews=0
                )
            
            approved_by = []
            for review in reviews_data:
                if review['state'] == 'APPROVED':
                    approved_by.append(review['user']['login'])
            
            # Get branch protection rules (if any)
            branch_data = await self._make_request("GET", f"pulls/{pr_number}")
            if branch_data:
                base_branch = branch_data['base']['ref']
                protection_data = await self._make_request("GET", f"branches/{base_branch}/protection")
                required_reviews = 1  # Default
                if protection_data and 'required_pull_request_reviews' in protection_data:
                    required_reviews = protection_data['required_pull_request_reviews'].get('required_approving_review_count', 1)
            else:
                required_reviews = 1
            
            approved = len(approved_by) >= required_reviews
            pending_reviews = max(0, required_reviews - len(approved_by))
            
            return ApprovalInfo(
                approved=approved,
                approved_by=approved_by,
                required_reviews=required_reviews,
                approved_reviews=len(approved_by),
                pending_reviews=pending_reviews
            )
            
        except Exception as e:
            logger.error(f"Error getting PR approvals: {e}")
            return ApprovalInfo(
                approved=False,
                approved_by=[],
                required_reviews=1,
                approved_reviews=0,
                pending_reviews=0
            )
    
    async def get_pending_reviews(self) -> List[PRData]:
        """Get PRs that need reviews"""
        try:
            open_prs = await self.get_open_pull_requests()
            pending_reviews = []
            
            for pr in open_prs:
                approvals = await self.get_pr_approvals(pr.number)
                if not approvals.approved:
                    pending_reviews.append(pr)
            
            return pending_reviews
            
        except Exception as e:
            logger.error(f"Error getting pending reviews: {e}")
            return []
    
    async def update_pr_status(self, pr_number: int, approvals: ApprovalInfo) -> bool:
        """Update PR status based on approvals"""
        try:
            # This could include updating labels, status checks, etc.
            # For now, we'll just log the status
            logger.info(f"PR #{pr_number} approval status: {approvals.approved}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating PR status: {e}")
            return False
