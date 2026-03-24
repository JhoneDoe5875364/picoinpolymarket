"""
Tier Engine Module
Maps region codes to tier levels and determines allowed/blocked categories
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from app.core.config_loader import get_geo_config
from app.core.logger import get_logger

logger = get_logger()


class TierEngine:
    """Determines tier and category access based on JSON config"""

    def __init__(self):
        self.config = get_geo_config()

    def get_tier_for_region(self, region_code: str) -> str:
        """
        Determine which tier a region belongs to.
        Defaults to full block if region is UNKNOWN.
        """
        if not region_code or region_code == "UNKNOWN":
            # logger.warning(f"!! Unknown region code '{region_code}', defaulting to tier1 (full block)")
            return "tier1"   # JSON spec: tier1 = full block
        
        full_block_regions = self.config.get_tiers_full_block_regions()
        restricted_regions = self.config.get_tiers_restricted_regions()
        allowed_default = self.config.get_tiers_allowed_default()
        
        if region_code in full_block_regions or not allowed_default:
            return "tier1"
        
        if region_code in restricted_regions:
            return "tier2"
        
        return "tier3"

    def get_category_access(self, region_code: str) -> dict:
        """
        Returns category permissions based on tier's access level.
        In JSON structure:
        
        tier1 → full_block
        tier2 → restricted
        tier3 → allowed
        """
        tier_key = self.get_tier_for_region(region_code)

        categories = self.config.get_categories()  # assumed externally defined

        all_categories = list(categories.keys())

        # Category mapping per JSON rules
        if tier_key == "tier1":
            return {
                "allowed": [],
                "restricted": [],
                "blocked": all_categories
            }
        elif tier_key == "tier2":
            # JSON spec doesn’t define per-category rules,
            # so treat all as “restricted” for now.
            return {
                "allowed": [],
                "restricted": all_categories,
                "blocked": []
            }
        else:
            # FULL access
            return {
                "allowed": all_categories,
                "restricted": [],
                "blocked": []
            }

    def get_allowed_categories(self, region_code: str) -> List[str]:
        return self.get_category_access(region_code)["allowed"]

    def get_restricted_categories(self, region_code: str) -> List[str]:
        return self.get_category_access(region_code)["restricted"]

    def get_blocked_categories(self, region_code: str) -> List[str]:
        return self.get_category_access(region_code)["blocked"]


def get_tier_engine() -> TierEngine:
    return TierEngine()
