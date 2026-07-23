import base64
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from core.auth import get_current_user
from core.config import get_db, settings
from core.platforms import normalize_platform

try:
    from cryptography.fernet import Fernet
    _CRYPTO_OK = True
except ImportError:
    _CRYPTO_OK = False

try:
    from services.social_publisher import publish_to_platform, CREDENTIAL_FIELDS
    _API_OK = True
except ImportError:
    _API_OK = False
    CREDENTIAL_FIELDS = {}

router = APIRouter(prefix="/social", tags=["social"])


def _fernet():
    if not _CRYPTO_OK:
        raise HTTPException(500, "Run: pip install cryptography")
    from cryptography.fernet import Fernet
    raw = settings.JWT_SECRET.encode()
    key = base64.urlsafe_b64encode(raw.ljust(32)[:32])
    return Fernet(key)

def _encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()

def _decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


from typing import Dict, Optional
import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile

# ── Schemas ────────────────────────────────────────────────
class CredentialIn(BaseModel):
    platform: str
    fields:   Dict[str, str]   # e.g. {"access_token": "...", "ig_user_id": "..."}

class RealPublishRequest(BaseModel):
    post_id:  str
    platform: str
    content:  str
    video_url:          Optional[str] = None
    video_title:        Optional[str] = None
    video_category:     Optional[str] = None
    video_privacy:      Optional[str] = None
    video_license:      Optional[str] = None
    notify_subscribers: Optional[bool] = None
    made_for_kids:      Optional[bool] = None


# ── Return field definitions so frontend renders correct form
@router.get("/credential-fields")
async def get_credential_fields():
    return CREDENTIAL_FIELDS


# ── Save credentials (all fields encrypted individually) ───
@router.post("/credentials")
async def save_credentials(body: CredentialIn, user=Depends(get_current_user)):
    db = get_db()
    platform = normalize_platform(body.platform)
    encrypted = {k: _encrypt(v) for k, v in body.fields.items()}
    await db["social_credentials"].update_one(
        {"user_id": user["id"], "platform": platform},
        {"$set": {
            "user_id":  user["id"],
            "platform": platform,
            "fields":   encrypted,
            "saved_at": datetime.utcnow().isoformat(),
        }},
        upsert=True,
    )
    return {"saved": True, "platform": platform}


# ── List saved platforms (masked) ─────────────────────────
@router.get("/credentials")
async def get_saved_platforms(user=Depends(get_current_user)):
    db   = get_db()
    docs = await db["social_credentials"].find({"user_id": user["id"]}).to_list(20)
    result = []
    for d in docs:
        fields    = d.get("fields") or {}
        first_key = next(iter(fields), None)
        try:
            preview = _decrypt(fields[first_key])[:4] + "***" if first_key else ""
        except Exception:
            preview = "****"
        result.append({"platform": d["platform"], "saved_at": d.get("saved_at", ""), "preview": preview})
    return result


# ── Real publish via official API ─────────────────────────
@router.post("/publish")
async def real_publish(body: RealPublishRequest, user=Depends(get_current_user)):
    if not _API_OK:
        raise HTTPException(500, "social_publisher not available — check imports")

    db   = get_db()
    platform = normalize_platform(body.platform)
    doc  = await db["social_credentials"].find_one(
        {"user_id": user["id"], "platform": platform}
    )
    is_buffer_proxy = False
    if not doc or not doc.get("fields"):
        if platform != "Buffer":
            doc = await db["social_credentials"].find_one(
                {"user_id": user["id"], "platform": "Buffer"}
            )
            if doc and doc.get("fields"):
                is_buffer_proxy = True

    if not doc or not doc.get("fields"):
        raise HTTPException(400, f"No saved credentials for {platform}. Connect it first in the Scheduler (or connect Buffer to proxy it).")

    try:
        creds = {k: _decrypt(v) for k, v in doc["fields"].items()}
    except Exception:
        raise HTTPException(400, "Failed to decrypt credentials — please re-enter them.")

    target_pub_platform = "Buffer" if is_buffer_proxy else platform
    
    # Merge video parameters from request body
    merged_creds = {**creds}
    if body.video_url:
        merged_creds["video_url"] = body.video_url
    if body.video_title:
        merged_creds["video_title"] = body.video_title
    if body.video_category:
        merged_creds["video_category"] = body.video_category
    if body.video_privacy:
        merged_creds["video_privacy"] = body.video_privacy
    if body.video_license:
        merged_creds["video_license"] = body.video_license
    if body.notify_subscribers is not None:
        merged_creds["notify_subscribers"] = body.notify_subscribers
    if body.made_for_kids is not None:
        merged_creds["made_for_kids"] = body.made_for_kids

    result       = await publish_to_platform(target_pub_platform, merged_creds, body.content)
    if is_buffer_proxy and result["status"] == "published":
        result["response"] = f"[Buffer Proxy] Routed via Buffer queue to publish to {platform} ✅ ({result.get('response')})"
    published_at = datetime.utcnow().isoformat()

    await db["publish_log"].insert_one({
        "platform":     platform,
        "content":      body.content[:80] + "...",
        "status":       result["status"],
        "response":     result["response"],
        "published_at": published_at if result["status"] == "published" else None,
        "retry":        result["status"] != "published",
        "triggered_by": "agent_api",
        "user_id":      user["id"],
    })

    if body.post_id:
        await db["scheduler"].update_one(
            {"id": body.post_id},
            {"$set": {"status": result["status"], "published_at": published_at}}
        )

    return result


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["mp4", "mov", "avi", "mkv", "webm"]:
        raise HTTPException(400, "Only video files are allowed.")
    
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("static", "uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "url": f"/static/uploads/{filename}",
        "filename": file.filename
    }


class GenerateMetadataInput(BaseModel):
    topic: str
    tone: Optional[str] = "casual"

@router.post("/generate-video-metadata")
async def generate_video_metadata(body: GenerateMetadataInput, user=Depends(get_current_user)):
    import httpx
    import json
    api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not api_key:
        return {
            "title": f"Amazing Short about {body.topic}",
            "description": f"Check out this short video about {body.topic}! #shorts #viral #trending"
        }
        
    prompt = f"""
    You are an AI Video Metadata Specialist.
    Generate a catchy YouTube Shorts/Video title (under 100 characters) and a detailed description (including 3 relevant hashtags).
    Topic: {body.topic}
    Tone: {body.tone}
    
    Output format MUST be valid JSON exactly like this:
    {{
        "title": "Title here",
        "description": "Description here"
    }}
    Do not output any markdown formatting, code block backticks (like ```json), or extra text. Output ONLY the raw JSON string.
    """
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 300}
                },
                headers={"Content-Type": "application/json"}
            )
            if r.status_code == 200:
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                parsed = json.loads(text.strip())
                return parsed
        except Exception:
            pass
            
    return {
        "title": f"Amazing Short about {body.topic}",
        "description": f"Check out this short video about {body.topic}! #shorts #viral #trending"
    }
