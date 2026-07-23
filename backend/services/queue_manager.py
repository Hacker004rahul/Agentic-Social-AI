from datetime import datetime, timedelta
import random
from typing import List, Dict, Any
from core.config import get_db

async def calculate_optimal_schedule(brand_name: str, user_id: str) -> datetime:
    db = get_db()
    # Fetch brand settings if available
    brand = await db["brands"].find_one({"brand_name": brand_name, "user_id": user_id})
    
    # Defaults
    timezone_offset_hours = 0
    recommended_hours = [8, 12, 19] # 8:00 AM, 12:30 PM, 7:00 PM
    
    if brand:
        # Determine recommendations based on goal or industry
        goal = brand.get("campaign_goal", "awareness")
        if goal == "conversion":
            recommended_hours = [10, 15, 20]
        elif goal == "engagement":
            recommended_hours = [9, 13, 18]
            
    now = datetime.utcnow()
    # Find the next available hour slot today, or roll over to tomorrow
    for hour in recommended_hours:
        candidate = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        if candidate > now + timedelta(minutes=15):
            return candidate
            
    # Roll over to tomorrow's first slot
    tomorrow = now + timedelta(days=1)
    return tomorrow.replace(hour=recommended_hours[0], minute=0, second=0, microsecond=0)


async def add_to_publishing_queue(project_id: str, scheduled_time: datetime = None) -> Dict[str, Any]:
    db = get_db()
    project = await db["video_projects"].find_one({"id": project_id})
    if not project:
        raise ValueError("Video Project not found")
        
    scheduled_at = scheduled_time or await calculate_optimal_schedule(project["brand_name"], project["user_id"])
    
    queue_id = f"q_{project_id}"
    
    queue_item = {
        "id": queue_id,
        "video_project_id": project_id,
        "platform": project["platform"],
        "content": project["caption"],
        "video_url": project["video_url"],
        "thumbnail_url": project.get("thumbnail_url"),
        "scheduled_at": scheduled_at.isoformat(),
        "status": "scheduled",
        "retry_count": 0,
        "last_attempt_at": None,
        "error_message": None,
        "user_id": project["user_id"],
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db["publishing_queue"].update_one(
        {"id": queue_id},
        {"$set": queue_item},
        upsert=True
    )
    
    # Update project status
    await db["video_projects"].update_one(
        {"id": project_id},
        {"$set": {"status": "approved"}}
    )
    
    return queue_item


async def get_publishing_queue(user_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    items = await db["publishing_queue"].find({"user_id": user_id}, {"_id": 0}).sort("scheduled_at", 1).to_list(100)
    return items


async def update_queue_item(item_id: str, updates: Dict[str, Any]) -> bool:
    db = get_db()
    res = await db["publishing_queue"].update_one(
        {"id": item_id},
        {"$set": updates}
    )
    return res.modified_count > 0


async def delete_queue_item(item_id: str) -> bool:
    db = get_db()
    res = await db["publishing_queue"].delete_one({"id": item_id})
    return res.deleted_count > 0
