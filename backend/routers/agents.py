import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from core.auth import get_current_user
from core.websocket import ws_manager
from core.config import get_db
from models.schemas import BrandInput
from framework.orchestrator import orchestrator

router = APIRouter(prefix="/agents", tags=["agents"])

@router.post("/run")
async def run_agents(body: BrandInput, user=Depends(get_current_user)):
    run_id = str(uuid.uuid4())
    result = await orchestrator.run(body.model_dump(), run_id, user["id"])
    return {
        "run_id": run_id,
        "status": "completed",
        "message": "Pipeline completed successfully.",
        "result": result,
    }

@router.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await ws_manager.connect(websocket, run_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, run_id)

@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    db   = get_db()
    docs = await db["history"].find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    formatted = []
    for doc in docs:
        brand = doc.get("brand") or {}
        result = doc.get("result") or {}
        created_at = doc.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        elif not isinstance(created_at, str) and created_at:
            created_at = str(created_at)
            
        formatted.append({
            "brand_name": brand.get("brand_name", "Unknown Brand"),
            "summary": result.get("executive_summary", "No summary available."),
            "timestamp": created_at,
            "run_id": doc.get("run_id"),
        })
    return formatted

@router.get("/history/{run_id}")
async def get_run(run_id: str, user=Depends(get_current_user)):
    db  = get_db()
    doc = await db["history"].find_one({"run_id": run_id, "user_id": user["id"]}, {"_id": 0})
    return doc or {}

@router.post("/autonomous/trigger/{brand_name}")
async def trigger_autonomous_run(brand_name: str, user=Depends(get_current_user)):
    db = get_db()
    brand = await db["brands"].find_one({"brand_name": brand_name, "user_id": user["id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    from services.background_orchestrator import run_autonomous_cycle_for_brand
    import asyncio
    
    # Run in background task to avoid blocking HTTP response
    asyncio.create_task(run_autonomous_cycle_for_brand(brand))
    return {"message": f"Autonomous orchestration cycle triggered for brand: {brand_name}"}

@router.get("/autonomous/logs")
async def get_autonomous_logs(user=Depends(get_current_user)):
    db = get_db()
    # Return recent actions
    docs = await db["agentic_actions"].find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return docs

@router.get("/autonomous/status")
async def get_autonomous_status(user=Depends(get_current_user)):
    db = get_db()
    from services.background_orchestrator import _running
    autonomous_brands_count = await db["brands"].count_documents({"autonomous": True})
    return {
        "worker_running": _running,
        "autonomous_brands_count": autonomous_brands_count,
        "timestamp": datetime.utcnow().isoformat() if "datetime" in globals() else None
    }
