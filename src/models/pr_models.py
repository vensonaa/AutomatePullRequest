"""
Data models for GitHub PR automation
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime

@dataclass
class PRResult:
    """Result of PR creation operation"""
    success: bool
    pr_number: Optional[int] = None
    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    error: Optional[str] = None

@dataclass
class ReviewResult:
    """Result of PR review operation"""
    success: bool
    reviewed_count: int = 0
    comments_count: int = 0
    review_summary: Optional[str] = None
    error: Optional[str] = None

@dataclass
class TrackingResult:
    """Result of approval tracking operation"""
    success: bool
    tracked_count: int = 0
    sheets_updated: int = 0
    error: Optional[str] = None

@dataclass
class StatusInfo:
    """System status information"""
    github_repo: str
    open_prs: int
    pending_reviews: int
    sheets_connected: bool
    ai_model: str
    last_sync: str

@dataclass
class BranchInfo:
    """GitHub branch information"""
    name: str
    sha: str
    commit_message: str
    author: str
    files_changed: List[str]
    additions: int
    deletions: int

@dataclass
class PRData:
    """GitHub PR data"""
    number: int
    title: str
    body: str
    state: str
    html_url: str
    head_branch: str
    base_branch: str
    created_at: datetime
    updated_at: datetime
    author: str
    labels: List[str]
    reviewers: List[str]

@dataclass
class PRFile:
    """PR file information"""
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None

@dataclass
class PRComment:
    """PR comment data"""
    body: str
    path: Optional[str] = None
    line: Optional[int] = None
    position: Optional[int] = None

@dataclass
class AIReview:
    """AI-generated review"""
    summary: str
    comments: List[PRComment]
    score: float
    suggestions: List[str]
    issues: List[str]

@dataclass
class PersistedAIReview:
    """Persisted AI review with metadata"""
    id: int
    pr_number: int
    pr_title: str
    pr_author: str
    summary: str
    score: float
    suggestions: List[str]
    issues: List[str]
    comments: List[PRComment]
    files: List[PRFile]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class AIContent:
    """AI-generated PR content"""
    title: str
    description: str
    labels: List[str]
    reviewers: List[str]

@dataclass
class ApprovalInfo:
    """PR approval information"""
    approved: bool
    approved_by: List[str]
    required_reviews: int
    approved_reviews: int
    pending_reviews: int

@dataclass
class SheetsRow:
    """Google Sheets row data"""
    pr_number: int
    title: str
    status: str
    created_date: str
    review_status: str
    approvals: str
    comments_count: int
    last_updated: str

@dataclass
class ConfigData:
    """Configuration data"""
    github_token: str
    github_repo: str
    groq_api_key: str
    groq_model: str
    sheets_credentials_file: str
    sheets_spreadsheet_id: str
    sheets_worksheet_name: str
