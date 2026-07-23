from datetime import datetime
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.config import get_db
from core.db_utils import find_many
from core.platforms import normalize_platform
from core.publishing import format_best_time, parse_publish_datetime

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get("/queue")
async def get_queue(user=Depends(get_current_user)):
    db = get_db()
    docs = await find_many(
        db["scheduler"],
        {"user_id": user["id"]},
        {"_id": 0},
        sort=("created_at", -1),
        limit=100,
    )
    return docs


@router.delete("/queue/{post_id}")
async def delete_post(post_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = await db["scheduler"].delete_one({"id": post_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"success": True}


class SchedulePostInput(BaseModel):
    platform: str
    content: str
    title: Optional[str] = None
    image_url: Optional[str] = None
    media_kind: Optional[str] = None
    video_url: Optional[str] = None
    video_title: Optional[str] = None
    video_category: Optional[str] = None
    video_privacy: Optional[str] = None
    video_license: Optional[str] = None
    notify_subscribers: Optional[bool] = True
    made_for_kids: Optional[bool] = False
    scheduled_at: Optional[str] = None
    status: Optional[str] = "scheduled"

@router.post("/queue")
async def add_to_queue(body: SchedulePostInput, user=Depends(get_current_user)):
    db = get_db()

    post_id = str(uuid.uuid4())
    scheduled_at = body.scheduled_at or datetime.utcnow().isoformat()
    scheduled_dt = parse_publish_datetime(scheduled_at) or datetime.utcnow()

    post_doc = {
        "id": post_id,
        "user_id": user["id"],
        "platform": normalize_platform(body.platform),
        "title": body.title,
        "content": body.content,
        "image_url": body.image_url,
        "media_kind": body.media_kind,
        "video_url": body.video_url,
        "video_title": body.video_title,
        "video_category": body.video_category,
        "video_privacy": body.video_privacy,
        "video_license": body.video_license,
        "notify_subscribers": body.notify_subscribers,
        "made_for_kids":      body.made_for_kids,
        "status": body.status,
        "scheduled_at": scheduled_dt.isoformat(),
        "best_time": format_best_time(scheduled_dt),
        "created_at": datetime.utcnow().isoformat(),
    }

    await db["scheduler"].insert_one(post_doc)
    return {"success": True, "post_id": post_id}
