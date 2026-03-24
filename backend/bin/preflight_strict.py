import os, sys, importlib
sys.dont_write_bytecode = True
sys.path.insert(0, "/opt/predictpix")  # ensure we can import app.*

# --- import checks ---
for m in ("app.main", "app.api.market_stats", "app.api.markets"):
    importlib.import_module(m)

# --- DB DSN (env or /etc/predictpix.env) ---
dsn = os.environ.get("PGURL_SYNC") or os.environ.get("DATABASE_URL")
if not dsn:
    try:
        with open("/etc/predictpix.env") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k in ("PGURL_SYNC", "DATABASE_URL") and v:
                    dsn = v
                    break
    except Exception:
        pass
if not dsn:
    print("No DB DSN (PGURL_SYNC/DATABASE_URL) available for preflight", file=sys.stderr)
    sys.exit(1)

# --- DB check ---
try:
    import psycopg
    with psycopg.connect(dsn) as c:
        with c.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
except Exception as e:
    print(f"DB check failed: {e}", file=sys.stderr)
    sys.exit(2)

print("OK")
