"""
Compliance Logging System
Records all geocontrol enforcement events
"""
from typing import Optional, Dict, Any
from datetime import datetime
from app.core.logger import get_logger
from app.core.database import _conn
from psycopg2.extras import RealDictCursor

logger = get_logger()


class ComplianceLogger:
    """Logs compliance events to database"""
    
    def log_event(
        self,
        user_id: Optional[str],
        ip: str,
        region_code: str,
        state_code: Optional[str],
        tier: str,
        category_key: Optional[str],
        action_type: str,  # 'registration', 'login', 'access', 'participation', etc.
        result: str,  # 'allowed', 'blocked', 'restricted'
        reason: str
    ) -> None:
        """Log a compliance event"""
        try:
            with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO compliance_logs 
                    (user_id, ip, region_code, state_code, tier, category_key, action_type, result, reason, timestamp)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (user_id, ip, region_code, state_code, tier, category_key, action_type, result, reason, datetime.utcnow())
                )
                conn.commit()
                # logger.info(f"✅ Logged compliance event: {action_type} - {result}")
        except Exception as e:
            logger.error(f"❌ Failed to log compliance event: {e}")
    
    def log_access_blocked(
        self,
        ip: str,
        region_code: str,
        reason: str,
        user_id: Optional[str] = None,
        state_code: Optional[str] = None,
        category_key: Optional[str] = None
    ) -> None:
        """Log blocked access attempt"""
        self.log_event(
            user_id=user_id,
            ip=ip,
            region_code=region_code,
            state_code=state_code,
            tier='full_block',
            category_key=category_key,
            action_type='access_attempt',
            result='blocked',
            reason=reason
        )
    
    def log_category_restriction(
        self,
        user_id: Optional[str],
        ip: str,
        region_code: str,
        category_key: str,
        reason: str,
        state_code: Optional[str] = None
    ) -> None:
        """Log category access restriction"""
        self.log_event(
            user_id=user_id,
            ip=ip,
            region_code=region_code,
            state_code=state_code,
            tier='unknown',
            category_key=category_key,
            action_type='category_access',
            result='restricted',
            reason=reason
        )


def get_compliance_logger() -> ComplianceLogger:
    """Get compliance logger instance"""
    return ComplianceLogger()
