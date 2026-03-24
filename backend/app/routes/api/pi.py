# Minimal stub to restore API importability and ensure mount works.
import jwt
import os
import httpx
import uuid
from dotenv import load_dotenv
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger()

router = APIRouter(prefix="/pi", tags=["pi"])

PI_API_KEY = os.getenv("PI_API_KEY", "pi-api-key")


@router.post("/payments/approve")
async def approve_pi_payments(request: Request, user=Depends(verify_token)):
    data = await request.json()
    payment_id = data.get("paymentId", "")
    user_id = user.get("sub", "")
    
    # logger.info(f"ApprovePiPayments: userId={user_id}, paymentId={payment_id}, PI_API_KEY={PI_API_KEY}")

    url = f"https://api.minepi.com/v2/payments/{payment_id}/approve"

    headers = {
        "Authorization": f"Key {PI_API_KEY}",
        "Content-Type": "application/json"
    }

    # Don't log sensitive headers (Authorization contains API key)
    # safe_headers = {k: v for k, v in headers.items() if k.lower() != 'authorization'}
    # logger.info(f"[PI PAYMENT APPROVE]: paymentId={payment_id}, userId={user_id}, headers={safe_headers}, url={url}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, headers=headers)
    except httpx.RequestError as e:
        logger.error(f"Pi API request failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to Pi server"
        )

    # logger.info(f"[PI PAYMENT APPROVE]: response.status_code={response.status_code}")

    if response.status_code != 200:
        logger.error(f"Pi approval failed: {response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Pi approval failed: {response.text}"
        )

    # logger.info(f"[PI PAYMENT APPROVE]: pi_response={response.json()}")

    return {
        "status": "approved",
        "pi_response": response.json()
    }


@router.post("/payments/complete")
async def complete_pi_payments(request: Request, user=Depends(verify_token)):
    data = await request.json()
    payment_id = data.get("paymentId", "")
    txid = data.get("txid", "")
    user_id = user.get("sub", "")

    # Input validation
    if not payment_id:
        raise HTTPException(status_code=400, detail="paymentId is required")
    
    if not txid:
        raise HTTPException(status_code=400, detail="txid is required")

    url = f"https://api.minepi.com/v2/payments/{payment_id}/complete"

    headers = {
        "Authorization": f"Key {PI_API_KEY}",
        "Content-Type": "application/json"
    }

    # Don't log sensitive headers (Authorization contains API key)
    # safe_headers = {k: v for k, v in headers.items() if k.lower() != 'authorization'}
    # logger.info(f"[PI PAYMENT COMPLETE]: paymentId={payment_id}, txid={txid}, userId={user_id}, headers={safe_headers}, url={url}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                url,
                headers=headers,
                json={"txid": txid}
            )
    except httpx.RequestError as e:
        logger.error(f"Pi API request failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to Pi server"
        )

    logger.info(f"[PI PAYMENT COMPLETE]: response.status_code={response.status_code}")

    if response.status_code != 200:
        logger.error(f"Pi complete failed: {response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Pi complete failed: {response.text}"
        )

    # Parse response once and reuse
    try:
        pi_response = response.json()
    except Exception as e:
        logger.error(f"Failed to parse Pi API response: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Invalid response from Pi server"
        )

    result = {
        "status": "completed",
        "pi_response": pi_response
    }

    logger.info(f"[PI PAYMENT COMPLETE]: result={result}")

    return result


@router.post("/payments/incomplete")
async def incomplete_pi_payments(request: Request):
    body = await request.json()
    payment = body.get("payment")

    if not payment:
        raise HTTPException(status_code=400, detail="Payment data missing")

    payment_id = payment.get("identifier")
    transaction = payment.get("transaction", {})
    txid = transaction.get("txid")
    tx_url = transaction.get("_link")

    if not payment_id or not tx_url:
        raise HTTPException(status_code=400, detail="Invalid payment data")

    url = f"https://api.minepi.com/v2/payments/{payment_id}/complete"

    headers = {
        "Authorization": f"Key {PI_API_KEY}",
        "Content-Type": "application/json"
    }

    # Don't log sensitive headers (Authorization contains API key)
    # safe_headers = {k: v for k, v in headers.items() if k.lower() != 'authorization'}
    logger.info(f"[PI PAYMENT INCOMPLETE]: paymentId={payment_id}, txid={txid}, url={url}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                url,
                headers=headers,
                json={"txid": txid}
            )
    except httpx.RequestError as e:
        logger.error(f"Pi API request failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to Pi server"
        )

    logger.info(
        f"[PI PAYMENT INCOMPLETE]: response.status_code={response.status_code}")

    if response.status_code != 200:
        logger.error(f"Pi incomplete failed: {response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Pi incomplete failed: {response.text}"
        )

    return {
        "status": "handled",
        "pi_response": response.json()
    }


@router.post("/payments/cancel")
async def cancel_pi_payments(request: Request, user=Depends(verify_token)):
    body = await request.json()
    user_id = user.get("sub", "")
    payment_id = body.get("paymentId")

    if not payment_id:
        raise HTTPException(status_code=400, detail="Invalid payment data")

    logger.info(f"[PI PAYMENT CANCEL]: paymentId={payment_id}, userId={user_id}")

    return {
        "status": "cancelled"
    }
