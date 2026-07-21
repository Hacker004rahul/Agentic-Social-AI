from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, run_id: str):
        await websocket.accept()
        self.active.setdefault(run_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, run_id: str):
        if run_id in self.active:
            self.active[run_id] = [w for w in self.active[run_id] if w != websocket]

    async def broadcast(self, run_id: str, data: dict):
        dead = []
        for ws in self.active.get(run_id, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, run_id)

    async def broadcast_all(self, data: dict):
        for run_id in list(self.active.keys()):
            await self.broadcast(run_id, data)

ws_manager = ConnectionManager()
