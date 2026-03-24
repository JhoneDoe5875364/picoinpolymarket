"""
Category Rules Engine
Determines if a category is allowed/restricted/blocked for a region/state
"""
from typing import Dict, Optional
from dataclasses import dataclass
from app.core.config_loader import get_geo_config
from app.core.logger import get_logger

logger = get_logger()


@dataclass
class CategoryResult:
    """Result of category access check"""
    allowed: bool
    reason: str  # Description of why it was allowed/blocked


class CategoryEngine:
    """Evaluates category access rules"""
    
    def __init__(self):
        self.config = get_geo_config()
    
    def check_category_access(
        self,
        region_code: str,
        category_key: str,
        state_code: Optional[str] = None
    ) -> CategoryResult:
        """
        Check if category is accessible in region/state
        
        Evaluation order:
        1. Global block
        2. Region-level block
        3. Region-level restriction
        4. State override (if applicable)
        5. Default allow
        """
        category = self.config.get_category(category_key)
        
        if not category:
            return CategoryResult(
                allowed=False,
                reason=f"Category '{category_key}' not found in configuration"
            )
        
        # 1. Check global block
        if category.get('global_block', False):
            return CategoryResult(
                allowed=False,
                reason="Category is globally blocked"
            )
        
        # 2. Check region-level block
        blocked_regions = category.get('blocked_regions', [])
        if region_code in blocked_regions:
            return CategoryResult(
                allowed=False,
                reason=f"Category is blocked in region {region_code}"
            )
        
        # 4. Check state overrides (before region restrictions)
        state_overrides = category.get('state_overrides', {})
        if state_code and region_code in state_overrides:
            region_override = state_overrides[region_code]
            
            blocked_states = region_override.get('blocked_states', [])
            if state_code in blocked_states:
                return CategoryResult(
                    allowed=False,
                    reason=f"Category is blocked in {region_code}/{state_code}"
                )
            
            allowed_states = region_override.get('allowed_states', [])
            if allowed_states and state_code in allowed_states:
                return CategoryResult(
                    allowed=True,
                    reason=f"Category is allowed in {region_code}/{state_code} by state override"
                )
            
            restricted_states = region_override.get('restricted_states', [])
            if state_code in restricted_states:
                return CategoryResult(
                    allowed=False,
                    reason=f"Category is restricted in {region_code}/{state_code}"
                )
        
        # 3. Check region-level restriction
        restricted_regions = category.get('restricted_regions', [])
        if region_code in restricted_regions:
            return CategoryResult(
                allowed=False,
                reason=f"Category is restricted in region {region_code}"
            )
        
        # 5. Check allowed regions (whitelist if specified)
        allowed_regions = category.get('allowed_regions', [])
        if allowed_regions and region_code not in allowed_regions:
            return CategoryResult(
                allowed=False,
                reason=f"Category is not allowed in region {region_code}"
            )
        
        # 6. Default allow
        return CategoryResult(
            allowed=True,
            reason=f"Category is allowed in region {region_code}"
        )
    
    def is_category_allowed(
        self,
        region_code: str,
        category_key: str,
        state_code: Optional[str] = None
    ) -> bool:
        """Quick check if category is allowed"""
        result = self.check_category_access(region_code, category_key, state_code)
        return result.allowed


def get_category_engine() -> CategoryEngine:
    """Get category engine instance"""
    return CategoryEngine()
