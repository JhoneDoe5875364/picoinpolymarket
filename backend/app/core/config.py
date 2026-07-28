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

    # ---- A2U (app-to-user) automatic payouts ----
    # Secret seed (starts with "S") of the app wallet that SENDS payouts. This is
    # highly sensitive: anyone with it controls the wallet. Auto-pay stays OFF
    # unless this is set. Leave empty to force manual payouts only.
    PI_APP_WALLET_SECRET_SEED = (os.getenv("PI_APP_WALLET_SECRET_SEED") or "").strip()
    # "Pi Network" (mainnet) or "Pi Testnet". Must match the wallet's network.
    PI_NETWORK = (os.getenv("PI_NETWORK") or "Pi Testnet").strip()

    @classmethod
    def a2u_enabled(cls) -> bool:
        return bool(cls.PI_APP_WALLET_SECRET_SEED)
