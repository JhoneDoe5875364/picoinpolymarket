"""
GeoControl Configuration Loader (Updated for tier1/tier2/tier3 JSON format)
"""
import json
import os
from typing import Dict, Any, Optional
from app.core.logger import get_logger

logger = get_logger()


class GeoControlConfig:
    """Singleton configuration loader for geocontrol system"""

    _instance: Optional['GeoControlConfig'] = None
    _config: Optional[Dict[str, Any]] = None

    def __new__(cls) -> 'GeoControlConfig':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._config is None:
            self._load_config()

    def _load_config(self) -> None:
        """Load configuration from geocontrol.json"""
        config_path = os.getenv(
            "GEOCONTROL_CONFIG_PATH",
            os.path.join(os.path.dirname(__file__), "..", "..", "config", "geocontrol.json")
        )

        try:
            with open(config_path, 'r') as f:
                self._config = json.load(f)
            logger.info(f"✅ Loaded geocontrol config from {config_path}")
        except FileNotFoundError:
            logger.error(f"❌ geocontrol.json not found at {config_path}")
            self._config = self._default_config()
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in geocontrol.json: {e}")
            self._config = self._default_config()

    @staticmethod
    def _default_config() -> Dict[str, Any]:
        """Return default safe configuration for new tier format"""
        return {
            "tiers": {
                "full_block": [],
                "restricted": [],
                "allowed_default": False
            },
            "categories": {}
        }

    def get_config(self) -> Dict[str, Any]:
        return self._config

    def get_tiers(self) -> Dict[str, Any]:
        return self._config.get("tiers", {})
    
    def get_tiers_allowed_default(self) -> Dict[str, Any]:
        return self._config.get("tiers", {}).get("allowed_default", False)
    
    def get_tiers_full_block_regions(self) -> Dict[str, Any]:
        return self._config.get("tiers", {}).get("full_block", [])
    
    def get_tiers_restricted_regions(self) -> Dict[str, Any]:
        return self._config.get("tiers", {}).get("restricted", [])

    def get_categories(self) -> Dict[str, Any]:
        return self._config.get("categories", {})

    def get_category(self, category_key: str) -> Dict[str, Any]:
        return self.get_categories().get(category_key, {})

    def get_tier_entry(self, tier_key: str) -> Dict[str, Any]:
        """Get full tier object (name, description, access_level, regions)"""
        return self.get_tiers().get(tier_key, {})

    def reload_config(self) -> None:
        self._config = None
        self._load_config()
        logger.info("🔄 GeoControl configuration reloaded")


def get_geo_config() -> GeoControlConfig:
    return GeoControlConfig()
