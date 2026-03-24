"""
Attestation System
User confirmation for regional restrictions
"""
from typing import Optional
from datetime import datetime
from app.core.logger import get_logger
from app.core.database import _conn
from psycopg2.extras import RealDictCursor

logger = get_logger()


class AttestationService:
    """Manages user attestations"""
    
    def create_attestation(
        self,
        user_id: str,
        ip: str,
        region_code: str,
        state_code: Optional[str],
        attestation_version: str = "1.0"
    ) -> bool:
        """
        Record user attestation
        Returns True if successful
        """
        try:
            with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO attestations 
                    (user_id, ip, region_code, state_code, attestation_version, timestamp)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (user_id, ip, region_code, state_code, attestation_version, datetime.utcnow())
                )
                conn.commit()
                logger.info(f"✅ Recorded attestation for user {user_id}")
                return True
        except Exception as e:
            logger.error(f"❌ Failed to record attestation: {e}")
            return False
    
    def get_latest_attestation(self, user_id: str) -> Optional[dict]:
        """Get user's latest attestation"""
        try:
            with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM attestations 
                    WHERE user_id = %s 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                    """,
                    (user_id,)
                )
                result = cur.fetchone()
                return dict(result) if result else None
        except Exception as e:
            logger.error(f"❌ Failed to get attestation: {e}")
            return None
    
    def has_valid_attestation(self, user_id: str) -> bool:
        """Check if user has a valid attestation"""
        attestation = self.get_latest_attestation(user_id)
        return attestation is not None


def get_attestation_service() -> AttestationService:
    """Get attestation service instance"""
    return AttestationService()
