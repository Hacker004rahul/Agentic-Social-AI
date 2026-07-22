from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from core.auth import get_current_user
from core.config import get_db

router = APIRouter(prefix="/brands", tags=["brands"])

@router.post("")
async def save_brand(body: dict, user=Depends(get_current_user)):
    db = get_db()
    brand_name = body.get("brand_name")
    payload = {
        "user_id": user["id"],
        "brand_name": brand_name,
        "industry": body.get("industry"),
        "target_audience": body.get("target_audience"),
        "platforms": body.get("platforms", []),
        "offer": body.get("offer", ""),
        "campaign_goal": body.get("campaign_goal", "awareness"),
        "tone": body.get("tone", "casual"),
        "autonomous": body.get("autonomous", False),
        "autonomous_interval_hours": body.get("autonomous_interval_hours", 24),
        "last_autonomous_run_at": body.get("last_autonomous_run_at"),
    }
    existing = await db["brands"].find_one({"brand_name": brand_name, "user_id": user["id"]})
    if existing:
        # Don't overwrite created_at
        await db["brands"].update_one(
            {"brand_name": brand_name, "user_id": user["id"]},
            {"$set": payload}
        )
        payload["id"] = str(existing.get("_id") or existing.get("id", ""))
    else:
        payload["created_at"] = datetime.utcnow()
        result = await db["brands"].insert_one(payload)
        payload["id"] = str(result.inserted_id)
    payload.pop("_id", None)
    return payload

@router.put("/{brand_name}")
async def update_brand(brand_name: str, body: dict, user=Depends(get_current_user)):
    db = get_db()
    update_data = {
        "industry": body.get("industry"),
        "target_audience": body.get("target_audience"),
        "platforms": body.get("platforms"),
        "offer": body.get("offer"),
        "campaign_goal": body.get("campaign_goal"),
        "tone": body.get("tone"),
        "autonomous": body.get("autonomous"),
        "autonomous_interval_hours": body.get("autonomous_interval_hours"),
    }
    # remove None values so we don't overwrite with nulls
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    await db["brands"].update_one(
        {"brand_name": brand_name, "user_id": user["id"]},
        {"$set": update_data}
    )
    
    updated = await db["brands"].find_one({"brand_name": brand_name, "user_id": user["id"]}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Brand not found")
    return updated

@router.get("")
async def list_brands(user=Depends(get_current_user)):
    db = get_db()
    docs = await db["brands"].find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return docs
