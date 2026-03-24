PredictPix — Auth & Ops Guide

This doc is for us (you + your brother) to run, verify, and debug Pi login end-to-end across web/Expo and the FastAPI backend behind api.predictpix.com.

TL;DR (cheat-sheet)
# Restart API & see logs
sudo systemctl restart predictpix
sudo journalctl -u predictpix -n 80 --no-pager -l

# Is Uvicorn listening?
sudo ss -ltnp | grep 8001

# Backend smoke test (invalid token should return 401 JSON)
curl -i http://127.0.0.1:8001/auth/pi -H 'Content-Type: application/json' -d '{"accessToken":"BAD"}'
curl -i https://api.predictpix.com/auth/pi -H 'Content-Type: application/json' -d '{"accessToken":"BAD"}'

# Decode our app JWT on the server
APP_JWT='(paste token from a successful /auth/pi login)'
curl -sS https://api.predictpix.com/auth/me -H "Authorization: Bearer $APP_JWT" | jq

What we built
Frontend (Expo / Web)

Login options:

Pi (real): paste a real Pi accessToken into the manual field, tap “Continue with Pi (real)”.
→ Calls POST /auth/pi → server verifies with Pi → returns app JWT → stored in SecureStore and the in-memory API client.

Pi (mock): testnet/dev-only, returns a regular user. (Keep this for development.)

Admin (API key) and Elevate: optional; only work if the corresponding server routes exist.

API base: https://api.predictpix.com (set via EXPO_PUBLIC_API_BASE_URL).

Backend (FastAPI, Uvicorn, systemd, Nginx)

Routes

POST /auth/pi — Verify Pi accessToken against https://api.minepi.com/v2/me; mint and return our HS256 app JWT.

GET /auth/me — Decode our HS256 app JWT on the server and return sub, username, roles, isAdmin, iat, exp.

Where: /opt/predictpix, served by predictpix.service, proxied by Nginx to 127.0.0.1:8001.

Directory layout (server)
/opt/predictpix
├── app/
│   └── main.py               # FastAPI app (includes routers + CORS)
├── routes/
│   ├── __init__.py
│   ├── auth_pi.py            # POST /auth/pi (real Pi verify -> mint app JWT)
│   └── auth_me.py            # GET  /auth/me (decode app JWT)
├── venv/                     # Python venv used by systemd service
├── gunicorn.conf.py
└── .env                      # secrets & config (KEY=VALUE lines)


Service: /etc/systemd/system/predictpix.service runs Uvicorn on 127.0.0.1:8001.
Nginx: /etc/nginx/sites-enabled/api.predictpix.com.conf proxies https://api.predictpix.com → http://127.0.0.1:8001/.

Environment (server) — .env keys we use
# Auth & Pi
JWT_SECRET=...                      # required; any strong random string
JWT_ISSUER=predictpix
JWT_AUDIENCE=predictpix-clients
PI_ENV=testnet                      # or mainnet
PI_APP_ID=pi-testnet-predictpix     # optional (informational)
PI_APP_SECRET=...                   # not required for /v2/me
PREDICTPIX_ADMIN_PI_USERNAMES=AtchesSon Rson959

# CORS allow-list (space-separated)
CORS_ALLOW_ORIGINS=https://predictpix.com https://www.predictpix.com


Keep .env KEY=VALUE only (no raw URLs/notes). Nginx blocks direct access, but keep secrets tidy anyway.

