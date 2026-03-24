import os, sys, importlib, py_compile, pathlib, traceback
ROOT = pathlib.Path("/opt/predictpix")
APP = ROOT / "app"

def die(msg, code=2, exc:BaseException|None=None):
    print(f"[preflight] {msg}", file=sys.stderr)
    if exc:
        traceback.print_exc()
    sys.exit(code)

# ---- ENV CHECKS ----
url = os.getenv("PGURL_SYNC") or os.getenv("DATABASE_URL")
if not url:
    die("Missing PGURL_SYNC or DATABASE_URL")

if not os.getenv("ADMIN_API_KEY"):
    die("Missing env: ADMIN_API_KEY")

# ---- COMPILE FAST-FAIL ----
for p in [APP/"main.py", APP/"api"/"markets.py", APP/"api"/"market_stats.py"]:
    if p.exists():
        try:
            py_compile.compile(str(p), doraise=True)
        except Exception as e:
            die(f"Compile failed: {p}", exc=e)

# ---- IMPORT ASGI APP ----
try:
    sys.path.insert(0, str(ROOT))
    importlib.import_module("app.main")
except Exception as e:
    die("Import app.main failed", code=1, exc=e)

print("[preflight] OK")
