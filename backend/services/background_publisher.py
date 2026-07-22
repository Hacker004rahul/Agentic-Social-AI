import asyncio
import json
from datetime import datetime
from core.config import get_db
from core.platforms import normalize_platform
from routers.social import _decrypt
from services.social_publisher import publish_to_platform

_running = False

async def start_background_publisher():
    global _running
    if _running:
        return
    _running = True
    print("[+] Autonomous Agent Background Publisher Worker started.")

    while _running:
        try:
            db = get_db()
            posts = await db["scheduler"].find({"status": "scheduled"}).to_list(50)
            for post in posts:
                platform = normalize_platform(post.get("platform", ""))
                if not platform:
                    continue

                user_id = post.get("user_id")
                query = {"platform": platform}
                if user_id:
                    query["user_id"] = user_id

                cred_doc = await db["social_credentials"].find_one(query)
                if not cred_doc or not cred_doc.get("fields"):
                    cred_doc = await db["social_credentials"].find_one({"platform": platform})

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

                if not cred_doc or not cred_doc.get("fields"):
                    continue

                try:
                    creds = {k: _decrypt(v) for k, v in cred_doc["fields"].items()}
                except Exception:
                    continue

                target_pub_platform = "Buffer" if is_buffer_proxy else platform
                print(f"[🤖 Agent Auto-Publisher] Auto-publishing queued post ID {post.get('id')} to {platform} (via Buffer Proxy: {is_buffer_proxy})...")
                result = await publish_to_platform(target_pub_platform, creds, post.get("content", ""))
                if is_buffer_proxy and result["status"] == "published":
                    result["response"] = f"[Buffer Proxy] Routed via Buffer queue to publish to {platform} ✅ ({result.get('response')})"
                published_at = datetime.utcnow().isoformat()

                await db["scheduler"].update_one(
                    {"id": post["id"]},
                    {"$set": {
                        "status": result["status"],
                        "published_at": published_at,
                        "api_response": result["response"]
                    }}
                )

                await db["publish_log"].insert_one({
                    "platform":     platform,
                    "content":      post.get("content", "")[:80] + "...",
                    "status":       result["status"],
                    "response":     result["response"],
                    "published_at": published_at if result["status"] == "published" else None,
                    "retry":        result["status"] != "published",
                    "triggered_by": "agent_auto_worker",
                    "user_id":      cred_doc.get("user_id", ""),
                })
        except Exception as exc:
            pass

        await asyncio.sleep(10)
