#!/usr/bin/env python3
"""
GitHub PR Automation with Groq AI
Main entry point for the automation system
"""

import typer
import asyncio
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.text import Text

from src.core.automation import GitHubPRAutomation
from src.utils.config import load_config

app = typer.Typer(help="GitHub PR Automation with Groq AI")
console = Console()

@app.command()
def create_pr(
    branch: str = typer.Option(..., "--branch", "-b", help="Branch name for the PR"),
    title: str = typer.Option(None, "--title", "-t", help="PR title (optional, AI will generate if not provided)"),
    prompt: str = typer.Option(None, "--prompt", "-p", help="Custom AI prompt for PR creation"),
    base_branch: str = typer.Option("main", "--base", help="Base branch for the PR"),
    auto_merge: bool = typer.Option(False, "--auto-merge", help="Enable auto-merge if approved")
):
    """Create a new Pull Request with AI assistance"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Creating PR with AI...", total=None)
        
        try:
            config = load_config()
            automation = GitHubPRAutomation(config)
            
            # Run the PR creation
            result = asyncio.run(automation.create_pr(
                branch=branch,
                title=title,
                prompt=prompt,
                base_branch=base_branch,
                auto_merge=auto_merge
            ))
            
            progress.update(task, completed=True)
            
            if result.success:
                console.print(Panel(
                    f"[green]✅ PR Created Successfully![/green]\n"
                    f"PR #{result.pr_number}: {result.title}\n"
                    f"URL: {result.url}",
                    title="Success",
                    border_style="green"
                ))
            else:
                console.print(Panel(
                    f"[red]❌ Failed to create PR[/red]\n{result.error}",
                    title="Error",
                    border_style="red"
                ))
                
        except Exception as e:
            progress.update(task, completed=True)
            console.print(Panel(
                f"[red]❌ Error: {str(e)}[/red]",
                title="Error",
                border_style="red"
            ))

@app.command()
def review_prs(
    pr_number: int = typer.Option(None, "--pr-number", "-n", help="Specific PR number to review"),
    all_open: bool = typer.Option(False, "--all", "-a", help="Review all open PRs"),
    auto_comment: bool = typer.Option(True, "--auto-comment", help="Automatically add AI comments")
):
    """Review Pull Requests with AI"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Reviewing PRs with AI...", total=None)
        
        try:
            config = load_config()
            automation = GitHubPRAutomation(config)
            
            if pr_number:
                progress.update(task, description=f"Reviewing PR #{pr_number}...")
                result = asyncio.run(automation.review_pr(pr_number, auto_comment))
            elif all_open:
                progress.update(task, description="Reviewing all open PRs...")
                result = asyncio.run(automation.review_all_open_prs(auto_comment))
            else:
                console.print("[yellow]Please specify --pr-number or --all[/yellow]")
                return
            
            progress.update(task, completed=True)
            
            if result.success:
                console.print(Panel(
                    f"[green]✅ PR Review Completed![/green]\n"
                    f"Reviewed: {result.reviewed_count} PR(s)\n"
                    f"Comments added: {result.comments_count}",
                    title="Success",
                    border_style="green"
                ))
            else:
                console.print(Panel(
                    f"[red]❌ Review failed[/red]\n{result.error}",
                    title="Error",
                    border_style="red"
                ))
                
        except Exception as e:
            progress.update(task, completed=True)
            console.print(Panel(
                f"[red]❌ Error: {str(e)}[/red]",
                title="Error",
                border_style="red"
            ))

