import uuid
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from models.schemas import AgentStatus, TaskStatus, Task
from core.websocket import ws_manager
from core.config import get_db
import tools.tools  # register all tools

class Orchestrator:
    AGENT_ORDER = [
        "StrategyAgent","TrendAgent","ContentAgent","BrandVoiceAgent",
        "EngagementAgent","AnalyticsAgent","SuggestionAgent","CompetitorAgent",
        "CampaignAgent","SchedulerAgent","RecycleAgent","InboxAgent","PublisherAgent",
    ]

    def __init__(self):
        from agents.all_agents import (
            StrategyAgent, TrendAgent, ContentAgent, BrandVoiceAgent,
            EngagementAgent, AnalyticsAgent, SuggestionAgent, CompetitorAgent,
            CampaignAgent, SchedulerAgent, RecycleAgent, InboxAgent, PublisherAgent,
        )
        self.agents = {
            "StrategyAgent":   StrategyAgent(),
            "TrendAgent":      TrendAgent(),
            "ContentAgent":    ContentAgent(),
            "BrandVoiceAgent": BrandVoiceAgent(),
            "EngagementAgent": EngagementAgent(),
            "AnalyticsAgent":  AnalyticsAgent(),
            "SuggestionAgent": SuggestionAgent(),
            "CompetitorAgent": CompetitorAgent(),
            "CampaignAgent":   CampaignAgent(),
            "SchedulerAgent":  SchedulerAgent(),
            "RecycleAgent":    RecycleAgent(),
            "InboxAgent":      InboxAgent(),
            "PublisherAgent":  PublisherAgent(),
        }

    async def run(self, brand: dict, run_id: str, user_id: str) -> Dict[str, Any]:
        db       = get_db()
        tasks    = self._build_tasks()
        context  = {}
        logs     = []
        trace    = []

        await ws_manager.broadcast(run_id, {"type":"start","run_id":run_id,"total":len(tasks)})

        for task in tasks:
            agent_name = task["agent"]
            agent      = self.agents.get(agent_name)
            if not agent:
                continue

            # broadcast THINKING
            await ws_manager.broadcast(run_id, {"type":"agent_status","agent":agent_name,"status":AgentStatus.THINKING,"task_id":task["id"]})
            await asyncio.sleep(0.05)

            # build kwargs from context
            kwargs = self._build_kwargs(agent_name, context)

            # broadcast RUNNING
            await ws_manager.broadcast(run_id, {"type":"agent_status","agent":agent_name,"status":AgentStatus.RUNNING,"task_id":task["id"]})

            log = agent.run(brand, **kwargs)

            if log.status == AgentStatus.SUCCESS:
                context[agent_name] = log.output
                task["status"]      = TaskStatus.SUCCESS
                task["completed_at"]= datetime.utcnow().isoformat()
            else:
                task["status"] = TaskStatus.FAILED

            trace.append({"agent":agent_name,"status":log.status,"ms":log.ms,"confidence":log.confidence,"thought":log.thought,"plan":log.plan,"tool_calls":log.tool_calls})
            logs.append(log.dict())

            await ws_manager.broadcast(run_id, {
                "type":       "agent_done",
                "agent":      agent_name,
                "status":     log.status,
                "ms":         log.ms,
                "confidence": log.confidence,
                "thought":    log.thought,
                "task_id":    task["id"],
            })

        result = self._compile_result(brand, context, trace)

        # persist to MongoDB
        doc = {
            "run_id":    run_id,
            "user_id":   user_id,
            "brand":     brand,
            "result":    result,
            "trace":     trace,
            "tasks":     tasks,
            "created_at":datetime.utcnow(),
        }
        await db["history"].insert_one(doc)

        # save to queue
        posts = context.get("ContentAgent",{}).get("posts",[])
        if posts:
            from tools.tools import SchedulerTool
            st = SchedulerTool()
            scheduled = st.run(posts=posts)
            for p in scheduled:
                p["run_id"]     = run_id
                p["id"]         = str(uuid.uuid4())
                p["created_at"] = datetime.utcnow()
                await db["scheduler"].insert_one(p)
            

        await ws_manager.broadcast(run_id, {"type":"complete","run_id":run_id,"result":result})
        return result

    def _build_tasks(self) -> List[Dict]:
        return [{"id":str(uuid.uuid4()),"agent":a,"priority":i+1,"status":TaskStatus.PENDING,"retry_count":0,"created_at":datetime.utcnow().isoformat(),"completed_at":None} for i,a in enumerate(self.AGENT_ORDER)]

    def _build_kwargs(self, agent_name: str, context: Dict) -> Dict:
        strategy  = context.get("StrategyAgent",{})
        trends    = context.get("TrendAgent",{})
        content   = context.get("ContentAgent",{})
        analytics = context.get("AnalyticsAgent",{})
        posts     = content.get("posts",[])
        mapping = {
            "ContentAgent":    {"strategy":strategy,"trends":trends},
            "BrandVoiceAgent": {"posts":posts},
            "AnalyticsAgent":  {},
            "SuggestionAgent": {"analytics":analytics},
            "CampaignAgent":   {"strategy":strategy,"trends":trends},
            "SchedulerAgent":  {"posts":posts},
            "RecycleAgent":    {"posts":posts},
            "PublisherAgent":  {"posts":posts},
        }
        return mapping.get(agent_name, {})

    def _compile_result(self, brand: dict, context: Dict, trace: List) -> Dict:
        publisher = context.get("PublisherAgent",{})
        analytics = context.get("AnalyticsAgent",{})
        inbox     = context.get("InboxAgent",{})
        recycle   = context.get("RecycleAgent",{})
        strategy  = context.get("StrategyAgent",{})
        summary   = (
            f"{brand.get('brand_name')} ({brand.get('target_audience')}) — "
            f"{strategy.get('goal','awareness')} campaign across {', '.join(brand.get('platforms',['Instagram']))}. "
            f"{publisher.get('published',0)} posts published. "
            f"Best platform: {analytics.get('best_platform','N/A')} "
            f"({analytics.get('total_reach',0):,} reach). "
            f"Inbox: {inbox.get('unread_count',0)} messages."
        )
        return {
            "executive_summary": summary,
            "workflow_trace":    trace,
            "strategy":          context.get("StrategyAgent",{}),
            "trends":            context.get("TrendAgent",{}),
            "content":           context.get("ContentAgent",{}),
            "engagement":        context.get("EngagementAgent",{}),
            "analytics":         analytics,
            "suggestions":       context.get("SuggestionAgent",{}),
            "brand_voice":       context.get("BrandVoiceAgent",{}),
            "competitor":        context.get("CompetitorAgent",{}),
            "campaign":          context.get("CampaignAgent",{}),
            "scheduler":         context.get("SchedulerAgent",{}),
            "recycle":           recycle,
            "inbox":             inbox,
            "publisher":         publisher,
        }

orchestrator = Orchestrator()
