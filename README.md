# PredictPix - Community Forecasting Platform

**A community-driven prediction platform for the Pi Network** where users forecast real-world events using Pi.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000?style=flat)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](#license)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [API Documentation](#-api-documentation)
- [Development Guidelines](#-development-guidelines)
- [License](#-license)

---

## 🎯 Overview

**PredictPix** is an innovative community forecasting platform designed specifically for the Pi Network ecosystem. The platform enables users to make predictions about real-world events using Pi tokens, creating a marketplace of collective intelligence.

### Key Features

- **Community Predictions**: Users collectively forecast real-world outcomes
- **Pi Network Integration**: Seamless integration with Pi SDK for testnet and mainnet
- **Real-time Updates**: Live market data and prediction feeds
- **User Authentication**: Secure login with Pi authentication
- **Geolocation Support**: Geographic control and regional features
- **Leaderboard System**: Track top predictors by accuracy and participation
- **Admin Dashboard**: Manage markets, users, and suggestions

### Platform Purpose

> PredictPix is **explicitly not gambling or speculative betting**. It's a utility platform demonstrating collective intelligence and real network utility within the Pi ecosystem.

### Deployment Status

- **MVP Environment**: DigitalOcean
- **Network**: Pi Testnet (with mainnet ready)
- **Hosting**: Nginx with SSL certification
- **Database**: Supabase (PostgreSQL)

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | React framework with server-side rendering |
| **React** | Latest | UI component library |
| **TypeScript** | Latest | Type-safe JavaScript |
| **Tailwind CSS** | Latest | Utility-first CSS framework |
| **shadcn/ui** | Latest | High-quality UI components |
| **Supabase** | SSR | Backend-as-a-service auth & real-time |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115.14 | Modern async Python web framework |
| **Python** | 3.10+ | Server runtime |
| **Uvicorn** | Latest | ASGI application server |
| **Pydantic** | 2.11.7 | Data validation & serialization |
| **PostgreSQL** | Via Supabase | Primary database |
| **asyncpg** | Latest | Async PostgreSQL driver |
| **PyJWT** | Latest | JWT token handling |

### Infrastructure
| Tool | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL, Auth, Real-time |
| **DigitalOcean** | Cloud hosting (production) |
| **Nginx** | Reverse proxy & load balancing |
| **Gunicorn** | Python WSGI HTTP server |
| **Docker** | Containerization (optional) |

---

## 📁 Project Structure

### Root Directory Layout

```
PredictPix/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── core/           # Core business logic
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   ├── config_loader.py
│   │   │   ├── compliance_logger.py
│   │   │   ├── category_engine.py
│   │   │   ├── tier_engine.py
│   │   │   ├── geo_decorators.py
│   │   │   ├── ip_resolver.py
│   │   │   ├── attestation.py
│   │   │   └── migrations.py
│   │   ├── middleware/      # Custom middleware
│   │   │   └── geo_middleware.py
│   │   ├── routes/          # API endpoints
│   │   │   └── api/
│   │   ├── schemas/         # Pydantic models
│   │   │   └── pi_auth.py
│   │   ├── authz.py        # Authorization logic
│   │   └── db.py           # Database utilities
│   ├── bin/                 # Utility scripts
│   │   ├── preflight.py
│   │   ├── preflight_strict.py
│   │   ├── healthcheck.sh
│   │   └── env-audit.sh
│   ├── backups/             # Database backups
│   │── config/
│   │   └── geocontrol.json # Geo control settings (Tier & Category definitions)
│   ├── requirements.txt      # Python dependencies
│   ├── gunicorn.conf.py     # Gunicorn configuration
│   ├── README.md            # Backend documentation
│   └── smoke.sh             # Smoke tests
│
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   │   ├── page.tsx    # Home page
│   │   │   ├── layout.tsx  # Root layout
│   │   │   ├── api/        # API routes
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── admin/      # Admin dashboard
│   │   │   ├── portfolio/  # User portfolio
│   │   │   ├── markets/    # Markets listing
│   │   │   ├── leaderboard/# Leaderboard
│   │   │   ├── account/    # Account settings
│   │   │   └── ...
│   │   ├── components/     # Reusable React components
│   │   │   ├── app-shell.tsx
│   │   │   ├── app-header.tsx
│   │   │   ├── app-navigation.tsx
│   │   │   ├── GeoBlock.tsx
│   │   │   ├── LoginWithPi.tsx
│   │   │   └── ...
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── ai/             # AI/Genkit integration
│   │   │   ├── genkit.ts
│   │   │   └── flows/
│   │   ├── middleware.ts   # Next.js middleware
│   │   └── globals.css     # Global styles
│   ├── functions/          # Firebase Cloud Functions
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       └── data.ts
│   ├── docs/               # Documentation
│   ├── certs/              # SSL certificates
│   ├── package.json        # Dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── tailwind.config.ts  # Tailwind configuration
│   ├── next.config.mjs     # Next.js configuration
│   ├── firebase.json       # Firebase config
│   ├── apphosting.yaml     # App hosting config
│   └── README.md           # Frontend documentation
│
├── requirements/           # Dependency specifications
│   ├── geocontrol.txt
│
├── docs/                   # Project documentation
│   ├── blueprint.md
│
└── README.md               # This file
```

---

- **Git**: For version control
- **Docker & Docker Compose**: For containerized development

git clone <repository-url>
## 🌍 Deployment (Ubuntu + Nginx)

This section describes deploying PredictPix on an **Ubuntu** server using **Nginx** as a reverse proxy. The instructions assume the project will be placed under `/opt/PredictPix` and run as systemd-managed services:

- Backend service: `predictpix-api.service` (listens on port `8001`)
- Frontend service: `predictpix-ui.service` (listens on port `9002`)
- Backend public domain: `api.predictpix.com`
- Frontend public domain: `test.predictpix.com`
- Cloudflare: "Full" TLS mode (origin server uses HTTPS on port 443)

Prerequisites on the Ubuntu server:

- `git`, `nginx`, `certbot` (for Let's Encrypt), `node` (v18+), `npm` or `pnpm`, `python3.10+`, `pip`, and `virtualenv`.
- Create a dedicated user for running the services, e.g. `predictpix` (optional but recommended).

1) Clone Repository to `/opt`

```bash
# on the server (as root or sudo)
git clone https://github.com/predictpix-team/PredictPix.git
cd PredictPix
```

2) Backend setup (system-wide, service-managed)

- Create a Python virtualenv and install dependencies under `/opt/PredictPix/backend`. If you prefer to serve the backend with gunicorn directly, run the FastAPI server on port `8001`.

```bash
sudo -u predictpix -i
cd /opt/PredictPix/backend
sudo apt update
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.10 -y
sudo apt install python3.10-venv -y
sudo apt install libpq-dev -y
sudo apt install build-essential -y
sudo apt install -y build-essential python3.10-dev libpq-dev
python3.10 -m venv .venv
source .venv/bin/activate
pip3.10 install -r requirements.txt
deactivate
exit
```

- Prepare environment file `/opt/PredictPix/backend/.env` with your production variables (database URL, Supabase keys, JWT secrets, etc.). Ensure permissions are restricted:

```bash
sudo touch /opt/PredictPix/backend/.env
sudo chown predictpix:predictpix /opt/PredictPix/backend/.env
sudo chmod 600 /opt/PredictPix/backend/.env
```

```env
# PI API KEY
PI_API_KEY="..................................................."

# Database URL for SQLAlchemy/asyncpg (or set PGHOST+PGDATABASE+PGUSER in backend .env)
DATABASE_URL=postgresql://postgres:PASSWORD@db.USERNAME.supabase.co:5432/postgres?sslmode=require

# Admin Pi usernames (comma-separated, case-insensitive)
PREDICTPIX_ADMIN_PI_USERNAMES=xxxxxxxxxxxxx,yyyyyyyyyy

# JWT lifetimes (minutes)
ADMIN_JWT_TTL_MIN=15
USER_JWT_TTL_MIN=360
JWT_SECRET_KEY="supersecretkey"
JWT_ISSUER="predictpix"
JWT_AUDIENCE="predictpix-clients"
JWT_ALGORITHM="HS256"

# Supabase (frontend anon key + URL)
EXPO_PUBLIC_SUPABASE_URL=https://xinxaensoubhdomuvptq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...............................

# Supabase
PGHOST=db.xinxaensoubhdomuvptq.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=PASSWORD
PGSSLMODE=disable

# COR ALLOWED SITES
ALLOWED_ORIGINS=https://predictpix.com,https://test.predictpix.com,https://sandbox.predictpix.com,http://xxx.xxx.xxx.xxx:9002

# FRONTEND WHITELIST
FRONTEND_WHITELIST_DOMAINS=predictpix.com,www.predictpix.com,test.predictpix.com,sandbox.predictpix.com
FRONTEND_WHITELIST_IPS=xxx.xxx.xxx.xxx
```

- Prepare log file `/opt/PredictPix/backend/server.log`. Ensure permissions are restricted:

```bash
sudo touch /opt/PredictPix/backend/server.log
sudo chown predictpix:predictpix /opt/PredictPix/backend/server.log
sudo chmod 600 /opt/PredictPix/backend/server.log
```

- Example `systemd` unit for the backend (`/etc/systemd/system/predictpix-api.service`):

```ini
[Unit]
Description=PredictPiX API (Gunicorn/Uvicorn)
After=network.target

[Service]
User=predictpix
Group=predictpix
WorkingDirectory=/opt/PredictPix/backend
EnvironmentFile=/opt/PredictPix/backend/.env
ExecStart=/opt/PredictPix/backend/venv/bin/gunicorn -c /opt/PredictPix/backend/gunicorn.conf.py app.main:app
# Graceful reload for near-zero downtime deploys:
ExecReload=/bin/kill -HUP $MAINPID
# Hard restart fallback:
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStopSec=60
RuntimeDirectoryMode=0750

[Install]
WantedBy=multi-user.target
```

3) Frontend setup (Next.js)

- Prepare environment file `/opt/PredictPix/frontend/.env` with your production variables. Ensure permissions are restricted:

```bash
sudo touch /opt/PredictPix/frontend/.env
sudo chown predictpix:predictpix /opt/PredictPix/frontend/.env
sudo chmod 600 /opt/PredictPix/frontend/.env
```

```env
# FastAPI backend origin (used internally by Next.js API routes)
BACKEND_ORIGIN=https://api.predictpix.com

# ===== Public (safe to expose — browser sees these) ================
NEXT_PUBLIC_API_BASE=https://api.predictpix.com/api

# Supabase (anon key is safe if Row Level Security is enabled)
NEXT_PUBLIC_SUPABASE_URL=https://xinxaensoubhdomuvptq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=......................
```

- Install Node dependencies and build

```bash
sudo -u predictpix -i
cd /opt/PredictPix/frontend
npm install
npm run build
exit
```

- Example `systemd` unit for the frontend (`/etc/systemd/system/predictpix-ui.service`):

```ini
[Unit]
Description=PredictPix Next.js UI
After=network.target

[Service]
Type=simple
User=predictpix
Group=predictpix
WorkingDirectory=/opt/PredictPix/frontend
Environment=PORT=9002
Environment=NODE_ENV=production

# Use a shell so we can do conditional build
ExecStartPre=/bin/sh -lc 'test -d .next || npm run build'

# Start Next.js production server
ExecStart=/usr/bin/npm run start -- --port ${PORT}

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

After creating unit files, enable and start the services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable predictpix-api.service --now
sudo systemctl enable predictpix-ui.service --now
sudo systemctl status predictpix-api.service
sudo journalctl -u predictpix-api.service -f
```

4) Nginx configuration for separate domains

