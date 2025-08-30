"""
Core automation engine for GitHub PR management with Groq AI
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from src.services.github_service import GitHubService
from src.services.groq_service import GroqService
from src.services.sheets_service import GoogleSheetsService
from src.models.pr_models import PRResult, ReviewResult, TrackingResult, StatusInfo
from src.utils.config import Config

logger = logging.getLogger(__name__)

@dataclass
class AutomationResult:
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class GitHubPRAutomation:
    """Main automation class for GitHub PR management"""
    
    def __init__(self, config: Config):
        self.config = config
        self.github_service = GitHubService(config.github)
        self.groq_service = GroqService(config.groq)
        self.sheets_service = GoogleSheetsService(config.sheets)
        self.logger = logging.getLogger(__name__)
    
    async def create_pr(
        self,
        branch: str,
        title: Optional[str] = None,
        prompt: Optional[str] = None,
        base_branch: str = "main",
        auto_merge: bool = False
    ) -> PRResult:
        """Create a new PR with AI assistance"""
        try:
            self.logger.info(f"Creating PR for branch: {branch}")
            
            # Get branch information
            branch_info = await self.github_service.get_branch_info(branch)
            if not branch_info:
                return PRResult(success=False, error="Branch not found")
            
            # Generate PR content with AI
            if not title or prompt:
                ai_content = await self.groq_service.generate_pr_content(
                    branch_info=branch_info,
                    custom_prompt=prompt
                )
                title = title or ai_content.title
                description = ai_content.description
                labels = ai_content.labels
                reviewers = ai_content.reviewers
            else:
                description = ""
                labels = []
                reviewers = []
            
            # Create the PR
            pr_data = await self.github_service.create_pull_request(
                title=title,
                head_branch=branch,
                base_branch=base_branch,
                body=description,
                labels=labels,
                reviewers=reviewers,
                auto_merge=auto_merge
            )
            
            if pr_data:
                # Track in Google Sheets
                await self.sheets_service.add_pr_tracking(
                    pr_number=pr_data.number,
                    title=title,
                    status="open",
                    created_date=datetime.now().isoformat()
                )
                
                return PRResult(
                    success=True,
                    pr_number=pr_data.number,
                    title=title,
                    url=pr_data.html_url,
                    description=description
                )
            else:
                return PRResult(success=False, error="Failed to create PR")
                
        except Exception as e:
            self.logger.error(f"Error creating PR: {e}")
            return PRResult(success=False, error=str(e))
    
    async def review_pr(self, pr_number: int, auto_comment: bool = True) -> ReviewResult:
        """Review a specific PR with AI"""
        try:
            self.logger.info(f"Reviewing PR #{pr_number}")
            
            # Get PR details
            pr_data = await self.github_service.get_pull_request(pr_number)
            if not pr_data:
                return ReviewResult(success=False, error="PR not found")
            
            # Get PR files and changes
            files = await self.github_service.get_pr_files(pr_number)
            
            # Generate AI review
            review = await self.groq_service.review_pull_request(
                pr_data=pr_data,
                files=files
            )
            
            comments_added = 0
            if auto_comment and review.comments:
                # Add AI comments to the PR
                for comment in review.comments:
                    await self.github_service.add_pr_comment(
                        pr_number=pr_number,
                        body=comment.body,
                        path=comment.path,
                        line=comment.line
                    )
                    comments_added += 1
            
            # Update tracking
            await self.sheets_service.update_pr_review_status(
                pr_number=pr_number,
                review_status="reviewed",
                comments_count=comments_added
            )
            
            return ReviewResult(
                success=True,
                reviewed_count=1,
                comments_count=comments_added,
                review_summary=review.summary
            )
            
        except Exception as e:
            self.logger.error(f"Error reviewing PR #{pr_number}: {e}")
            return ReviewResult(success=False, error=str(e))
    
    async def review_all_open_prs(self, auto_comment: bool = True) -> ReviewResult:
        """Review all open PRs with AI"""
        try:
            self.logger.info("Reviewing all open PRs")
            
            # Get all open PRs
            open_prs = await self.github_service.get_open_pull_requests()
            
            reviewed_count = 0
            total_comments = 0
            
            for pr in open_prs:
                result = await self.review_pr(pr.number, auto_comment)
                if result.success:
                    reviewed_count += 1
                    total_comments += result.comments_count
            
            return ReviewResult(
                success=True,
                reviewed_count=reviewed_count,
                comments_count=total_comments
            )
            
        except Exception as e:
            self.logger.error(f"Error reviewing all PRs: {e}")
            return ReviewResult(success=False, error=str(e))
    
    async def track_approvals(
        self,
        sync_sheet: bool = True,
        update_status: bool = True
    ) -> TrackingResult:
        """Track PR approvals and sync with Google Sheets"""
        try:
            self.logger.info("Tracking PR approvals")
            
            # Get all PRs
            all_prs = await self.github_service.get_all_pull_requests()
            
            tracked_count = 0
            sheets_updated = 0
            
            for pr in all_prs:
                # Get approval status
                approvals = await self.github_service.get_pr_approvals(pr.number)
                
                if update_status:
                    # Update PR status in GitHub
                    await self.github_service.update_pr_status(pr.number, approvals)
                
                if sync_sheet:
                    # Update Google Sheets
                    await self.sheets_service.update_pr_approvals(
                        pr_number=pr.number,
                        approvals=approvals,
                        status=pr.state
                    )
                    sheets_updated += 1
                
                tracked_count += 1
            
            return TrackingResult(
                success=True,
                tracked_count=tracked_count,
                sheets_updated=sheets_updated
            )
            
        except Exception as e:
            self.logger.error(f"Error tracking approvals: {e}")
            return TrackingResult(success=False, error=str(e))
    
    async def run_single_workflow(self) -> AutomationResult:
        """Run a single automation workflow"""
        try:
            self.logger.info("Running single automation workflow")
            
            # Review open PRs
            review_result = await self.review_all_open_prs(auto_comment=True)
            
            # Track approvals
            tracking_result = await self.track_approvals(sync_sheet=True, update_status=True)
            
            return AutomationResult(
                success=True,
                message="Workflow completed successfully",
                data={
                    "reviews": review_result.__dict__,
                    "tracking": tracking_result.__dict__
                }
            )
            
        except Exception as e:
            self.logger.error(f"Error in workflow: {e}")
            return AutomationResult(success=False, error=str(e))
    
    async def run_continuous_workflow(self, interval: int = 3600) -> None:
        """Run continuous automation workflow"""
        self.logger.info(f"Starting continuous workflow with {interval}s interval")
        
        while True:
            try:
                await self.run_single_workflow()
                await asyncio.sleep(interval)
            except KeyboardInterrupt:
                self.logger.info("Continuous workflow stopped by user")
                break
            except Exception as e:
                self.logger.error(f"Error in continuous workflow: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def manage_sheets(self, action: str) -> AutomationResult:
        """Manage Google Sheets operations"""
        try:
            if action == "sync":
                await self.sheets_service.sync_all_data()
                return AutomationResult(
                    success=True,
                    message="Sheets synced successfully",
                    details="All PR data synchronized"
                )
            elif action == "clear":
                await self.sheets_service.clear_all_data()
                return AutomationResult(
                    success=True,
                    message="Sheets cleared successfully",
                    details="All data removed"
                )
            elif action == "setup":
                await self.sheets_service.setup_worksheet()
                return AutomationResult(
                    success=True,
                    message="Sheets setup completed",
                    details="Worksheet initialized with headers"
                )
            else:
                return AutomationResult(
                    success=False,
                    error=f"Unknown action: {action}"
                )
                
        except Exception as e:
            self.logger.error(f"Error managing sheets: {e}")
            return AutomationResult(success=False, error=str(e))
    
    async def get_status(self) -> StatusInfo:
        """Get current system status"""
        try:
            # Get GitHub status
            open_prs = await self.github_service.get_open_pull_requests()
            pending_reviews = await self.github_service.get_pending_reviews()
            
            # Check sheets connection
            sheets_connected = await self.sheets_service.test_connection()
            
            return StatusInfo(
                github_repo=self.config.github.repository,
                open_prs=len(open_prs),
                pending_reviews=len(pending_reviews),
                sheets_connected=sheets_connected,
                ai_model=self.config.groq.model,
                last_sync=datetime.now().isoformat()
            )
            
        except Exception as e:
            self.logger.error(f"Error getting status: {e}")
            return StatusInfo(
                github_repo="Error",
                open_prs=0,
                pending_reviews=0,
                sheets_connected=False,
                ai_model="Error",
                last_sync="Error"
            )
