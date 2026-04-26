# PredictPix

Community Forecasting Platform for the Pi Network  
Backend: FastAPI | Frontend: Next.js 15 | Database: Supabase

---

## 📌 Project Overview

PredictPix is a community-driven prediction platform built for the Pi Network where users forecast real-world events using Pi. The platform demonstrates collective intelligence and real network utility, and is explicitly designed as **not gambling or speculative betting**.

The MVP is deployed on DigitalOcean and operates within the Pi Browser on the Pi Testnet. This repository contains the full-stack application and setup instructions to enable new contributors to run the platform locally and participate in development.

---

## 🧱 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind, shadcn/ui |
| Backend | FastAPI (Python 3.10) |
| Database | Supabase (PostgreSQL) |
| Deployment | DigitalOcean, Nginx, SSL |
| Blockchain | Pi SDK (Testnet) |

---

## 📁 Project Structure

### Backend Structure
```
predictpix/
│
├── app/
│   ├── main.py
│   ├── routes/
│   ├── models/
│   ├── services/
│   └── core/
└── requirements.txt
```

### Frontend Structure
```
predictpix-ui/
│
├── app/
├── components/
├── styles/
└── package.json
```

### Installation
```
installation/
│
├── nginx/
└── README.md
```

---

# 🚀 Local Setup Guide

## 1. Prerequisites
Ensure you have the following installed:

- Python 3.10
- Node.js 18+
- Git
- PostgreSQL or Supabase CLI

---

## 2. Backend Setup (FastAPI)

### Clone Repository

```bash
git clone https://github.com/predictpix-team/predictpix-api.git
cd predictpix-api
```

### Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Install Requirements
```bash
pip install -r requirements.txt
```

### Configure Environment Variables
Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/predictpix
SECRET_KEY=your-secret-key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
PI_API_KEY=your-pi-server-api-key
```

### Run Backend Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Reset `markets.id` sequence after manual seed IDs
If markets are seeded with explicit IDs (for example, `100000~100049`), run this SQL once so new inserts continue from the current max ID instead of restarting at `1`.

```sql
SELECT setval(
  pg_get_serial_sequence('markets', 'id'),
  COALESCE((SELECT MAX(id) FROM markets), 1),
  true
);
```

Backend Access:
```
http://localhost:8001
```

---

## 3. Frontend Setup (Next.js 15)

### Clone Repository

```bash
git clone https://github.com/predictpix-team/predictpix-ui.git
cd predictpix-ui
```

### Create Environment File
Create a `.env` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_PI_APP_ID=your-pi-app-id
```

### Run Dev Server
```bash
npm run dev
```

### Build Server
```bash
npm run build
```

### Deploy Server
```bash
npm run start
```

Frontend URL:
```
http://localhost:9002
```

---

# ✅ Functional Verification Checklist

Use this checklist to confirm local and server readiness:

- [ ] /page loads markets correctly
- [ ] /leaderboard displays aggregated user performance
- [ ] /account page loads user profile correctly
- [ ] /admin resolves prediction outcomes
- [ ] Predictions submit and update status
- [ ] Supabase data matches backend API
- [ ] Pi Browser loads UI correctly
- [ ] CORS configuration verified
- [ ] HTTPS enabled
- [ ] SSL certificate valid

---

# 🔌 Pi SDK Integration (Testnet)

## Routes
- POST /api/pi/payments/init
- POST /api/pi/payments/complete

### Flow
1. User logs in via Pi SDK
2. Initiates payment
3. Backend verifies transaction (PI_SERVER_API_KEY)
4. Prediction entry updated as paid
5. Blockchain confirmation returned

---

# 📦 Production Deployment

Services:
- DigitalOcean Droplet
- Nginx reverse proxy

Verify:
- Domain routing correctness
- Pi Browser domain validation
- Firewall and IP restrictions
- HTTPS enforcement

---

# 🛡 Security Recommendations

- Never commit .env files
- Restrict admin routes by role
- Use HTTPS only
- Sanitize and validate all JSON payloads

---

# 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open Pull Request

---

# 📹 Launch Readiness Evidence
Contributors should provide either:
- A short screen recording walkthrough
- Or a signed checklist confirming readiness

---

# ✅ MVP Ready for Pi Testnet
PredictPix is structured to meet Pi Network Testnet requirements and provide a stable foundation for mainnet expansion.

For support or contribution inquiries, please open a GitHub Issue.

