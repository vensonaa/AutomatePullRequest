"""
Groq AI service for PR content generation and code review
"""

import aiohttp
import logging
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from src.models.pr_models import (
    BranchInfo, PRData, PRFile, PRComment, 
    AIReview, AIContent
)

logger = logging.getLogger(__name__)

@dataclass
class GroqConfig:
    api_key: str
    model: str = "llama-3.1-8b-instant"
    max_tokens: int = 2048
    temperature: float = 0.7

class GroqService:
    """Service for Groq AI API interactions"""
    
    def __init__(self, config: GroqConfig):
        self.config = config
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """Make request to Groq API"""
        data = {
            "model": self.config.model,
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result['choices'][0]['message']['content']
                    else:
                        logger.error(f"Groq API error: {response.status}")
                        return None
            except Exception as e:
                logger.error(f"Groq request error: {e}")
                return None
    
    async def generate_pr_content(
        self,
        branch_info: BranchInfo,
        custom_prompt: Optional[str] = None
    ) -> AIContent:
        """Generate PR title, description, labels, and reviewers using AI"""
        try:
            # Prepare context for AI
            context = f"""
Branch: {branch_info.name}
Commit Message: {branch_info.commit_message}
Author: {branch_info.author}
Files Changed: {', '.join(branch_info.files_changed)}
Additions: {branch_info.additions}
Deletions: {branch_info.deletions}
"""
            
            if custom_prompt:
                prompt = f"""
{custom_prompt}

Branch Information:
{context}

Please generate a pull request with the following format:
1. Title: A concise, descriptive title
2. Description: A detailed description explaining the changes
3. Labels: Relevant labels (e.g., enhancement, bug-fix, documentation)
4. Reviewers: Suggested reviewers based on the code changes

Respond in JSON format:
{{
    "title": "PR Title",
    "description": "Detailed description...",
    "labels": ["label1", "label2"],
    "reviewers": ["reviewer1", "reviewer2"]
}}
"""
            else:
                prompt = f"""
Based on the following branch information, generate a pull request:

{context}

Please create:
1. A clear, descriptive title for the PR
2. A comprehensive description explaining what was changed and why
3. Appropriate labels for categorization
4. Suggested reviewers based on the files changed

Respond in JSON format:
{{
    "title": "PR Title",
    "description": "Detailed description...",
    "labels": ["label1", "label2"],
    "reviewers": ["reviewer1", "reviewer2"]
}}
"""
            
            messages = [
                {"role": "system", "content": "You are an expert software developer helping to create pull requests. Provide clear, professional, and helpful PR content."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages)
            if not response:
                return self._generate_fallback_content(branch_info)
            
            try:
                # Parse JSON response
                content_data = json.loads(response)
                return AIContent(
                    title=content_data.get("title", f"Update {branch_info.name}"),
                    description=content_data.get("description", f"Changes from branch {branch_info.name}"),
                    labels=content_data.get("labels", []),
                    reviewers=content_data.get("reviewers", [])
                )
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return self._generate_fallback_content(branch_info)
                
        except Exception as e:
            logger.error(f"Error generating PR content: {e}")
            return self._generate_fallback_content(branch_info)
    
    def _generate_fallback_content(self, branch_info: BranchInfo) -> AIContent:
        """Generate fallback content when AI fails"""
        return AIContent(
            title=f"Update {branch_info.name}",
            description=f"Changes from branch {branch_info.name}\n\nCommit: {branch_info.commit_message}\nAuthor: {branch_info.author}",
            labels=["enhancement"],
            reviewers=[]
        )
    
    async def review_pull_request(
        self,
        pr_data: PRData,
        files: List[PRFile]
    ) -> AIReview:
        """Review a pull request using AI"""
        try:
            # Prepare context for review
            context = f"""
Pull Request: #{pr_data.number} - {pr_data.title}
Author: {pr_data.author}
Description: {pr_data.body}
Files Changed: {len(files)} files
"""
            
            # Add file information
            files_info = []
            for file in files:
                files_info.append(f"""
File: {file.filename}
Status: {file.status}
Changes: +{file.additions} -{file.deletions}
""")
                if file.patch:
                    files_info.append(f"Patch:\n{file.patch[:1000]}...")  # Limit patch size
            
            files_context = "\n".join(files_info)
            
            prompt = f"""
Please review this pull request and provide:

{context}

Files Changed:
{files_context}

Please provide a comprehensive code review including:
1. Overall assessment and score (0-10)
2. Specific comments for code improvements
3. Potential issues or bugs
4. Suggestions for better practices
5. Security considerations

Respond in JSON format:
{{
    "summary": "Overall review summary",
    "score": 8.5,
    "comments": [
        {{
            "body": "Comment text",
            "path": "file/path.py",
            "line": 42
        }}
    ],
    "suggestions": ["suggestion1", "suggestion2"],
    "issues": ["issue1", "issue2"]
}}
"""
            
            messages = [
                {"role": "system", "content": "You are an expert code reviewer. Provide thorough, constructive feedback focusing on code quality, security, and best practices."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages)
            if not response:
                return self._generate_fallback_review(pr_data, files)
            
            try:
                # Parse JSON response
                review_data = json.loads(response)
                
                # Convert comments to PRComment objects
                comments = []
                for comment_data in review_data.get("comments", []):
                    comments.append(PRComment(
                        body=comment_data.get("body", ""),
                        path=comment_data.get("path"),
                        line=comment_data.get("line")
                    ))
                
                return AIReview(
                    summary=review_data.get("summary", "AI review completed"),
                    comments=comments,
                    score=review_data.get("score", 7.0),
                    suggestions=review_data.get("suggestions", []),
                    issues=review_data.get("issues", [])
                )
                
            except json.JSONDecodeError:
                return self._generate_fallback_review(pr_data, files)
                
        except Exception as e:
            logger.error(f"Error reviewing PR: {e}")
            return self._generate_fallback_review(pr_data, files)
    
    def _generate_fallback_review(self, pr_data: PRData, files: List[PRFile]) -> AIReview:
        """Generate fallback review when AI fails"""
        return AIReview(
            summary=f"Review of PR #{pr_data.number} - {pr_data.title}",
            comments=[],
            score=7.0,
            suggestions=["Consider adding more documentation", "Review for potential edge cases"],
            issues=[]
        )
    
    async def analyze_code_changes(self, files: List[PRFile]) -> Dict[str, Any]:
        """Analyze code changes for patterns and insights"""
        try:
            if not files:
                return {"analysis": "No files to analyze"}
            
            # Prepare file analysis context
            file_analysis = []
            for file in files:
                analysis = f"""
File: {file.filename}
Type: {self._get_file_type(file.filename)}
Changes: +{file.additions} -{file.deletions}
Status: {file.status}
"""
                file_analysis.append(analysis)
            
            context = "\n".join(file_analysis)
            
            prompt = f"""
Analyze these code changes and provide insights:

{context}

Please provide:
1. Change patterns and trends
2. Potential impact assessment
3. Risk factors
4. Testing recommendations
5. Performance considerations

Respond in JSON format:
{{
    "patterns": ["pattern1", "pattern2"],
    "impact": "high/medium/low",
    "risks": ["risk1", "risk2"],
    "testing_needs": ["test1", "test2"],
    "performance_notes": "performance considerations"
}}
"""
            
            messages = [
                {"role": "system", "content": "You are an expert software architect analyzing code changes for patterns, risks, and impact."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages)
            if response:
                try:
                    return json.loads(response)
                except json.JSONDecodeError:
                    pass
            
            return {"analysis": "Analysis completed", "impact": "medium"}
            
        except Exception as e:
            logger.error(f"Error analyzing code changes: {e}")
            return {"analysis": "Analysis failed", "error": str(e)}
    
    def _get_file_type(self, filename: str) -> str:
        """Determine file type from filename"""
        if filename.endswith(('.py', '.js', '.ts', '.java', '.cpp', '.c')):
            return "code"
        elif filename.endswith(('.md', '.txt', '.rst')):
            return "documentation"
        elif filename.endswith(('.yml', '.yaml', '.json', '.toml')):
            return "configuration"
        elif filename.endswith(('.test', '.spec', '_test')):
            return "test"
        else:
            return "other"
    
    async def suggest_reviewers(self, files: List[PRFile], team_members: List[str]) -> List[str]:
        """Suggest reviewers based on files changed"""
        try:
            if not files or not team_members:
                return []
            
            file_types = [self._get_file_type(f.filename) for f in files]
            file_context = f"Files: {', '.join([f.filename for f in files])}\nTypes: {', '.join(set(file_types))}"
            
            prompt = f"""
Based on these file changes, suggest the best reviewers from the team:

{file_context}

Team Members: {', '.join(team_members)}

Consider:
1. File types and technologies
2. Team member expertise
3. Code ownership patterns
4. Review workload balance

Suggest 2-3 reviewers. Respond with just the usernames separated by commas.
"""
            
            messages = [
                {"role": "system", "content": "You are an expert at matching code changes with appropriate reviewers based on expertise and workload."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages)
            if response:
                # Parse comma-separated usernames
                suggested = [name.strip() for name in response.split(',')]
                # Filter to only include actual team members
                return [name for name in suggested if name in team_members]
            
            return []
            
        except Exception as e:
            logger.error(f"Error suggesting reviewers: {e}")
            return []
