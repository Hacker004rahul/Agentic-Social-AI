from fastapi import APIRouter, Depends
from core.auth import get_current_user
from core.config import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
async def analytics_summary(user=Depends(get_current_user)):
    db    = get_db()
    runs  = await db["history"].count_documents({"user_id": user["id"]})
    queue = await db["scheduler"].count_documents({})
    pub   = await db["scheduler"].count_documents({"status": "published"})
    pool  = await db["evergreen"].count_documents({}) if "evergreen" in await db.list_collection_names() else 0
    return {"total_runs": runs, "total_queued": queue, "total_published": pub, "evergreen_pool": pool}

@router.get("/db-status")
async def db_status():
    try:
        db   = get_db()
        await db.command("ping")
        cols = await db.list_collection_names()
        return {"status": "connected", "database": "agentic_social_ai", "collections": cols}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}
