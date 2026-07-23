import sys
import io

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import connect_db, close_db
from routers import auth, agents, scheduler, analytics, brands
from routers import social
from routers import oauth

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Agentic Social AI", version="4.0.0", docs_url="/docs")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(scheduler.router)
app.include_router(analytics.router)
app.include_router(brands.router)
app.include_router(social.router)
app.include_router(oauth.router)

@app.on_event("startup")
async def startup():
    try:
        await connect_db()
        import asyncio
        from services.background_publisher import start_background_publisher
        from services.background_orchestrator import start_background_orchestrator
        asyncio.create_task(start_background_publisher())
        asyncio.create_task(start_background_orchestrator())
    except Exception as exc:
        print(f"[!] DB warning: {exc}")

@app.on_event("shutdown")
async def shutdown():
    await close_db()

@app.get("/")
async def root():
    return {"app": "Agentic Social AI", "version": "4.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
