# Agentic Social AI

A production-oriented, dark-mode SaaS experience for autonomous social media campaign orchestration.

## Included capabilities
- FastAPI backend with modular routers, authentication, orchestration, and agent execution
- Autonomous multi-agent workflow with a base agent abstraction and orchestrator
- Mongo-backed memory and history for campaigns, tasks, and publishing logs
- Premium React + Vite dashboard for launching campaigns and reviewing outputs
- WebSocket-ready execution stream for agent progress and pipeline updates

## Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```

## API
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /agents/run
- GET /agents/history
- GET /analytics/db-status
- GET /scheduler/queue
- POST /scheduler/publish