PredictPix uses two separate domains:
- **Backend API**: `api.predictpix.com` (proxies to port 8001)
- **Frontend UI**: `test.predictpix.com` (proxies to port 9002)

#### 4a) Nginx configuration for Backend (`api.predictpix.com`)

Create `/etc/nginx/sites-available/api.predictpix.com`:

```nginx
# PredictPix canonical vhost

# --- HTTP: redirect everything to HTTPS ---
server {
  listen 80;
  listen [::]:80;
  server_name api.predictpix.com;
  return 301 https://$host$request_uri;
}

# --- HTTPS: proxy selected /ui paths to backend on 127.0.0.1:8001 ---
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name api.predictpix.com;

  # TLS (update paths if needed)
  ssl_certificate     /etc/letsencrypt/live/cloudflare-predictpix.com/cert.pem;
  ssl_certificate_key /etc/letsencrypt/live/cloudflare-predictpix.com/private-key.pem;

  # Good defaults
  client_max_body_size 10m;

  # Include the API proxy locations
  include /etc/nginx/snippets/predictpix-api-8001.conf;
  include /etc/nginx/snippets/predictpix-compat.conf;
  include /etc/nginx/snippets/predictpix-proxy-tuning.conf;
}
```

#### 4b) Nginx configuration for Frontend (`test.predictpix.com`)