Backend routes — code pointers
CORS (in app/main.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_pi, auth_me

app = FastAPI(title="PredictPix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        "exp://127.0.0.1:19000",
        "https://predictpix.com",
        "https://www.predictpix.com",
        "https://api.predictpix.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_pi.router)
app.include_router(auth_me.router)

POST /auth/pi (in routes/auth_pi.py)

Verifies accessToken with Pi API GET https://api.minepi.com/v2/me.

If valid, mints HS256 app JWT with claims: iss, aud, sub, username, roles, iat, exp.

roles includes "admin" if the Pi username is in PREDICTPIX_ADMIN_PI_USERNAMES.

This route already returns 401 for bad/expired tokens (that’s our smoke test).

GET /auth/me (in routes/auth_me.py)

Parses Authorization: Bearer <APP_JWT>, validates HS256 signature & claims, returns:

{
  "sub": "...", "username": "...", "roles": ["..."], "isAdmin": false,
  "iat": 123, "exp": 456
}

Frontend env (Expo / Web)

.env (client)

EXPO_PUBLIC_API_BASE_URL=https://api.predictpix.com
EXPO_PUBLIC_PI_ENV=testnet
EXPO_PUBLIC_PI_APP_ID=pi-testnet-predictpix
EXPO_PUBLIC_ORDER_PATH=/orders
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_KEY=...           # only if you use admin login with API key

Frontend auth helpers (what the buttons call)

These already exist in your codebase; here are the important ones.

Real Pi login (manual paste)
// utils/auth.ts — real Pi flow used by “Continue with Pi (real)”
export async function loginWithPi(accessToken: string): Promise<string> {
  if (!accessToken || !accessToken.trim()) {
    throw new Error("accessToken required");
  }
  const res = await fetch(`${API_BASE}/auth/pi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: accessToken.trim() }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Pi login failed (${res.status}): ${txt || "no body"}`);
  }
  const data = await res.json().catch(() => ({}));
  const token: string | undefined =
    data?.access_token || data?.token || data?.jwt;
  if (!token) throw new Error("Pi login failed: access_token missing");
  await setStoredToken(token);     // writes SecureStore + mirrors client token
  return token;
}

Mock Pi login (dev only)
// utils/auth.ts — dev convenience, returns regular user
export async function loginWithPiMock(username: string): Promise<string> {
  // posts to your mock endpoint (if kept) or a dev route that mints a non-admin token
}


Both paths end up persisting the server-issued app JWT into SecureStore and into the in-memory API client used by the app.

How to get a real Pi accessToken (Pi Browser helper)

Outside Pi Browser, the SDK isn’t available, so we just generate a token in Pi Browser and paste it into the app.

We added a tiny helper page:

File: /var/www/predictpix.com/pi-token.html

Open Pi Browser on your phone → go to https://predictpix.com/pi-token.html

Tap “Authenticate with Pi” → approve

Copy the long accessToken

Switch to our app (web/Expo), paste into the field → press “Continue with Pi (real)”

Tokens expire. If /auth/pi returns 401, just generate a new one.

Verifying end-to-end
1) Backend-only tests
# 401 for bad token (local + public)
curl -i http://127.0.0.1:8001/auth/pi -H 'Content-Type: application/json' -d '{"accessToken":"BAD"}'
curl -i https://api.predictpix.com/auth/pi -H 'Content-Type: application/json' -d '{"accessToken":"BAD"}'

# With a real token (get it from pi-token.html page in Pi Browser)
TOKEN='PASTE_FROM_PI_BROWSER'
curl -i https://api.predictpix.com/auth/pi -H 'Content-Type: application/json' -d "{\"accessToken\":\"$TOKEN\"}"
# => 200 + JSON { access_token: "<APP_JWT>", user: {...} }

# Confirm our JWT decodes server-side
APP_JWT='(paste from the previous response)'
curl -sS https://api.predictpix.com/auth/me -H "Authorization: Bearer $APP_JWT" | jq

2) App tests

Launch app, open Login screen.

Paste Pi accessToken → press “Continue with Pi (real)”.

Use the “Check Auth Status” button in the app:

Token stored? Yes

Client memory token? Yes

User shows your Pi username; roles include admin if whitelisted.

Common issues & fixes

502 from Nginx

Usually means backend wasn’t listening when Nginx forwarded.

Check:

sudo ss -ltnp | grep 8001                            # must show uvicorn bound
sudo journalctl -u predictpix -n 120 --no-pager -l   # import errors, tracebacks


ModuleNotFoundError: No module named 'httpx'

Install into the service’s venv:

sudo -u predictpix /opt/predictpix/venv/bin/pip install httpx PyJWT python-dotenv
sudo systemctl restart predictpix


ModuleNotFoundError: No module named 'routes'

Ensure package exists & is on PYTHONPATH:

sudo mkdir -p /opt/predictpix/routes
sudo tee /opt/predictpix/routes/__init__.py >/dev/null <<< '# routes'


401 “Invalid Pi token: HTTP 401”

The pasted Pi token is expired or not for our app context.

Re-open https://predictpix.com/pi-token.html in Pi Browser, re-auth, copy new token.

CORS errors in browser

Confirm allowed origins in app/main.py CORS block, and in .env (if you propagate CORS from there).

Ensure your web page loads from https://predictpix.com (or localhost:19006 during dev).

JWT “invalid audience/issuer”

The server mints & validates using .env values: JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE.

Keep these consistent across minting (in /auth/pi) and decoding (in /auth/me).

Operational commands
# Start/stop/status
sudo systemctl restart predictpix
sudo systemctl status predictpix --no-pager -l
sudo journalctl -u predictpix -f -l       # tail logs

# Nginx reload (after config edits)
sudo nginx -t && sudo systemctl reload nginx

# Backup a file before edits
sudo cp /opt/predictpix/app/main.py /opt/predictpix/app/main.py.bak.$(date +%F-%H%M%S)

Security notes

Treat Pi accessToken like a password (short-lived, but sensitive).

Our app JWT is HS256 signed; keep JWT_SECRET secret.

Do not expose .env publicly; keep it to KEY=VALUE lines only.

Consider rate limiting /auth/pi server-side if you open wider traffic.

Optional / Future

Admin elevate and API-key login routes (only if we decide to keep that model).

Add /health endpoint that returns 200 OK for simpler uptime checks.

Pi payments scope demo (server handler for incomplete payments, etc.).

Contact

Ping each other in the thread. When in doubt, run:

sudo journalctl -u predictpix -n 200 --no-pager -l


…and copy the last 30–40 lines into chat. That log view will tell us 90% of what’s wrong.

End of README.# Paste the README content here (everything I sent you)
# … (paste it all) …
