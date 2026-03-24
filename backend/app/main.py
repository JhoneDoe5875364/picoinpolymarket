from __future__ import annotations
import os
from fastapi import FastAPI, APIRouter, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.logger import setup_logger, get_logger
from app.routes import include_all_routers
from app.middleware.geo_middleware import create_geo_enforcement
from app.core.compliance_logger import get_compliance_logger
from app.core.attestation import get_attestation_service

# Load environment variables
load_dotenv()

# FastAPI App Setup
app = FastAPI(
    title="PredictPiX API",
    version=os.getenv("API_VERSION", "0.1.0"),
    docs_url=os.getenv("DOCS_URL", "/docs"),
    redoc_url=os.getenv("REDOC_URL", "/redoc"),
    openapi_url=os.getenv("OPENAPI_URL", "/openapi.json"),
)

# CORS setup
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:9002")
origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],  # Allow all origins if not defined
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logger Setup
setup_logger()
logger = get_logger()

# GeoControl Enforcement
create_geo_enforcement(app)


# Startup
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 FastAPI Server Started")
    
    # Include all routers
    include_all_routers(app)
