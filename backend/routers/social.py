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


# ── Schemas ────────────────────────────────────────────────
class CredentialIn(BaseModel):
    platform: str
    fields:   Dict[str, str]   # e.g. {"access_token": "...", "ig_user_id": "..."}

class RealPublishRequest(BaseModel):
    post_id:  str
    platform: str
    content:  str


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
    result       = await publish_to_platform(target_pub_platform, creds, body.content)
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
