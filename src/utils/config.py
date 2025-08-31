"""
Configuration management for GitHub PR automation
"""

import os
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

from src.services.github_service import GitHubConfig
from src.services.groq_service import GroqConfig
from src.services.sheets_service import SheetsConfig

# Load environment variables from .env file
load_dotenv()

@dataclass
class Config:
    """Main configuration class"""
    github: GitHubConfig
    groq: GroqConfig
    sheets: SheetsConfig

def load_config() -> Config:
    """Load configuration from environment variables"""
    
    try:
        # Load from environment variables
        github_config = GitHubConfig(
            token=os.getenv("GITHUB_TOKEN", ""),
            repository=os.getenv("GITHUB_REPO", ""),
            base_branch=os.getenv("GITHUB_BASE_BRANCH", "main"),
            auto_merge=os.getenv("GITHUB_AUTO_MERGE", "false").lower() == "true",
            require_reviews=os.getenv("GITHUB_REQUIRE_REVIEWS", "true").lower() == "true"
        )
        
        groq_config = GroqConfig(
            api_key=os.getenv("GROQ_API_KEY", ""),
            model=os.getenv("GROQ_MODEL", "groq/llama3-8b-8192"),
            max_tokens=int(os.getenv("GROQ_MAX_TOKENS", "2048")),
            temperature=float(os.getenv("GROQ_TEMPERATURE", "0.7"))
        )
        
        sheets_config = SheetsConfig(
            credentials_file=os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE", ""),
            spreadsheet_id=os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID", ""),
            worksheet_name=os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME", "PR Tracking"),
            auto_sync=os.getenv("GOOGLE_SHEETS_AUTO_SYNC", "true").lower() == "true",
            sync_interval=int(os.getenv("GOOGLE_SHEETS_SYNC_INTERVAL", "300"))
        )
        
        return Config(
            github=github_config,
            groq=groq_config,
            sheets=sheets_config
        )
    except Exception as e:
        print(f"Error loading config: {e}")
        import traceback
        traceback.print_exc()
        raise

def validate_config(config: Config) -> bool:
    """Validate configuration and return True if valid"""
    errors = []
    
    # Validate GitHub config
    if not config.github.token:
        errors.append("GITHUB_TOKEN is required")
    if not config.github.repository:
        errors.append("GITHUB_REPO is required")
    if '/' not in config.github.repository:
        errors.append("GITHUB_REPO must be in format 'owner/repository'")
    
    # Validate Groq config
    if not config.groq.api_key:
        errors.append("GROQ_API_KEY is required")
    
    # Validate Sheets config (optional for basic functionality)
    if config.sheets.credentials_file and not os.path.exists(config.sheets.credentials_file):
        errors.append(f"Google Sheets credentials file not found: {config.sheets.credentials_file}")
    
    if errors:
        print("Configuration errors:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    return True

def create_sample_env() -> str:
    """Create a sample .env file content"""
    sample_env = """# GitHub PR Automation Environment Variables
# Copy this file to .env and fill in your actual values

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=owner/repository_name
GITHUB_BASE_BRANCH=main
GITHUB_AUTO_MERGE=false
GITHUB_REQUIRE_REVIEWS=true

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=groq/llama3-8b-8192
GROQ_MAX_TOKENS=2048
GROQ_TEMPERATURE=0.7

# Google Sheets Configuration
GOOGLE_SHEETS_CREDENTIALS_FILE=path/to/credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_WORKSHEET_NAME=PR Tracking
GOOGLE_SHEETS_AUTO_SYNC=true
GOOGLE_SHEETS_SYNC_INTERVAL=300

# Application Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/automation.log
"""
    return sample_env

def save_env_template(filename: str = ".env") -> bool:
    """Save .env template file"""
    try:
        env_content = create_sample_env()
        with open(filename, 'w') as f:
            f.write(env_content)
        return True
    except Exception as e:
        print(f"Error saving .env template: {e}")
        return False

def get_config_summary(config: Config) -> dict:
    """Get a summary of the current configuration"""
    return {
        "github": {
            "repository": config.github.repository,
            "base_branch": config.github.base_branch,
            "auto_merge": config.github.auto_merge,
            "require_reviews": config.github.require_reviews,
            "token_configured": bool(config.github.token)
        },
        "groq": {
            "model": config.groq.model,
            "max_tokens": config.groq.max_tokens,
            "temperature": config.groq.temperature,
            "api_key_configured": bool(config.groq.api_key)
        },
        "sheets": {
            "worksheet_name": config.sheets.worksheet_name,
            "auto_sync": config.sheets.auto_sync,
            "sync_interval": config.sheets.sync_interval,
            "credentials_configured": bool(config.sheets.credentials_file and os.path.exists(config.sheets.credentials_file)),
            "spreadsheet_configured": bool(config.sheets.spreadsheet_id)
        }
    }