@app.command()
def track_approvals(
    sync_sheet: bool = typer.Option(True, "--sync", help="Sync with Google Sheets"),
    update_status: bool = typer.Option(True, "--update", help="Update PR status")
):
    """Track PR approvals and sync with Google Sheets"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Tracking approvals...", total=None)
        
        try:
            config = load_config()
            automation = GitHubPRAutomation(config)
            
            result = asyncio.run(automation.track_approvals(sync_sheet, update_status))
            
            progress.update(task, completed=True)
            
            if result.success:
                console.print(Panel(
                    f"[green]✅ Approval tracking completed![/green]\n"
                    f"PRs tracked: {result.tracked_count}\n"
                    f"Sheets updated: {result.sheets_updated}",
                    title="Success",
                    border_style="green"
                ))
            else:
                console.print(Panel(
                    f"[red]❌ Tracking failed[/red]\n{result.error}",
                    title="Error",
                    border_style="red"
                ))
                
        except Exception as e:
            progress.update(task, completed=True)
            console.print(Panel(
                f"[red]❌ Error: {str(e)}[/red]",
                title="Error",
                border_style="red"
            ))

@app.command()
def auto_workflow(
    interval: int = typer.Option(3600, "--interval", "-i", help="Check interval in seconds"),
    continuous: bool = typer.Option(False, "--continuous", "-c", help="Run continuously")
):
    """Run automated workflow for PR management"""
    console.print(Panel(
        "[blue]🤖 Starting Automated PR Workflow[/blue]\n"
        f"Check interval: {interval} seconds\n"
        f"Continuous mode: {'Yes' if continuous else 'No'}",
        title="Automation Started",
        border_style="blue"
    ))
    
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        if continuous:
            asyncio.run(automation.run_continuous_workflow(interval))
        else:
            asyncio.run(automation.run_single_workflow())
            
    except KeyboardInterrupt:
        console.print("\n[yellow]🛑 Automation stopped by user[/yellow]")
    except Exception as e:
        console.print(Panel(
            f"[red]❌ Error: {str(e)}[/red]",
            title="Error",
            border_style="red"
        ))

@app.command()
def update_sheet(
    action: str = typer.Option("sync", "--action", "-a", help="Action: sync, clear, setup")
):
    """Manage Google Sheets tracking"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task(f"Updating sheet: {action}...", total=None)
        
        try:
            config = load_config()
            automation = GitHubPRAutomation(config)
            
            result = asyncio.run(automation.manage_sheets(action))
            
            progress.update(task, completed=True)
            
            if result.success:
                console.print(Panel(
                    f"[green]✅ Sheet {action} completed![/green]\n"
                    f"Action: {action}\n"
                    f"Details: {result.details}",
                    title="Success",
                    border_style="green"
                ))
            else:
                console.print(Panel(
                    f"[red]❌ Sheet {action} failed[/red]\n{result.error}",
                    title="Error",
                    border_style="red"
                ))
                
        except Exception as e:
            progress.update(task, completed=True)
            console.print(Panel(
                f"[red]❌ Error: {str(e)}[/red]",
                title="Error",
                border_style="red"
            ))

@app.command()
def status():
    """Show current system status"""
    try:
        config = load_config()
        automation = GitHubPRAutomation(config)
        
        status_info = asyncio.run(automation.get_status())
        
        console.print(Panel(
            f"[blue]📊 System Status[/blue]\n\n"
            f"GitHub Repo: {status_info.github_repo}\n"
            f"Open PRs: {status_info.open_prs}\n"
            f"Pending Reviews: {status_info.pending_reviews}\n"
            f"Sheets Connected: {'✅' if status_info.sheets_connected else '❌'}\n"
            f"AI Model: {status_info.ai_model}\n"
            f"Last Sync: {status_info.last_sync}",
            title="Status",
            border_style="blue"
        ))
        
    except Exception as e:
        console.print(Panel(
            f"[red]❌ Error getting status: {str(e)}[/red]",
            title="Error",
            border_style="red"
        ))

@app.command()
def setup():
    """Setup environment configuration"""
    try:
        from src.utils.config import save_env_template, create_sample_env
        
        # Create .env template
        if save_env_template(".env"):
            console.print(Panel(
                "[green]✅ .env template created successfully![/green]\n\n"
                "Please edit the .env file with your actual configuration values:\n"
                "- GITHUB_TOKEN: Your GitHub personal access token\n"
                "- GROQ_API_KEY: Your Groq API key\n"
                "- GOOGLE_SHEETS_CREDENTIALS_FILE: Path to your Google Sheets credentials\n"
                "- GOOGLE_SHEETS_SPREADSHEET_ID: Your Google Sheets ID",
                title="Setup Complete",
                border_style="green"
            ))
        else:
            console.print(Panel(
                "[red]❌ Failed to create .env template[/red]",
                title="Error",
                border_style="red"
            ))
            
    except Exception as e:
        console.print(Panel(
            f"[red]❌ Error during setup: {str(e)}[/red]",
            title="Error",
            border_style="red"
        ))

if __name__ == "__main__":
    app()
