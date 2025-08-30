"""
Configuration management for GitHub PR automation
"""

import os
import yaml
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

from src.services.github_service import GitHubConfig
from src.services.groq_service import GroqConfig
from src.services.sheets_service import SheetsConfig

# Load environment variables
load_dotenv()

@dataclass
class Config:
    """Main configuration class"""
    github: GitHubConfig
    groq: GroqConfig
    sheets: SheetsConfig

def load_config() -> Config:
    """Load configuration from environment variables and config file"""
    
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
    
    # Load additional config from file if it exists
    config_file = os.getenv("CONFIG_FILE", "config.yaml")
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            file_config = yaml.safe_load(f)
            
            # Override with file config if present
            if 'github' in file_config:
                github_config = _merge_github_config(github_config, file_config['github'])
            if 'groq' in file_config:
                groq_config = _merge_groq_config(groq_config, file_config['groq'])
            if 'sheets' in file_config:
                sheets_config = _merge_sheets_config(sheets_config, file_config['sheets'])
    
    return Config(
        github=github_config,
        groq=groq_config,
        sheets=sheets_config
    )

def _merge_github_config(base: GitHubConfig, override: dict) -> GitHubConfig:
    """Merge GitHub configuration with file overrides"""
    return GitHubConfig(
        token=override.get('token', base.token),
        repository=override.get('repository', base.repository),
        base_branch=override.get('base_branch', base.base_branch),
        auto_merge=override.get('auto_merge', base.auto_merge),
        require_reviews=override.get('require_reviews', base.require_reviews)
    )

def _merge_groq_config(base: GroqConfig, override: dict) -> GroqConfig:
    """Merge Groq configuration with file overrides"""
    return GroqConfig(
        api_key=override.get('api_key', base.api_key),
        model=override.get('model', base.model),
        max_tokens=override.get('max_tokens', base.max_tokens),
        temperature=override.get('temperature', base.temperature)
    )

def _merge_sheets_config(base: SheetsConfig, override: dict) -> SheetsConfig:
    """Merge Sheets configuration with file overrides"""
    return SheetsConfig(
        credentials_file=override.get('credentials_file', base.credentials_file),
        spreadsheet_id=override.get('spreadsheet_id', base.spreadsheet_id),
        worksheet_name=override.get('worksheet_name', base.worksheet_name),
        auto_sync=override.get('auto_sync', base.auto_sync),
        sync_interval=override.get('sync_interval', base.sync_interval)
    )

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
    
    # Validate Sheets config
    if not config.sheets.credentials_file:
        errors.append("GOOGLE_SHEETS_CREDENTIALS_FILE is required")
    if not config.sheets.spreadsheet_id:
        errors.append("GOOGLE_SHEETS_SPREADSHEET_ID is required")
    if not os.path.exists(config.sheets.credentials_file):
        errors.append(f"Google Sheets credentials file not found: {config.sheets.credentials_file}")
    
    if errors:
        print("Configuration errors:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    return True

def create_sample_config() -> str:
    """Create a sample configuration file"""
    sample_config = """
# GitHub Configuration
github:
  token: "your_github_personal_access_token"
  repository: "owner/repository_name"
  base_branch: "main"
  auto_merge: false
  require_reviews: true

# Groq AI Configuration
groq:
  api_key: "your_groq_api_key"
  model: "groq/llama3-8b-8192"
  max_tokens: 2048
  temperature: 0.7

# Google Sheets Configuration
sheets:
  credentials_file: "path/to/credentials.json"
  spreadsheet_id: "your_spreadsheet_id"
  worksheet_name: "PR Tracking"
  auto_sync: true
  sync_interval: 300  # seconds

# Automation Settings
automation:
  check_interval: 3600  # seconds
  max_concurrent_reviews: 5
  auto_comment: true
  review_all_open: true
"""
    return sample_config

def save_config(config: Config, filename: str = "config.yaml") -> bool:
    """Save configuration to file"""
    try:
        config_data = {
            'github': {
                'token': config.github.token,
                'repository': config.github.repository,
                'base_branch': config.github.base_branch,
                'auto_merge': config.github.auto_merge,
                'require_reviews': config.github.require_reviews
            },
            'groq': {
                'api_key': config.groq.api_key,
                'model': config.groq.model,
                'max_tokens': config.groq.max_tokens,
                'temperature': config.groq.temperature
            },
            'sheets': {
                'credentials_file': config.sheets.credentials_file,
                'spreadsheet_id': config.sheets.spreadsheet_id,
                'worksheet_name': config.sheets.worksheet_name,
                'auto_sync': config.sheets.auto_sync,
                'sync_interval': config.sheets.sync_interval
            }
        }
        
        with open(filename, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False)
        
        return True
        
    except Exception as e:
        print(f"Error saving config: {e}")
        return False
