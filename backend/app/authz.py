import os, json, urllib.request
from typing import Optional
from fastapi import Header, HTTPException

# Read Supabase settings from env (present via systemd drop-ins)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = (
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
)

def _validate_supabase_access_token(token: str) -> Optional[str]:
    """
    REAL validation: call Supabase Auth to validate the bearer token and
    return the user id ('id' field). Supabase verifies signature/expiry.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    url = SUPABASE_URL.rstrip("/") + "/auth/v1/user"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status != 200:
                return None
            data = json.loads(resp.read().decode("utf-8"))
            uid = data.get("id")
            return str(uid) if uid else None
    except Exception:
        return None

def resolve_user_id(authorization: str | None = Header(None)) -> str:
    """
    Require: Authorization: Bearer <supabase access token>
    Returns: the authenticated user's UUID from Supabase.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[7:].strip()
    uid = _validate_supabase_access_token(token)
    if uid:
        return uid
    raise HTTPException(status_code=401, detail="invalid or unsupported token")
