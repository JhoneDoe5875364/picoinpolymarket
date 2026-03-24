#!/usr/bin/env python
"""
GeoControl Database Migration Script
Run migrations for geocontrol system
"""
import sys
import asyncio
from pathlib import Path

# Add app to path (backend/bin -> backend -> app)
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.migrations import migrate_database


async def main():
    """Run migrations"""
    print("🔧 Running GeoControl Database Migrations...")
    success = await migrate_database()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
