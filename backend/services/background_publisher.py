import asyncio
from datetime import datetime, timedelta

from core.config import get_db
from core.db_utils import find_many
from core.platforms import normalize_platform
from core.publishing import parse_publish_datetime
from routers.social import _decrypt
from services.social_publisher import publish_to_platform

_running = False


async def _find_credentials(db, platform: str, user_id: str | None):
    query = {"platform": platform}
    if user_id:
        query["user_id"] = user_id

    cred_doc = await db["social_credentials"].find_one(query)
    if not cred_doc or not cred_doc.get("fields"):
        fallback_query = {"platform": platform}
        cred_doc = await db["social_credentials"].find_one(fallback_query)

    is_buffer_proxy = False
    if (not cred_doc or not cred_doc.get("fields")) and platform != "Buffer":
        buffer_query = {"platform": "Buffer"}
        if user_id:
            buffer_query["user_id"] = user_id
        cred_doc = await db["social_credentials"].find_one(buffer_query)
        if not cred_doc or not cred_doc.get("fields"):
            cred_doc = await db["social_credentials"].find_one({"platform": "Buffer"})
        if cred_doc and cred_doc.get("fields"):
            is_buffer_proxy = True

    return cred_doc, is_buffer_proxy


def _is_due(scheduled_at) -> bool:
    scheduled_dt = parse_publish_datetime(scheduled_at)
    if scheduled_dt is None:
        return False
    return scheduled_dt <= datetime.utcnow()


async def start_background_publisher():
    global _running
    if _running:
        return

    _running = True
    print("[+] Autonomous Agent Background Publisher Worker started.")

    while _running:
        try:
            db = get_db()
            posts = await find_many(
                db["scheduler"],
                {"status": "scheduled"},
                sort=("created_at", 1),
                limit=50,
            )
            for post in posts:
                if not _is_due(post.get("scheduled_at")):
                    continue

                platform = normalize_platform(post.get("platform", ""))
                if not platform:
                    continue

                user_id = post.get("user_id")
                cred_doc, is_buffer_proxy = await _find_credentials(db, platform, user_id)
                if not cred_doc or not cred_doc.get("fields"):
                    continue

                try:
                    creds = {key: _decrypt(value) for key, value in cred_doc["fields"].items()}
                except Exception:
                    continue

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
                    if field in post:
                        merged_creds[field] = post[field]

                routed_via = "Buffer" if is_buffer_proxy else platform
                result = await publish_to_platform(routed_via, merged_creds, post.get("content", ""))
                if is_buffer_proxy and result["status"] == "published":
                    result["response"] = (
                        f"[Buffer Proxy] Routed via Buffer queue to publish to {platform} successfully "
                        f"({result.get('response')})"
                    )

                published_at = datetime.utcnow().isoformat()
                await db["scheduler"].update_one(
                    {"id": post["id"]},
                    {
                        "$set": {
                            "status": result["status"],
                            "published_at": published_at if result["status"] == "published" else None,
                            "api_response": result["response"],
                        }
                    },
                )

                await db["publish_log"].insert_one(
                    {
                        "platform": platform,
                        "content": post.get("content", "")[:80] + "...",
                        "status": result["status"],
                        "response": result["response"],
                        "published_at": published_at if result["status"] == "published" else None,
                        "retry": result["status"] != "published",
                        "triggered_by": "agent_auto_worker",
                        "user_id": cred_doc.get("user_id", ""),
                    }
                )

            video_queue = await find_many(
                db["publishing_queue"],
                {"status": "scheduled"},
                sort=("scheduled_at", 1),
                limit=50,
            )
            for item in video_queue:
                if not _is_due(item.get("scheduled_at")):
                    continue

                await db["publishing_queue"].update_one(
                    {"id": item["id"]},
                    {"$set": {"status": "publishing"}},
                )

                platform = normalize_platform(item.get("platform", ""))
                user_id = item.get("user_id")
                cred_doc, is_buffer_proxy = await _find_credentials(db, platform, user_id)
                if not cred_doc or not cred_doc.get("fields"):
                    await db["publishing_queue"].update_one(
                        {"id": item["id"]},
                        {"$set": {"status": "failed", "error_message": "No publishing credentials found"}},
                    )
                    continue

                try:
                    creds = {key: _decrypt(value) for key, value in cred_doc["fields"].items()}
                except Exception:
                    await db["publishing_queue"].update_one(
                        {"id": item["id"]},
                        {"$set": {"status": "failed", "error_message": "Failed to decrypt credentials"}},
                    )
                    continue

                creds["video_url"] = item.get("video_url")
                creds["video_title"] = item.get("content", "")[:60]

                routed_via = "Buffer" if is_buffer_proxy else platform
                result = await publish_to_platform(routed_via, creds, item.get("content", ""))

                published_at = datetime.utcnow().isoformat()
                if result["status"] == "published":
                    await db["publishing_queue"].update_one(
                        {"id": item["id"]},
                        {"$set": {"status": "published", "last_attempt_at": published_at}},
                    )
                    continue

                retry_count = item.get("retry_count", 0) + 1
                if retry_count >= 3:
                    await db["publishing_queue"].update_one(
                        {"id": item["id"]},
                        {
                            "$set": {
                                "status": "failed",
                                "retry_count": retry_count,
                                "error_message": result.get("response", "API Error"),
                                "last_attempt_at": published_at,
                            }
                        },
                    )
                    continue

                backoff_minutes = 2 ** retry_count
                next_retry = datetime.utcnow() + timedelta(minutes=backoff_minutes)
                await db["publishing_queue"].update_one(
                    {"id": item["id"]},
                    {
                        "$set": {
                            "status": "scheduled",
                            "retry_count": retry_count,
                            "scheduled_at": next_retry.isoformat(),
                            "error_message": f"Attempt {retry_count} failed: {result.get('response')}",
                            "last_attempt_at": published_at,
                        }
                    },
                )
        except Exception:
            pass

        await asyncio.sleep(10)
