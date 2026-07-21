from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from core.auth import get_current_user
from core.config import get_db

router = APIRouter(prefix="/brands", tags=["brands"])

@router.post("")
async def save_brand(body: dict, user=Depends(get_current_user)):
    db = get_db()
    payload = {
        "user_id": user["id"],
        "brand_name": body.get("brand_name"),
        "industry": body.get("industry"),
        "target_audience": body.get("target_audience"),
        "platforms": body.get("platforms", []),
        "offer": body.get("offer", ""),
        "campaign_goal": body.get("campaign_goal", "awareness"),
        "tone": body.get("tone", "casual"),
        "created_at": datetime.utcnow(),
    }
    result = await db["brands"].insert_one(payload)
    payload["id"] = str(result.inserted_id)
    return payload

@router.get("")
async def list_brands(user=Depends(get_current_user)):
    db = get_db()
    docs = await db["brands"].find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return docs
