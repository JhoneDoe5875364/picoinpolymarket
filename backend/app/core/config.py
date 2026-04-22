import os


class Config:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
    SPREAD = 0.01
    FEE_RATE = 0.02
    NONCE_EXPIRY_SECONDS = 300
    PI_API_BASE = "https://api.minepi.com"
    PI_ME_URL = "https://api.minepi.com/v2/me"
