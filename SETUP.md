# Clone Repository

```bash
# On Windows
git clone https://github.com/predictpix-team/PredictPix.git
```

# Backend Setup

1) Install Dependencies

```bash
# On Windows
cd frontend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

2) Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# PI API KEY
PI_API_KEY="..................................................."

# JWT lifetimes (minutes)
ADMIN_JWT_TTL_MIN=15
USER_JWT_TTL_MIN=360
JWT_SECRET_KEY="supersecretkey"
JWT_ISSUER="predictpix"
JWT_AUDIENCE="predictpix-clients"
JWT_ALGORITHM="HS256"

# Supabase
PGHOST=localhost
PGPORT=5432
PGDATABASE=predictpix
PGUSER=postgres
PGPASSWORD=postgres
PGSSLMODE=disable

# COR ALLOWED SITES
ALLOWED_ORIGINS=http://localhost:9002

# FRONTEND WHITELIST
FRONTEND_WHITELIST_DOMAINS=http://localhost:9002
FRONTEND_WHITELIST_IPS=127.0.0.1
```

3) Start Backend Server

```bash
# On Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`

# Frontend Setup

1) Install Dependencies

```bash
# On Windows
cd frontend
npm install
```

2) Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
# FastAPI backend origin (used internally by Next.js API routes)
BACKEND_ORIGIN=http://localhost:8001

# ===== Public (safe to expose — browser sees these) ================
NEXT_PUBLIC_API_BASE=http://localhost:8001/api
```

3) Start Frontend Server

```bash
# On Windows
npm run dev
```

Frontend will be available at: `http://localhost:9002`

---
