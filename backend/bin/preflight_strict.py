import os, sys, importlib
sys.dont_write_bytecode = True
sys.path.insert(0, "/opt/predictpix")  # ensure we can import app.*

# --- import checks ---
for m in ("app.main", "app.api.market_stats", "app.api.markets"):
    importlib.import_module(m)

# --- DB DSN (env or /etc/predictpix.env) ---
dsn = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("POSTGRES_URL")
    or os.environ.get("SUPABASE_DB_URL")
)
if not dsn:
    try:
        with open("/etc/predictpix.env") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k in ("DATABASE_URL", "POSTGRES_URL", "SUPABASE_DB_URL") and v:
                    dsn = v
                    break
    except Exception:
        pass
if not dsn:
    print("No DB DSN (DATABASE_URL / POSTGRES_URL / SUPABASE_DB_URL) for preflight", file=sys.stderr)
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
