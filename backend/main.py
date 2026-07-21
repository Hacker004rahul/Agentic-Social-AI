from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import connect_db, close_db
from routers import auth, agents, scheduler, analytics, brands
from routers import social
from routers import oauth

app = FastAPI(title="Agentic Social AI", version="4.0.0", docs_url="/docs")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

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
    except Exception as exc:
        print(f"⚠️ DB warning: {exc}")

@app.on_event("shutdown")
async def shutdown():
    await close_db()

@app.get("/")
async def root():
    return {"app": "Agentic Social AI", "version": "4.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
