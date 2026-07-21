import uuid
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
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
    return docs

@router.get("/history/{run_id}")
async def get_run(run_id: str, user=Depends(get_current_user)):
    db  = get_db()
    doc = await db["history"].find_one({"run_id": run_id, "user_id": user["id"]}, {"_id": 0})
    return doc or {}