Create `/etc/nginx/sites-available/test.predictpix.com`:

```nginx
# PredictPix canonical vhost

# --- HTTP: redirect everything to HTTPS ---
server {
  listen 80;
  listen [::]:80;
  server_name test.predictpix.com;
  return 301 https://$host$request_uri;
}

# --- HTTPS: proxy selected /ui paths to backend on 127.0.0.1:8001 ---
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name test.predictpix.com;

  # TLS (update paths if needed)
  ssl_certificate     /etc/letsencrypt/live/cloudflare-predictpix.com/cert.pem;
  ssl_certificate_key /etc/letsencrypt/live/cloudflare-predictpix.com/private-key.pem;

  # Good defaults
  client_max_body_size 10m;

  # Include the API proxy locations
  include /etc/nginx/snippets/predictpix-root-9002.conf;
  include /etc/nginx/snippets/predictpix-compat.conf;
  include /etc/nginx/snippets/predictpix-proxy-tuning.conf;
}
```

#### 4c) Enable both Nginx sites

```bash
sudo ln -s /etc/nginx/sites-available/api.predictpix.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/test.predictpix.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5) Firewall (UFW) rules (optional)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # allows 80 and 443
sudo ufw enable
```

---

## 📚 API Documentation

### Key API Endpoints

#### Authentication
- `POST /api/auth/login` - User login with Pi
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Markets
- `GET /api/markets` - List all markets
- `POST /api/markets` - Create new market (admin)
- `GET /api/markets/{uuid}` - Get market details
- `GET /api/marktes/leaderboard` - Top predictors

#### Admin
- `GET /api/admin/markets` - List markets (admin)
- `GET /api/admin/users` - List users (admin)

---

## 🙏 Acknowledgments

- **Pi Foundation** - For the Pi Network ecosystem
- **Supabase** - For backend infrastructure
- **DigitalOcean** - For hosting
- **Open source community** - For amazing libraries and tools

---

**Last Updated**: December 6, 2025  
**Version**: 1.0.0  
**Maintainers**: PredictPix Development Team
