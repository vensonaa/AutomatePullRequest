"""
Basic tests for GitHub PR Automation
"""

import pytest
import asyncio
from unittest.mock import Mock, patch

from src.models.pr_models import PRResult, ReviewResult, TrackingResult
from src.utils.config import Config
from src.services.github_service import GitHubConfig
from src.services.groq_service import GroqConfig
from src.services.sheets_service import SheetsConfig

@pytest.fixture
def sample_config():
    """Create a sample configuration for testing"""
    return Config(
        github=GitHubConfig(
            token="test_token",
            repository="test/repo",
            base_branch="main",
            auto_merge=False,
            require_reviews=True
        ),
        groq=GroqConfig(
            api_key="test_groq_key",
            model="groq/llama3-8b-8192",
            max_tokens=2048,
            temperature=0.7
        ),
        sheets=SheetsConfig(
            credentials_file="test_credentials.json",
            spreadsheet_id="test_spreadsheet_id",
            worksheet_name="PR Tracking",
            auto_sync=True,
            sync_interval=300
        )
    )

def test_pr_result_creation():
    """Test PRResult creation"""
    result = PRResult(
        success=True,
        pr_number=123,
        title="Test PR",
        url="https://github.com/test/repo/pull/123"
    )
    
    assert result.success is True
    assert result.pr_number == 123
    assert result.title == "Test PR"
    assert result.url == "https://github.com/test/repo/pull/123"

def test_review_result_creation():
    """Test ReviewResult creation"""
    result = ReviewResult(
        success=True,
        reviewed_count=1,
        comments_count=3,
        review_summary="Good code quality"
    )
    
    assert result.success is True
    assert result.reviewed_count == 1
    assert result.comments_count == 3
    assert result.review_summary == "Good code quality"

def test_tracking_result_creation():
    """Test TrackingResult creation"""
    result = TrackingResult(
        success=True,
        tracked_count=5,
        sheets_updated=5
    )
    
    assert result.success is True
    assert result.tracked_count == 5
    assert result.sheets_updated == 5

def test_config_creation(sample_config):
    """Test Config creation"""
    assert sample_config.github.token == "test_token"
    assert sample_config.github.repository == "test/repo"
    assert sample_config.groq.api_key == "test_groq_key"
    assert sample_config.sheets.spreadsheet_id == "test_spreadsheet_id"

@pytest.mark.asyncio
async def test_github_service_initialization(sample_config):
    """Test GitHub service initialization"""
    from src.services.github_service import GitHubService
    
    service = GitHubService(sample_config.github)
    assert service.config.token == "test_token"
    assert service.config.repository == "test/repo"
    assert service.owner == "test"
    assert service.repo == "repo"

@pytest.mark.asyncio
async def test_groq_service_initialization(sample_config):
    """Test Groq service initialization"""
    from src.services.groq_service import GroqService
    
    service = GroqService(sample_config.groq)
    assert service.config.api_key == "test_groq_key"
    assert service.config.model == "groq/llama3-8b-8192"

@pytest.mark.asyncio
async def test_sheets_service_initialization(sample_config):
    """Test Sheets service initialization"""
    from src.services.sheets_service import GoogleSheetsService
    
    with patch('src.services.sheets_service.Credentials.from_service_account_file'):
        with patch('src.services.sheets_service.build'):
            service = GoogleSheetsService(sample_config.sheets)
            assert service.config.spreadsheet_id == "test_spreadsheet_id"
            assert service.config.worksheet_name == "PR Tracking"

def test_branch_info_creation():
    """Test BranchInfo creation"""
    from src.models.pr_models import BranchInfo
    
    branch_info = BranchInfo(
        name="feature/test",
        sha="abc123",
        commit_message="Test commit",
        author="testuser",
        files_changed=["test.py"],
        additions=10,
        deletions=5
    )
    
    assert branch_info.name == "feature/test"
    assert branch_info.sha == "abc123"
    assert branch_info.commit_message == "Test commit"
    assert branch_info.author == "testuser"
    assert branch_info.files_changed == ["test.py"]
    assert branch_info.additions == 10
    assert branch_info.deletions == 5

def test_pr_data_creation():
    """Test PRData creation"""
    from src.models.pr_models import PRData
    from datetime import datetime
    
    pr_data = PRData(
        number=123,
        title="Test PR",
        body="Test description",
        state="open",
        html_url="https://github.com/test/repo/pull/123",
        head_branch="feature/test",
        base_branch="main",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        author="testuser",
        labels=["enhancement"],
        reviewers=["reviewer1"]
    )
    
    assert pr_data.number == 123
    assert pr_data.title == "Test PR"
    assert pr_data.state == "open"
    assert pr_data.head_branch == "feature/test"
    assert pr_data.base_branch == "main"
    assert pr_data.author == "testuser"
    assert pr_data.labels == ["enhancement"]
    assert pr_data.reviewers == ["reviewer1"]

def test_ai_content_creation():
    """Test AIContent creation"""
    from src.models.pr_models import AIContent
    
    ai_content = AIContent(
        title="AI Generated PR",
        description="AI generated description",
        labels=["ai-generated", "enhancement"],
        reviewers=["ai-reviewer"]
    )
    
    assert ai_content.title == "AI Generated PR"
    assert ai_content.description == "AI generated description"
    assert ai_content.labels == ["ai-generated", "enhancement"]
    assert ai_content.reviewers == ["ai-reviewer"]

def test_approval_info_creation():
    """Test ApprovalInfo creation"""
    from src.models.pr_models import ApprovalInfo
    
    approval_info = ApprovalInfo(
        approved=True,
        approved_by=["reviewer1", "reviewer2"],
        required_reviews=2,
        approved_reviews=2,
        pending_reviews=0
    )
    
    assert approval_info.approved is True
    assert approval_info.approved_by == ["reviewer1", "reviewer2"]
    assert approval_info.required_reviews == 2
    assert approval_info.approved_reviews == 2
    assert approval_info.pending_reviews == 0

if __name__ == "__main__":
    pytest.main([__file__])
