import asyncio
import uuid
from datetime import datetime, timedelta
from core.config import get_db
from core.platforms import normalize_platform
from framework.orchestrator import orchestrator
from services.social_publisher import publish_to_platform
from routers.social import _decrypt

_running = False

async def start_background_orchestrator():
    global _running
    if _running:
        return
    _running = True
    print("[+] Autonomous Agent Background Orchestrator Worker started.")

    while _running:
        try:
            db = get_db()
            # Fetch all brands that have autonomous = True
            brands = await db["brands"].find({"autonomous": True}).to_list(100)
            for brand in brands:
                last_run = brand.get("last_autonomous_run_at")
                interval_hours = brand.get("autonomous_interval_hours", 24)
                
                should_run = False
                if not last_run:
                    should_run = True
                else:
                    try:
                        last_run_dt = datetime.fromisoformat(last_run)
                        if datetime.utcnow() - last_run_dt >= timedelta(hours=interval_hours):
                            should_run = True
                    except Exception:
                        should_run = True
                
                if should_run:
                    await run_autonomous_cycle_for_brand(brand)
        except Exception as exc:
            print(f"[Autopilot Autonomous Orchestrator] Error in worker cycle: {exc}")
            
        await asyncio.sleep(20) # Check every 20 seconds for demo responsiveness

async def run_autonomous_cycle_for_brand(brand: dict):
    db = get_db()
    brand_name = brand.get("brand_name")
    user_id = brand.get("user_id")
    run_id = str(uuid.uuid4())
    
    print(f"[Autopilot Autonomous Orchestrator] Starting autonomous cycle for '{brand_name}'...")
    
    # 1. Log start of autonomous run
    await db["agentic_actions"].insert_one({
        "id": str(uuid.uuid4()),
        "brand_name": brand_name,
        "run_id": run_id,
        "action_type": "autonomous_orchestration",
        "status": "started",
        "timestamp": datetime.utcnow().isoformat(),
        "message": f"Autonomous orchestration cycle initiated for brand: {brand_name}"
    })
    
    try:
        # 2. Run the multi-agent orchestrator team
        result = await orchestrator.run(brand, run_id, user_id)
        
        # 3. Update brand last run timestamp
        await db["brands"].update_one(
            {"brand_name": brand_name, "user_id": user_id},
            {"$set": {"last_autonomous_run_at": datetime.utcnow().isoformat()}}
        )
        
        # 4. Handle autonomous inbox replies
        inbox = result.get("inbox", {})
        comments = inbox.get("comments", [])
        replied_count = 0
        
        for comment in comments[:3]: # reply to up to 3 comments to prevent rate limit
            platform = normalize_platform(comment.get("platform", ""))
            if not platform:
                continue
                
            # check credentials
            cred_doc = await db["social_credentials"].find_one({"user_id": user_id, "platform": platform})
            if not cred_doc or not cred_doc.get("fields"):
                # fallback/demo credentials if none configured
                creds = {"token_type": "demo", "access_token": "demo-token"}
            else:
                try:
                    creds = {k: _decrypt(v) for k, v in cred_doc["fields"].items()}
                except Exception:
                    creds = {"token_type": "demo", "access_token": "demo-token"}
                    
            reply_text = f"Reply to {comment.get('user')}: {comment.get('smart_reply')}"
            
            # Publish reply to platform (live or mock)
            pub_res = await publish_to_platform(platform, creds, reply_text)
            
            if pub_res.get("status") == "published":
                replied_count += 1
                await db["publish_log"].insert_one({
                    "platform": platform,
                    "content": reply_text[:80] + "...",
                    "status": "published",
                    "response": pub_res.get("response", "Replied successfully"),
                    "published_at": datetime.utcnow().isoformat(),
                    "retry": False,
                    "triggered_by": "agent_auto_replier",
                    "user_id": user_id,
                })
        
        # 5. Log completion
        summary = result.get("executive_summary", "")
        message = f"Orchestrated successfully. Generated posts and automatically replied to {replied_count} comments."
        await db["agentic_actions"].update_one(
            {"run_id": run_id},
            {"$set": {
                "status": "success",
                "message": f"{message} Summary: {summary[:100]}..."
            }}
        )
        print(f"[Autopilot Autonomous Orchestrator] Successfully completed cycle for '{brand_name}'")
        
    except Exception as e:
        print(f"[Autopilot Autonomous Orchestrator] Failed cycle for '{brand_name}': {e}")
        await db["agentic_actions"].update_one(
            {"run_id": run_id},
            {"$set": {
                "status": "failed",
                "message": f"Autonomous cycle failed: {str(e)}"
            }}
        )
