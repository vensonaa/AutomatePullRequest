"""
Database service for persisting AI reviews and related data
"""

import aiosqlite
import logging
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path

from src.models.pr_models import AIReview, PRComment, PRData, PRFile

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for database operations with async SQLite"""
    
    def __init__(self, db_path: str = "data/ai_reviews.db"):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        self._ensure_data_directory()
    
    def _ensure_data_directory(self):
        """Ensure the data directory exists"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Initialize the database with required tables"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Create AI reviews table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS ai_reviews (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pr_number INTEGER NOT NULL,
                        pr_title TEXT NOT NULL,
                        pr_author TEXT NOT NULL,
                        review_summary TEXT NOT NULL,
                        review_score REAL NOT NULL,
                        review_suggestions TEXT NOT NULL,
                        review_issues TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(pr_number)
                    )
                """)
                
                # Create AI review comments table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS ai_review_comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        review_id INTEGER NOT NULL,
                        comment_body TEXT NOT NULL,
                        file_path TEXT,
                        line_number INTEGER,
                        position INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (review_id) REFERENCES ai_reviews (id) ON DELETE CASCADE
                    )
                """)
                
                # Create PR files table for tracking reviewed files
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS pr_files (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        review_id INTEGER NOT NULL,
                        filename TEXT NOT NULL,
                        status TEXT NOT NULL,
                        additions INTEGER NOT NULL,
                        deletions INTEGER NOT NULL,
                        changes INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (review_id) REFERENCES ai_reviews (id) ON DELETE CASCADE
                    )
                """)
                
                # Create review metadata table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS review_metadata (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        review_id INTEGER NOT NULL,
                        ai_model TEXT NOT NULL,
                        processing_time_ms INTEGER,
                        tokens_used INTEGER,
                        cost_estimate REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (review_id) REFERENCES ai_reviews (id) ON DELETE CASCADE
                    )
                """)
                
                await db.commit()
                self.logger.info("Database initialized successfully")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
            raise
    
    async def save_ai_review(
        self,
        pr_data: PRData,
        review: AIReview,
        files: List[PRFile],
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """Save an AI review to the database"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Insert main review record
                cursor = await db.execute("""
                    INSERT OR REPLACE INTO ai_reviews 
                    (pr_number, pr_title, pr_author, review_summary, review_score, 
                     review_suggestions, review_issues, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pr_data.number,
                    pr_data.title,
                    pr_data.author,
                    review.summary,
                    review.score,
                    json.dumps(review.suggestions),
                    json.dumps(review.issues),
                    datetime.now().isoformat()
                ))
                
                review_id = cursor.lastrowid
                
                # Insert comments
                for comment in review.comments:
                    await db.execute("""
                        INSERT INTO ai_review_comments 
                        (review_id, comment_body, file_path, line_number, position)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        review_id,
                        comment.body,
                        comment.path,
                        comment.line,
                        comment.position
                    ))
                
                # Insert PR files
                for file in files:
                    await db.execute("""
                        INSERT INTO pr_files 
                        (review_id, filename, status, additions, deletions, changes)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        review_id,
                        file.filename,
                        file.status,
                        file.additions,
                        file.deletions,
                        file.changes
                    ))
                
                # Insert metadata if provided
                if metadata:
                    await db.execute("""
                        INSERT INTO review_metadata 
                        (review_id, ai_model, processing_time_ms, tokens_used, cost_estimate)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        review_id,
                        metadata.get('ai_model', 'unknown'),
                        metadata.get('processing_time_ms'),
                        metadata.get('tokens_used'),
                        metadata.get('cost_estimate')
                    ))
                
                await db.commit()
                self.logger.info(f"Saved AI review for PR #{pr_data.number}")
                return review_id
                
        except Exception as e:
            self.logger.error(f"Error saving AI review: {e}")
            raise
    
    async def get_ai_review(self, pr_number: int) -> Optional[Dict[str, Any]]:
        """Get an AI review by PR number"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                
                # Get main review
                cursor = await db.execute("""
                    SELECT * FROM ai_reviews WHERE pr_number = ?
                """, (pr_number,))
                review_row = await cursor.fetchone()
                
                if not review_row:
                    return None
                
                # Get comments
                cursor = await db.execute("""
                    SELECT * FROM ai_review_comments WHERE review_id = ?
                    ORDER BY line_number, position
                """, (review_row['id'],))
                comment_rows = await cursor.fetchall()
                
                # Get files
                cursor = await db.execute("""
                    SELECT * FROM pr_files WHERE review_id = ?
                """, (review_row['id'],))
                file_rows = await cursor.fetchall()
                
                # Get metadata
                cursor = await db.execute("""
                    SELECT * FROM review_metadata WHERE review_id = ?
                """, (review_row['id'],))
                metadata_row = await cursor.fetchone()
                
                return {
                    'review': dict(review_row),
                    'comments': [dict(row) for row in comment_rows],
                    'files': [dict(row) for row in file_rows],
                    'metadata': dict(metadata_row) if metadata_row else None
                }
                
        except Exception as e:
            self.logger.error(f"Error getting AI review: {e}")
            return None
    
    async def get_all_ai_reviews(
        self,
        limit: int = 100,
        offset: int = 0,
        author: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all AI reviews with optional filtering"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                
                query = "SELECT * FROM ai_reviews"
                params = []
                
                if author:
                    query += " WHERE pr_author = ?"
                    params.append(author)
                
                query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            self.logger.error(f"Error getting AI reviews: {e}")
            return []
    
    async def delete_ai_review(self, pr_number: int) -> bool:
        """Delete an AI review by PR number"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute("""
                    DELETE FROM ai_reviews WHERE pr_number = ?
                """, (pr_number,))
                
                await db.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            self.logger.error(f"Error deleting AI review: {e}")
            return False
    
    async def get_review_statistics(self) -> Dict[str, Any]:
        """Get statistics about AI reviews"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                
                # Total reviews
                cursor = await db.execute("SELECT COUNT(*) as count FROM ai_reviews")
                total_reviews = (await cursor.fetchone())['count']
                
                # Average score
                cursor = await db.execute("SELECT AVG(review_score) as avg_score FROM ai_reviews")
                avg_score = (await cursor.fetchone())['avg_score']
                
                # Reviews by author
                cursor = await db.execute("""
                    SELECT pr_author, COUNT(*) as count 
                    FROM ai_reviews 
                    GROUP BY pr_author 
                    ORDER BY count DESC
                """)
                reviews_by_author = [dict(row) for row in await cursor.fetchall()]
                
                # Recent reviews (last 7 days)
                cursor = await db.execute("""
                    SELECT COUNT(*) as count 
                    FROM ai_reviews 
                    WHERE created_at >= datetime('now', '-7 days')
                """)
                recent_reviews = (await cursor.fetchone())['count']
                
                return {
                    'total_reviews': total_reviews,
                    'average_score': round(avg_score, 2) if avg_score else 0,
                    'reviews_by_author': reviews_by_author,
                    'recent_reviews': recent_reviews
                }
                
        except Exception as e:
            self.logger.error(f"Error getting review statistics: {e}")
            return {}
    
    async def search_reviews(
        self,
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search AI reviews by content"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                
                cursor = await db.execute("""
                    SELECT * FROM ai_reviews 
                    WHERE pr_title LIKE ? OR review_summary LIKE ?
                    ORDER BY created_at DESC LIMIT ?
                """, (f'%{query}%', f'%{query}%', limit))
                
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
                
        except Exception as e:
            self.logger.error(f"Error searching reviews: {e}")
            return []
