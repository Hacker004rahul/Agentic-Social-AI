from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.config import get_db

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get("/queue")
async def get_queue(user=Depends(get_current_user)):
    db   = get_db()
    docs = await db["scheduler"].find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@router.delete("/queue/{post_id}")
async def delete_post(post_id: str, user=Depends(get_current_user)):
    db     = get_db()
    result = await db["scheduler"].delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"success": True}


from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class SchedulePostInput(BaseModel):
    platform:           str
    content:            str
    video_url:          Optional[str] = None
    video_title:        Optional[str] = None
    video_category:     Optional[str] = None
    video_privacy:      Optional[str] = None
    video_license:      Optional[str] = None
    notify_subscribers: Optional[bool] = True
    made_for_kids:      Optional[bool] = False
    scheduled_at:       Optional[str] = None
    status:             Optional[str] = "scheduled"

@router.post("/queue")
async def add_to_queue(body: SchedulePostInput, user=Depends(get_current_user)):
    db = get_db()
    
    post_id = str(uuid.uuid4())
    
    post_doc = {
        "id":                 post_id,
        "user_id":            user["id"],
        "platform":           body.platform,
        "content":            body.content,
        "video_url":          body.video_url,
        "video_title":        body.video_title,
        "video_category":     body.video_category,
        "video_privacy":      body.video_privacy,
        "video_license":      body.video_license,
        "notify_subscribers": body.notify_subscribers,
        "made_for_kids":      body.made_for_kids,
        "status":             body.status,
        "scheduled_at":       body.scheduled_at or datetime.utcnow().isoformat(),
        "best_time":          datetime.fromisoformat(body.scheduled_at).strftime("%I:%M %p") if body.scheduled_at else datetime.utcnow().strftime("%I:%M %p"),
        "created_at":         datetime.utcnow().isoformat(),
    }
    
    await db["scheduler"].insert_one(post_doc)
    return {"success": True, "post_id": post_id}
