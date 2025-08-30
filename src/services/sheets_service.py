"""
Google Sheets service for PR tracking
"""

import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.models.pr_models import SheetsRow, ApprovalInfo

logger = logging.getLogger(__name__)

@dataclass
class SheetsConfig:
    credentials_file: str
    spreadsheet_id: str
    worksheet_name: str = "PR Tracking"
    auto_sync: bool = True
    sync_interval: int = 300  # seconds

class GoogleSheetsService:
    """Service for Google Sheets operations"""
    
    def __init__(self, config: SheetsConfig):
        self.config = config
        self.service = None
        self.logger = logging.getLogger(__name__)
        self._setup_service()
    
    def _setup_service(self):
        """Setup Google Sheets API service"""
        try:
            # Load credentials
            credentials = Credentials.from_service_account_file(
                self.config.credentials_file,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            
            # Build service
            self.service = build('sheets', 'v4', credentials=credentials)
            self.logger.info("Google Sheets service initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Error setting up Google Sheets service: {e}")
            self.service = None
    
    async def test_connection(self) -> bool:
        """Test connection to Google Sheets"""
        try:
            if not self.service:
                return False
            
            # Try to read the spreadsheet
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A1"
            ).execute()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Google Sheets connection test failed: {e}")
            return False
    
    async def setup_worksheet(self) -> bool:
        """Setup the worksheet with headers"""
        try:
            if not self.service:
                return False
            
            headers = [
                "PR Number",
                "Title", 
                "Status",
                "Created Date",
                "Review Status",
                "Approvals",
                "Comments Count",
                "Last Updated"
            ]
            
            # Write headers
            self.service.spreadsheets().values().update(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A1:H1",
                valueInputOption="RAW",
                body={"values": [headers]}
            ).execute()
            
            # Format headers
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.config.spreadsheet_id,
                body={
                    "requests": [
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": self._get_sheet_id(),
                                    "startRowIndex": 0,
                                    "endRowIndex": 1,
                                    "startColumnIndex": 0,
                                    "endColumnIndex": 8
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "backgroundColor": {"red": 0.2, "green": 0.6, "blue": 0.9},
                                        "textFormat": {"bold": True, "foregroundColor": {"red": 1, "green": 1, "blue": 1}}
                                    }
                                },
                                "fields": "userEnteredFormat(backgroundColor,textFormat)"
                            }
                        }
                    ]
                }
            ).execute()
            
            self.logger.info("Worksheet setup completed")
            return True
            
        except Exception as e:
            self.logger.error(f"Error setting up worksheet: {e}")
            return False
    
    def _get_sheet_id(self) -> Optional[int]:
        """Get the sheet ID for the worksheet"""
        try:
            if not self.service:
                return None
            
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.config.spreadsheet_id
            ).execute()
            
            for sheet in spreadsheet['sheets']:
                if sheet['properties']['title'] == self.config.worksheet_name:
                    return sheet['properties']['sheetId']
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting sheet ID: {e}")
            return None
    
    async def add_pr_tracking(
        self,
        pr_number: int,
        title: str,
        status: str,
        created_date: str
    ) -> bool:
        """Add a new PR to tracking"""
        try:
            if not self.service:
                return False
            
            row_data = [
                pr_number,
                title,
                status,
                created_date,
                "pending",  # Review status
                "0/1",     # Approvals
                0,         # Comments count
                datetime.now().isoformat()  # Last updated
            ]
            
            # Find the next empty row
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A:A"
            ).execute()
            
            next_row = len(result.get('values', [])) + 1
            
            # Add the row
            self.service.spreadsheets().values().update(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A{next_row}:H{next_row}",
                valueInputOption="RAW",
                body={"values": [row_data]}
            ).execute()
            
            self.logger.info(f"Added PR #{pr_number} to tracking")
            return True
            
        except Exception as e:
            self.logger.error(f"Error adding PR tracking: {e}")
            return False
    
    async def update_pr_review_status(
        self,
        pr_number: int,
        review_status: str,
        comments_count: int
    ) -> bool:
        """Update PR review status"""
        try:
            if not self.service:
                return False
            
            # Find the PR row
            row_index = await self._find_pr_row(pr_number)
            if row_index is None:
                return False
            
            # Update review status and comments count
            updates = [
                {
                    "range": f"{self.config.worksheet_name}!E{row_index}",
                    "values": [[review_status]]
                },
                {
                    "range": f"{self.config.worksheet_name}!G{row_index}",
                    "values": [[comments_count]]
                },
                {
                    "range": f"{self.config.worksheet_name}!H{row_index}",
                    "values": [[datetime.now().isoformat()]]
                }
            ]
            
            for update in updates:
                self.service.spreadsheets().values().update(
                    spreadsheetId=self.config.spreadsheet_id,
                    range=update["range"],
                    valueInputOption="RAW",
                    body={"values": update["values"]}
                ).execute()
            
            self.logger.info(f"Updated PR #{pr_number} review status")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating PR review status: {e}")
            return False
    
    async def update_pr_approvals(
        self,
        pr_number: int,
        approvals: ApprovalInfo,
        status: str
    ) -> bool:
        """Update PR approval status"""
        try:
            if not self.service:
                return False
            
            # Find the PR row
            row_index = await self._find_pr_row(pr_number)
            if row_index is None:
                return False
            
            # Format approvals string
            approvals_str = f"{approvals.approved_reviews}/{approvals.required_reviews}"
            if approvals.approved:
                approvals_str += " ✅"
            
            # Update status and approvals
            updates = [
                {
                    "range": f"{self.config.worksheet_name}!C{row_index}",
                    "values": [[status]]
                },
                {
                    "range": f"{self.config.worksheet_name}!F{row_index}",
                    "values": [[approvals_str]]
                },
                {
                    "range": f"{self.config.worksheet_name}!H{row_index}",
                    "values": [[datetime.now().isoformat()]]
                }
            ]
            
            for update in updates:
                self.service.spreadsheets().values().update(
                    spreadsheetId=self.config.spreadsheet_id,
                    range=update["range"],
                    valueInputOption="RAW",
                    body={"values": update["values"]}
                ).execute()
            
            self.logger.info(f"Updated PR #{pr_number} approvals")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating PR approvals: {e}")
            return False
    
    async def _find_pr_row(self, pr_number: int) -> Optional[int]:
        """Find the row index for a PR number"""
        try:
            if not self.service:
                return None
            
            # Get all PR numbers
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A:A"
            ).execute()
            
            values = result.get('values', [])
            for i, row in enumerate(values):
                if row and str(row[0]) == str(pr_number):
                    return i + 1  # Convert to 1-based index
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error finding PR row: {e}")
            return None
    
    async def get_all_tracking_data(self) -> List[SheetsRow]:
        """Get all PR tracking data"""
        try:
            if not self.service:
                return []
            
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A:H"
            ).execute()
            
            values = result.get('values', [])
            if len(values) < 2:  # No data rows
                return []
            
            # Skip header row
            rows = []
            for row in values[1:]:
                if len(row) >= 8:
                    rows.append(SheetsRow(
                        pr_number=int(row[0]) if row[0] else 0,
                        title=row[1] if len(row) > 1 else "",
                        status=row[2] if len(row) > 2 else "",
                        created_date=row[3] if len(row) > 3 else "",
                        review_status=row[4] if len(row) > 4 else "",
                        approvals=row[5] if len(row) > 5 else "",
                        comments_count=int(row[6]) if len(row) > 6 and row[6] else 0,
                        last_updated=row[7] if len(row) > 7 else ""
                    ))
            
            return rows
            
        except Exception as e:
            self.logger.error(f"Error getting tracking data: {e}")
            return []
    
    async def sync_all_data(self) -> bool:
        """Sync all data from GitHub to Google Sheets"""
        try:
            # This would typically sync data from GitHub
            # For now, we'll just log the sync
            self.logger.info("Syncing all data to Google Sheets")
            return True
            
        except Exception as e:
            self.logger.error(f"Error syncing data: {e}")
            return False
    
    async def clear_all_data(self) -> bool:
        """Clear all data from the worksheet"""
        try:
            if not self.service:
                return False
            
            # Clear all data except headers
            self.service.spreadsheets().values().clear(
                spreadsheetId=self.config.spreadsheet_id,
                range=f"{self.config.worksheet_name}!A2:H"
            ).execute()
            
            self.logger.info("Cleared all tracking data")
            return True
            
        except Exception as e:
            self.logger.error(f"Error clearing data: {e}")
            return False
    
    async def get_pr_statistics(self) -> Dict[str, Any]:
        """Get PR statistics from the tracking sheet"""
        try:
            rows = await self.get_all_tracking_data()
            
            if not rows:
                return {
                    "total_prs": 0,
                    "open_prs": 0,
                    "closed_prs": 0,
                    "approved_prs": 0,
                    "pending_reviews": 0
                }
            
            total_prs = len(rows)
            open_prs = len([r for r in rows if r.status == "open"])
            closed_prs = len([r for r in rows if r.status == "closed"])
            approved_prs = len([r for r in rows if "✅" in r.approvals])
            pending_reviews = len([r for r in rows if r.review_status == "pending"])
            
            return {
                "total_prs": total_prs,
                "open_prs": open_prs,
                "closed_prs": closed_prs,
                "approved_prs": approved_prs,
                "pending_reviews": pending_reviews,
                "approval_rate": (approved_prs / total_prs * 100) if total_prs > 0 else 0
            }
            
        except Exception as e:
            self.logger.error(f"Error getting PR statistics: {e}")
            return {
                "total_prs": 0,
                "open_prs": 0,
                "closed_prs": 0,
                "approved_prs": 0,
                "pending_reviews": 0,
                "approval_rate": 0
            }
    
    async def export_to_csv(self, filename: str) -> bool:
        """Export tracking data to CSV"""
        try:
            rows = await self.get_all_tracking_data()
            
            import csv
            with open(filename, 'w', newline='') as csvfile:
                fieldnames = [
                    'PR Number', 'Title', 'Status', 'Created Date',
                    'Review Status', 'Approvals', 'Comments Count', 'Last Updated'
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for row in rows:
                    writer.writerow({
                        'PR Number': row.pr_number,
                        'Title': row.title,
                        'Status': row.status,
                        'Created Date': row.created_date,
                        'Review Status': row.review_status,
                        'Approvals': row.approvals,
                        'Comments Count': row.comments_count,
                        'Last Updated': row.last_updated
                    })
            
            self.logger.info(f"Exported data to {filename}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error exporting to CSV: {e}")
            return False
