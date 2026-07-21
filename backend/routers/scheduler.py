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
