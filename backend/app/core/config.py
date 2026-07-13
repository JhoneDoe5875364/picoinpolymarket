import os


class Config:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
    SPREAD = 0.01
    FEE_RATE = 0.02
    NONCE_EXPIRY_SECONDS = 300
    PI_API_BASE = "https://api.minepi.com"
    PI_ME_URL = "https://api.minepi.com/v2/me"

    # Wallet that receives U2A payments. It is chosen in the Pi Developer Portal
    # ("Connect Wallet"), not here — `createPayment` takes no `to_address`. We keep
    # a copy so the server can check a payment actually landed in our wallet.
    # Leave empty to skip only that one check.
    PI_APP_WALLET_ADDRESS = (os.getenv("PI_APP_WALLET_ADDRESS") or "").strip()

    # Tolerance, in Pi, when comparing a Pi-reported amount to our computed total.
    PAYMENT_AMOUNT_TOLERANCE = "0.0001"
