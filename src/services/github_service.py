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
        # Handle repository format (supports both "owner/repo" and "https://github.com/owner/repo")
        if config.repository:
            if config.repository.startswith("https://github.com/"):
                # Extract owner/repo from full URL
                repo_part = config.repository.replace("https://github.com/", "")
                if "/" in repo_part:
                    self.owner, self.repo = repo_part.split("/", 1)
                else:
                    self.owner = "owner"
                    self.repo = "repository_name"
            elif "/" in config.repository:
                # Direct owner/repo format
                parts = config.repository.split("/")
                if len(parts) == 2:
                    self.owner, self.repo = parts
                else:
                    self.owner = "owner"
                    self.repo = "repository_name"
            else:
                self.owner = "owner"
                self.repo = "repository_name"
        else:
            self.owner = "owner"
            self.repo = "repository_name"
    
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
            else:
                # No reviewers selected - auto-approve and merge
                logger.info(f"No reviewers selected for PR #{pr_data['number']}, auto-approving and merging")
                success, message = await self.auto_approve_pr(pr_data['number'])
                if not success:
                    logger.warning(f"Auto-approve failed for PR #{pr_data['number']}: {message}")
            
            # Enable auto-merge if requested (only if reviewers are selected)
            if auto_merge and reviewers:
                await self._make_request("PUT", f"pulls/{pr_data['number']}/merge", {
                    "merge_method": "squash"
                })
            
            try:
                created_at = datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00'))
            except:
                created_at = datetime.now()
            
            try:
                updated_at = datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00'))
            except:
                updated_at = datetime.now()
            
            return PRData(
                number=pr_data['number'],
                title=pr_data['title'],
                body=pr_data['body'] or "",
                state=pr_data['state'],
                html_url=pr_data['html_url'],
                head_branch=pr_data['head']['ref'],
                base_branch=pr_data['base']['ref'],
                created_at=created_at,
                updated_at=updated_at,
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
                try:
                    # Handle datetime parsing safely
                    created_at = datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00'))
                except:
                    created_at = datetime.now()
                
                try:
                    updated_at = datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00'))
                except:
                    updated_at = datetime.now()
                
                prs.append(PRData(
                    number=pr_data['number'],
                    title=pr_data['title'],
                    body=pr_data['body'] or "",
                    state=pr_data['state'],
                    html_url=pr_data['html_url'],
                    head_branch=pr_data['head']['ref'],
                    base_branch=pr_data['base']['ref'],
                    created_at=created_at,
                    updated_at=updated_at,
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
                try:
                    # Handle datetime parsing safely
                    created_at = datetime.fromisoformat(pr_data['created_at'].replace('Z', '+00:00'))
                except:
                    created_at = datetime.now()
                
                try:
                    updated_at = datetime.fromisoformat(pr_data['updated_at'].replace('Z', '+00:00'))
                except:
                    updated_at = datetime.now()
                
                prs.append(PRData(
                    number=pr_data['number'],
                    title=pr_data['title'],
                    body=pr_data['body'] or "",
                    state=pr_data['state'],
                    html_url=pr_data['html_url'],
                    head_branch=pr_data['head']['ref'],
                    base_branch=pr_data['base']['ref'],
                    created_at=created_at,
                    updated_at=updated_at,
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

    async def get_branches(self) -> List[Dict[str, Any]]:
        """Get all branches from the repository"""
        try:
            branches_data = await self._make_request("GET", "branches")
            if branches_data:
                return [
                    {
                        "name": branch["name"],
                        "sha": branch["commit"]["sha"],
                        "protected": branch.get("protected", False)
                    }
                    for branch in branches_data
                ]
            return []
        except Exception as e:
            logger.error(f"Error getting branches: {e}")
            return []

    async def get_labels(self) -> List[Dict[str, Any]]:
        """Get all labels from the repository"""
        try:
            labels_data = await self._make_request("GET", "labels")
            if labels_data:
                return [
                    {
                        "name": label["name"],
                        "color": label["color"],
                        "description": label.get("description", "")
                    }
                    for label in labels_data
                ]
            return []
        except Exception as e:
            logger.error(f"Error getting labels: {e}")
            return []

    async def get_collaborators(self) -> List[Dict[str, Any]]:
        """Get all collaborators from the repository"""
        try:
            collaborators_data = await self._make_request("GET", "collaborators")
            if collaborators_data:
                return [
                    {
                        "login": user["login"],
                        "id": user["id"],
                        "type": user["type"],
                        "avatar_url": user.get("avatar_url", "")
                    }
                    for user in collaborators_data
                ]
            return []
        except Exception as e:
            logger.error(f"Error getting collaborators: {e}")
            return []

    async def submit_pr_review(
        self,
        pr_number: int,
        state: str = "COMMENT",
        body: str = "",
        event: str = "COMMENT"
    ) -> tuple[bool, str]:
        """Submit a review for a pull request. Returns (success, error_message)"""
        try:
            # GitHub API expects 'event' instead of 'state' for review submission
            data = {
                "event": event
            }
            
            # Add body if provided or if it's required for the event type
            if body.strip() or event in ["APPROVE", "REQUEST_CHANGES"]:
                data["body"] = body.strip() or ("Approved" if event == "APPROVE" else "Changes requested")
            
            # Make direct request to get detailed error information
            url = f"{self.base_url}/repos/{self.owner}/{self.repo}/pulls/{pr_number}/reviews"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=data) as response:
                    if response.status in [200, 201]:
                        return True, ""
                    else:
                        error_text = await response.text()
                        logger.error(f"GitHub API error {response.status}: {error_text}")
                        logger.error(f"Request data: {data}")
                        return False, error_text
        except Exception as e:
            logger.error(f"Error submitting PR review: {e}")
            return False, str(e)

    async def auto_approve_pr(self, pr_number: int, body: str = "Auto-approved by automation system") -> tuple[bool, str]:
        """Auto-approve a pull request (used when no reviewers are selected)"""
        try:
            # Get the PR author to avoid self-approval
            pr_data = await self._make_request("GET", f"pulls/{pr_number}")
            if not pr_data:
                return False, "PR not found"
            
            author = pr_data['user']['login']
            
            # Check if the current user is the author (to avoid self-approval)
            # For now, we'll use a different approach - we'll enable auto-merge instead
            # since GitHub doesn't allow self-approval
            
            # Enable auto-merge for the PR
            merge_data = {
                "merge_method": "squash",
                "commit_title": f"Auto-merge PR #{pr_number}",
                "commit_message": f"Auto-merged PR #{pr_number}: {pr_data['title']}"
            }
            
            url = f"{self.base_url}/repos/{self.owner}/{self.repo}/pulls/{pr_number}/merge"
            
            async with aiohttp.ClientSession() as session:
                async with session.put(url, headers=self.headers, json=merge_data) as response:
                    if response.status in [200, 201]:
                        logger.info(f"Auto-merged PR #{pr_number}")
                        return True, "PR auto-merged successfully"
                    else:
                        error_text = await response.text()
                        logger.error(f"Auto-merge failed for PR #{pr_number}: {response.status} - {error_text}")
                        return False, f"Auto-merge failed: {error_text}"
                        
        except Exception as e:
            logger.error(f"Error auto-approving PR #{pr_number}: {e}")
            return False, str(e)

    async def get_pr_reviews(self, pr_number: int) -> List[Dict[str, Any]]:
        """Get all reviews for a pull request"""
        try:
            reviews_data = await self._make_request("GET", f"pulls/{pr_number}/reviews")
            if reviews_data:
                return [
                    {
                        "id": review["id"],
                        "user": review["user"]["login"],
                        "body": review.get("body", ""),
                        "state": review["state"],
                        "submitted_at": review["submitted_at"],
                        "commit_id": review["commit_id"]
                    }
                    for review in reviews_data
                ]
            return []
        except Exception as e:
            logger.error(f"Error getting PR reviews: {e}")
            return []

    async def delete_pr_review(self, pr_number: int, review_id: int) -> tuple[bool, str]:
        """Delete a specific review from a pull request"""
        try:
            url = f"{self.base_url}/repos/{self.owner}/{self.repo}/pulls/{pr_number}/reviews/{review_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=self.headers) as response:
                    if response.status in [200, 204]:
                        logger.info(f"Deleted review {review_id} from PR #{pr_number}")
                        return True, "Review deleted successfully"
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to delete review {review_id} from PR #{pr_number}: {response.status} - {error_text}")
                        return False, f"Failed to delete review: {error_text}"
                        
        except Exception as e:
            logger.error(f"Error deleting PR review: {e}")
            return False, str(e)

    async def get_pull_request(self, pr_number: int) -> Optional[Dict[str, Any]]:
        """Get pull request details"""
        try:
            pr_data = await self._make_request("GET", f"pulls/{pr_number}")
            if pr_data:
                return {
                    "number": pr_data["number"],
                    "title": pr_data["title"],
                    "body": pr_data.get("body", ""),
                    "author": pr_data["user"]["login"],
                    "state": pr_data["state"],
                    "created_at": pr_data["created_at"],
                    "updated_at": pr_data["updated_at"],
                    "head": pr_data["head"]["ref"],
                    "base": pr_data["base"]["ref"]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting pull request: {e}")
            return None

    async def get_pr_files(self, pr_number: int) -> List[Dict[str, Any]]:
        """Get files changed in a pull request"""
        try:
            files_data = await self._make_request("GET", f"pulls/{pr_number}/files")
            if files_data:
                return [
                    {
                        "filename": file["filename"],
                        "status": file["status"],
                        "additions": file["additions"],
                        "deletions": file["deletions"],
                        "changes": file["changes"],
                        "patch": file.get("patch", "")
                    }
                    for file in files_data
                ]
            return []
        except Exception as e:
            logger.error(f"Error getting PR files: {e}")
            return []
