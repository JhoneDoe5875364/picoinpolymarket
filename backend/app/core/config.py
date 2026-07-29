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

    # ---- Sell (A2U close-out) economic guards ----
    # See docs/feedbacks/20260729_Sell_Attack_Analysis.ko.md V4/V6/V7.

    # V7: reject dust sells whose net payout would be below this, so a spammer
    # cannot drain on-chain fees with sub-cent payouts.
    SELL_MIN_NET_PAYOUT = float(os.getenv("SELL_MIN_NET_PAYOUT", "0.1"))
    # V7: also require at least this many shares per sell.
    SELL_MIN_SHARES = float(os.getenv("SELL_MIN_SHARES", "1"))
    # V7: per-user rate limit — at most this many sells within the window.
    SELL_RATE_MAX = int(os.getenv("SELL_RATE_MAX", "10"))
    SELL_RATE_WINDOW_SECONDS = int(os.getenv("SELL_RATE_WINDOW_SECONDS", "60"))

    # V4: a market must have at least this much liquidity before selling is
    # allowed, so a thin market cannot be pump-and-dumped against the app wallet.
    SELL_MIN_MARKET_LIQUIDITY = float(os.getenv("SELL_MIN_MARKET_LIQUIDITY", "0"))
    # V4/V6: a position bought less than this many seconds ago cannot be sold
    # (anti wash-trade / round-trip cooldown). 0 disables the cooldown.
    SELL_COOLDOWN_SECONDS = int(os.getenv("SELL_COOLDOWN_SECONDS", "0"))
