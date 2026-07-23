import base64
import json
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from core.auth import get_current_user
from core.config import get_db, settings
from core.db_utils import find_many
from core.platforms import normalize_platform

try:
    from cryptography.fernet import Fernet

    _CRYPTO_OK = True
except ImportError:
    _CRYPTO_OK = False

try:
    from services.social_publisher import CREDENTIAL_FIELDS, publish_to_platform

    _API_OK = True
except ImportError:
    _API_OK = False
    CREDENTIAL_FIELDS = {}

router = APIRouter(prefix="/social", tags=["social"])
BASE_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"


class CredentialIn(BaseModel):
    platform: str
    fields: Dict[str, str]


class RealPublishRequest(BaseModel):
    post_id: str = ""
    platform: str
    content: str
    video_url: Optional[str] = None
    video_title: Optional[str] = None
    video_category: Optional[str] = None
    video_privacy: Optional[str] = None
    video_license: Optional[str] = None
    notify_subscribers: Optional[bool] = True
    made_for_kids: Optional[bool] = False


class GenerateMetadataInput(BaseModel):
    topic: str
    tone: Optional[str] = "casual"


def _fernet():
    if not _CRYPTO_OK:
        raise HTTPException(500, "Run: pip install cryptography")

    raw = settings.JWT_SECRET.encode()
    key = base64.urlsafe_b64encode(raw.ljust(32)[:32])
    return Fernet(key)


def _encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()


def _decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


def _save_upload(file: UploadFile, allowed_exts: set[str]) -> dict:
    if not file.filename or "." not in file.filename:
        raise HTTPException(400, "Uploaded file must include a valid file extension.")

    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_exts:
        allowed = ", ".join(sorted(allowed_exts))
        raise HTTPException(400, f"Unsupported file type. Allowed: {allowed}")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename

    with filepath.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/static/uploads/{filename}",
        "filename": file.filename,
        "extension": ext,
    }


@router.get("/credential-fields")
async def get_credential_fields():
    return CREDENTIAL_FIELDS


@router.post("/credentials")
async def save_credentials(body: CredentialIn, user=Depends(get_current_user)):
    db = get_db()
    platform = normalize_platform(body.platform)
    encrypted = {key: _encrypt(value) for key, value in body.fields.items()}

    await db["social_credentials"].update_one(
        {"user_id": user["id"], "platform": platform},
        {
            "$set": {
                "user_id": user["id"],
                "platform": platform,
                "fields": encrypted,
                "saved_at": datetime.utcnow().isoformat(),
            }
        },
        upsert=True,
    )
    return {"saved": True, "platform": platform}


@router.get("/credentials")
async def get_saved_platforms(user=Depends(get_current_user)):
    db = get_db()
    docs = await find_many(
        db["social_credentials"],
        {"user_id": user["id"]},
        {"_id": 0},
        sort=("saved_at", -1),
        limit=20,
    )

    result = []
    for doc in docs:
        fields = doc.get("fields") or {}
        first_key = next(iter(fields), None)
        try:
            preview = _decrypt(fields[first_key])[:4] + "***" if first_key else ""
        except Exception:
            preview = "****"
        result.append(
            {
                "platform": doc["platform"],
                "saved_at": doc.get("saved_at", ""),
                "preview": preview,
            }
        )

    return result


@router.post("/publish")
async def real_publish(body: RealPublishRequest, user=Depends(get_current_user)):
    if not _API_OK:
        raise HTTPException(500, "social_publisher not available - check imports")

    db = get_db()
    platform = normalize_platform(body.platform)
    cred_doc = await db["social_credentials"].find_one(
        {"user_id": user["id"], "platform": platform}
    )

    is_buffer_proxy = False
    if (not cred_doc or not cred_doc.get("fields")) and platform != "Buffer":
        cred_doc = await db["social_credentials"].find_one(
            {"user_id": user["id"], "platform": "Buffer"}
        )
        if cred_doc and cred_doc.get("fields"):
            is_buffer_proxy = True

    if not cred_doc or not cred_doc.get("fields"):
        raise HTTPException(
            400,
            f"No saved credentials for {platform}. Connect it first in the Scheduler (or connect Buffer to proxy it).",
        )

    try:
        creds = {key: _decrypt(value) for key, value in cred_doc["fields"].items()}
    except Exception as exc:
        raise HTTPException(400, "Failed to decrypt credentials - please reconnect the account.") from exc

    merged_creds = {**creds}
    for field in (
        "video_url",
        "video_title",
        "video_category",
        "video_privacy",
        "video_license",
        "notify_subscribers",
        "made_for_kids",
    ):
        value = getattr(body, field, None)
        if value is not None:
            merged_creds[field] = value

    routed_via = "Buffer" if is_buffer_proxy else platform
    result = await publish_to_platform(routed_via, merged_creds, body.content)
    if is_buffer_proxy and result["status"] == "published":
        result["response"] = (
            f"[Buffer Proxy] Routed via Buffer queue to publish to {platform} successfully "
            f"({result.get('response')})"
        )

    published_at = datetime.utcnow().isoformat()
    await db["publish_log"].insert_one(
        {
            "platform": platform,
            "content": body.content[:80] + "...",
            "status": result["status"],
            "response": result["response"],
            "published_at": published_at if result["status"] == "published" else None,
            "retry": result["status"] != "published",
            "triggered_by": "agent_api",
            "user_id": user["id"],
        }
    )

    if body.post_id:
        await db["scheduler"].update_one(
            {"id": body.post_id, "user_id": user["id"]},
            {
                "$set": {
                    "status": result["status"],
                    "published_at": published_at if result["status"] == "published" else None,
                    "api_response": result["response"],
                }
            },
        )

    return {
        **result,
        "platform": platform,
        "published_at": published_at if result["status"] == "published" else None,
        "routed_via": routed_via,
    }


@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...), user=Depends(get_current_user)):
    image_exts = {"gif", "jpeg", "jpg", "png", "webp"}
    video_exts = {"avi", "m4v", "mov", "mp4", "mpeg", "mpg", "webm"}
    payload = _save_upload(file, image_exts | video_exts)
    payload["media_kind"] = "video" if payload["extension"] in video_exts else "image"
    return payload


@router.post("/generate-video-metadata")
async def generate_video_metadata(body: GenerateMetadataInput, user=Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "title": f"Amazing Short about {body.topic}",
            "description": f"Check out this short video about {body.topic}! #shorts #viral #trending",
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
    Do not output any markdown formatting, code block backticks, or extra text. Output only the raw JSON string.
    """

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 300},
                },
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                return json.loads(text.strip())
        except Exception:
            pass

    return {
        "title": f"Amazing Short about {body.topic}",
        "description": f"Check out this short video about {body.topic}! #shorts #viral #trending",
    }
