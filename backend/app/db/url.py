"""Normalize PostgreSQL URLs for SQLAlchemy async (asyncpg)."""

import os
import ssl
from typing import Any, Dict, Tuple
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

_SSL_MODES_REQUIRING_TLS = frozenset(
    ("require", "verify-ca", "verify-full", "prefer", "allow")
)


def _normalize_scheme_and_netloc(url: str) -> Tuple[str, str, str, str, str]:
    u = url.strip()
    if u.startswith("postgres://"):
        u = "postgresql://" + u[len("postgres://") :]

    parts = urlsplit(u)
    scheme_raw = (parts.scheme or "").lower()
    if not scheme_raw:
        return parts.scheme, parts.netloc, parts.path, parts.query, parts.fragment

    if "+" in scheme_raw:
        base, _, driver = scheme_raw.partition("+")
        if driver == "asyncpg":
            new_scheme = scheme_raw
        else:
            base = base or "postgresql"
            new_scheme = f"{base}+asyncpg"
    elif scheme_raw in ("postgresql", "postgres"):
        new_scheme = "postgresql+asyncpg"
    else:
        return parts.scheme, parts.netloc, parts.path, parts.query, parts.fragment

    return new_scheme, parts.netloc, parts.path, parts.query, parts.fragment


def _strip_ssl_query(query: str) -> Tuple[str, bool]:
    """Remove libpq/asyncpg TLS query keys; return (new_query, use_ssl)."""
    if not query:
        return query, False
    pairs = []
    use_ssl = False
    for key, val in parse_qsl(query, keep_blank_values=True):
        lk = key.lower()
        if lk == "sslmode":
            if val and val.lower() in _SSL_MODES_REQUIRING_TLS:
                use_ssl = True
            continue
        if lk == "ssl":
            if val.lower() in ("1", "true", "on", "require"):
                use_ssl = True
            continue
        pairs.append((key, val))
    return urlencode(pairs), use_ssl


def _is_postgresql_url(url: str) -> bool:
    u = url.strip()
    if u.startswith("postgres://"):
        return True
    base = (urlsplit(u).scheme or "").lower().partition("+")[0]
    return base in ("postgresql", "postgres")


def to_async_sqlalchemy_url(url: str) -> str:
    """Asyncpg URL without TLS query params (use :func:`asyncpg_connect_args`)."""
    if not _is_postgresql_url(url):
        return url.strip()
    scheme, netloc, path, query, fragment = _normalize_scheme_and_netloc(url)
    q, _ = _strip_ssl_query(query)
    return urlunsplit((scheme, netloc, path, q, fragment))


def asyncpg_connect_args(url: str) -> Dict[str, Any]:
    """TLS/connect kwargs for ``create_async_engine(..., connect_args=...)``."""
    if not _is_postgresql_url(url):
        return {}

    pgssl = os.getenv("PGSSLMODE", "").strip().lower()
    if pgssl == "disable":
        return {}
    no_verify = os.getenv("DATABASE_SSL_INSECURE", "").strip().lower() in (
        "1",
        "true",
        "yes",
    ) or pgssl in ("noverify", "no-verify", "insecure")

    _, _, _, query, _ = _normalize_scheme_and_netloc(url)
    _, use_ssl = _strip_ssl_query(query)

    if no_verify:
        if not use_ssl:
            return {}
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"ssl": ctx}

    if not use_ssl:
        return {}
    try:
        import certifi

        ctx = ssl.create_default_context(cafile=certifi.where())
        return {"ssl": ctx}
    except Exception:
        return {"ssl": True}
