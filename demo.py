#!/usr/bin/env python3
"""
GitHub PR Automation Demo
This script demonstrates all the features of the automation system
"""

import asyncio
import os
import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Confirm, Prompt

from src.core.automation import GitHubPRAutomation
from src.utils.config import load_config, validate_config
from src.utils.logger import setup_logger

console = Console()
logger = setup_logger()

class AutomationDemo:
    """Demo class for showcasing automation features"""
    
    def __init__(self):
        self.automation = None
        self.config = None
    
    async def setup(self):
        """Setup the automation system"""
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Setting up automation...", total=None)
            
            try:
                # Load configuration
                self.config = load_config()
                
                # Validate configuration
                if not validate_config(self.config):
                    console.print("[red]❌ Configuration validation failed. Please check your .env file.[/red]")
                    return False
                
                # Initialize automation
                self.automation = GitHubPRAutomation(self.config)
                
                progress.update(task, completed=True)
                console.print("[green]✅ Automation system initialized successfully![/green]")
                return True
                
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Setup failed: {e}[/red]")
                return False
    
    async def show_status(self):
        """Show current system status"""
        console.print(Panel(
            "[blue]📊 System Status Check[/blue]",
            title="Status",
            border_style="blue"
        ))
        
        try:
            status = await self.automation.get_status()
            
            table = Table(title="System Status")
            table.add_column("Component", style="cyan")
            table.add_column("Status", style="green")
            table.add_column("Details", style="white")
            
            table.add_row("GitHub Repository", "✅ Connected", status.github_repo)
            table.add_row("Open PRs", "📋 Active", str(status.open_prs))
            table.add_row("Pending Reviews", "⏳ Waiting", str(status.pending_reviews))
            table.add_row("Google Sheets", "✅ Connected" if status.sheets_connected else "❌ Disconnected", "Tracking enabled")
            table.add_row("AI Model", "🤖 Ready", status.ai_model)
            table.add_row("Last Sync", "🔄 Updated", status.last_sync)
            
            console.print(table)
            
        except Exception as e:
            console.print(f"[red]❌ Error getting status: {e}[/red]")
    
    async def demo_pr_creation(self):
        """Demo PR creation with AI"""
        console.print(Panel(
            "[green]🚀 AI-Powered PR Creation Demo[/green]",
            title="PR Creation",
            border_style="green"
        ))
        
        # Get demo branch info
        branch_name = Prompt.ask("Enter branch name for demo", default="feature/demo")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Creating PR with AI...", total=None)
            
            try:
                result = await self.automation.create_pr(
                    branch=branch_name,
                    prompt="Create a PR for demonstrating the automation system"
                )
                
                progress.update(task, completed=True)
                
                if result.success:
                    console.print(Panel(
                        f"[green]✅ PR Created Successfully![/green]\n"
                        f"PR #{result.pr_number}: {result.title}\n"
                        f"URL: {result.url}\n"
                        f"Description: {result.description[:100]}...",
                        title="Success",
                        border_style="green"
                    ))
                else:
                    console.print(Panel(
                        f"[red]❌ PR Creation Failed[/red]\n{result.error}",
                        title="Error",
                        border_style="red"
                    ))
                    
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Error: {e}[/red]")
    
    async def demo_pr_review(self):
        """Demo AI-powered PR review"""
        console.print(Panel(
            "[blue]🔍 AI-Powered PR Review Demo[/blue]",
            title="PR Review",
            border_style="blue"
        ))
        
        pr_number = Prompt.ask("Enter PR number to review", default="1")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Reviewing PR with AI...", total=None)
            
            try:
                result = await self.automation.review_pr(int(pr_number), auto_comment=True)
                
                progress.update(task, completed=True)
                
                if result.success:
                    console.print(Panel(
                        f"[green]✅ PR Review Completed![/green]\n"
                        f"Reviewed: {result.reviewed_count} PR(s)\n"
                        f"Comments added: {result.comments_count}\n"
                        f"Summary: {result.review_summary}",
                        title="Success",
                        border_style="green"
                    ))
                else:
                    console.print(Panel(
                        f"[red]❌ PR Review Failed[/red]\n{result.error}",
                        title="Error",
                        border_style="red"
                    ))
                    
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Error: {e}[/red]")
    
    async def demo_approval_tracking(self):
        """Demo approval tracking"""
        console.print(Panel(
            "[yellow]📈 Approval Tracking Demo[/yellow]",
            title="Approval Tracking",
            border_style="yellow"
        ))
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Tracking approvals...", total=None)
            
            try:
                result = await self.automation.track_approvals(sync_sheet=True, update_status=True)
                
                progress.update(task, completed=True)
                
                if result.success:
                    console.print(Panel(
                        f"[green]✅ Approval Tracking Completed![/green]\n"
                        f"PRs tracked: {result.tracked_count}\n"
                        f"Sheets updated: {result.sheets_updated}",
                        title="Success",
                        border_style="green"
                    ))
                else:
                    console.print(Panel(
                        f"[red]❌ Approval Tracking Failed[/red]\n{result.error}",
                        title="Error",
                        border_style="red"
                    ))
                    
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Error: {e}[/red]")
    
    async def demo_automated_workflow(self):
        """Demo automated workflow"""
        console.print(Panel(
            "[magenta]🤖 Automated Workflow Demo[/magenta]",
            title="Automation",
            border_style="magenta"
        ))
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Running automated workflow...", total=None)
            
            try:
                result = await self.automation.run_single_workflow()
                
                progress.update(task, completed=True)
                
                if result.success:
                    console.print(Panel(
                        f"[green]✅ Workflow Completed![/green]\n"
                        f"Message: {result.message}\n"
                        f"Data: {result.data}",
                        title="Success",
                        border_style="green"
                    ))
                else:
                    console.print(Panel(
                        f"[red]❌ Workflow Failed[/red]\n{result.error}",
                        title="Error",
                        border_style="red"
                    ))
                    
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Error: {e}[/red]")
    
    async def demo_sheets_management(self):
        """Demo Google Sheets management"""
        console.print(Panel(
            "[cyan]📊 Google Sheets Management Demo[/cyan]",
            title="Sheets Management",
            border_style="cyan"
        ))
        
        action = Prompt.ask(
            "Choose action",
            choices=["setup", "sync", "clear"],
            default="setup"
        )
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task(f"Managing sheets: {action}...", total=None)
            
            try:
                result = await self.automation.manage_sheets(action)
                
                progress.update(task, completed=True)
                
                if result.success:
                    console.print(Panel(
                        f"[green]✅ Sheets {action} completed![/green]\n"
                        f"Action: {action}\n"
                        f"Details: {result.details}",
                        title="Success",
                        border_style="green"
                    ))
                else:
                    console.print(Panel(
                        f"[red]❌ Sheets {action} failed[/red]\n{result.error}",
                        title="Error",
                        border_style="red"
                    ))
                    
            except Exception as e:
                progress.update(task, completed=True)
                console.print(f"[red]❌ Error: {e}[/red]")
    
    async def run_full_demo(self):
        """Run the complete demo"""
        console.print(Panel(
            "[bold blue]🤖 GitHub PR Automation Demo[/bold blue]\n"
            "This demo showcases all features of the automation system",
            title="Welcome",
            border_style="blue"
        ))
        
        # Setup
        if not await self.setup():
            return
        
        # Show status
        await self.show_status()
        
        # Demo menu
        while True:
            console.print("\n[bold]Available Demos:[/bold]")
            console.print("1. 📊 Show System Status")
            console.print("2. 🚀 AI-Powered PR Creation")
            console.print("3. 🔍 AI-Powered PR Review")
            console.print("4. 📈 Approval Tracking")
            console.print("5. 🤖 Automated Workflow")
            console.print("6. 📊 Google Sheets Management")
            console.print("7. 🎯 Run All Demos")
            console.print("8. 🚪 Exit")
            
            choice = Prompt.ask("Choose a demo", choices=["1", "2", "3", "4", "5", "6", "7", "8"], default="1")
            
            if choice == "1":
                await self.show_status()
            elif choice == "2":
                await self.demo_pr_creation()
            elif choice == "3":
                await self.demo_pr_review()
            elif choice == "4":
                await self.demo_approval_tracking()
            elif choice == "5":
                await self.demo_automated_workflow()
            elif choice == "6":
                await self.demo_sheets_management()
            elif choice == "7":
                console.print("[yellow]Running all demos...[/yellow]")
                await self.show_status()
                await self.demo_pr_creation()
                await self.demo_pr_review()
                await self.demo_approval_tracking()
                await self.demo_automated_workflow()
                await self.demo_sheets_management()
            elif choice == "8":
                console.print("[green]Thanks for using the demo![/green]")
                break

async def main():
    """Main demo function"""
    demo = AutomationDemo()
    await demo.run_full_demo()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo interrupted by user[/yellow]")
    except Exception as e:
        console.print(f"[red]Demo failed: {e}[/red]")
        sys.exit(1)
