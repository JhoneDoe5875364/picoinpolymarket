import os
from typing import Optional
from urllib.parse import quote


def _dsn_from_pg_env() -> Optional[str]:
    """
    Build ``postgresql://...`` from ``PGHOST``, ``PGPORT``, ``PGDATABASE``,
    ``PGUSER``, ``PGPASSWORD``, and optional ``PGSSLMODE`` (query param).
    Used when ``DATABASE_URL`` and similar URL env vars are unset.
    """
    host = (os.getenv("PGHOST") or "").strip()
    database = (os.getenv("PGDATABASE") or "").strip()
    user = (os.getenv("PGUSER") or "").strip()
    if not host or not database or not user:
        return None
    port = (os.getenv("PGPORT") or "5432").strip()
    password = os.getenv("PGPASSWORD")
    if password is None:
        password = ""
    user_enc = quote(user, safe="")
    pass_enc = quote(password, safe="")
    db_enc = quote(database, safe="")
    base = f"postgresql://{user_enc}:{pass_enc}@{host}:{port}/{db_enc}"
    sslmode = (os.getenv("PGSSLMODE") or "").strip()
    if sslmode:
        base += f"?sslmode={quote(sslmode, safe='')}"
    return base


def _first_url(*candidates: Optional[str]) -> Optional[str]:
    for c in candidates:
        if c and str(c).strip():
            return str(c).strip()
    return None


DATABASE_URL: Optional[str] = _first_url(
    os.getenv("DATABASE_URL"),
    os.getenv("POSTGRES_URL"),
    os.getenv("SUPABASE_DB_URL"),
    _dsn_from_pg_env(),
)
