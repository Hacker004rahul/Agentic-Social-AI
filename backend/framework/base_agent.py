import time
import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
from models.schemas import AgentStatus, AgentLog
from core.config import get_db

class BaseAgent(ABC):
    name: str = "BaseAgent"
    description: str = ""

    def __init__(self):
        self.status: AgentStatus = AgentStatus.WAITING
        self.goal: str = ""
        self.context: Dict[str, Any] = {}
        self.memory: List[Dict] = []
        self.tools: List[str] = []
        self.confidence: float = 0.0
        self.logs: List[str] = []
        self.tool_calls: List[str] = []
        self._start_time: float = 0

    # ── Lifecycle ──────────────────────────────────────────
    def think(self, brand: dict) -> str:
        self._set_status(AgentStatus.THINKING)
        thought = self._think(brand)
        self.logs.append(f"[THINK] {thought}")
        return thought

    def plan(self, thought: str) -> str:
        self._set_status(AgentStatus.PLANNING)
        plan = self._plan(thought)
        self.logs.append(f"[PLAN] {plan}")
        return plan

    def execute(self, brand: dict, **kwargs) -> Dict[str, Any]:
        self._set_status(AgentStatus.RUNNING)
        self._start_time = time.time()
        result = self._execute(brand, **kwargs)
        return result

    def observe(self, result: Dict) -> str:
        observation = self._observe(result)
        self.logs.append(f"[OBSERVE] {observation}")
        return observation

    def reflect(self, result: Dict) -> float:
        self._set_status(AgentStatus.REFLECTING)
        score = self._reflect(result)
        self.confidence = score
        self.logs.append(f"[REFLECT] confidence={score:.2f}")
        return score

    def validate(self, result: Dict) -> bool:
        self._set_status(AgentStatus.VALIDATING)
        valid = self._validate(result)
        self.logs.append(f"[VALIDATE] {'pass' if valid else 'fail'}")
        return valid

    def call_tool(self, tool_name: str, **kwargs) -> Any:
        self._set_status(AgentStatus.TOOL_CALL)
        self.tool_calls.append(tool_name)
        self.logs.append(f"[TOOL] calling {tool_name}")
        from tools.registry import tool_registry
        tool = tool_registry.get(tool_name)
        if tool:
            return tool.run(**kwargs)
        return {}

    async def update_memory(self, brand: dict, result: Dict):
        try:
            db = get_db()
            await db["memory"].insert_one({
                "agent":      self.name,
                "brand":      brand.get("brand_name"),
                "input":      brand,
                "output":     result,
                "confidence": self.confidence,
                "timestamp":  datetime.utcnow(),
            })
        except Exception:
            pass

    def call_next_agent(self, agent_name: str, brand: dict, **kwargs):
        from framework.registry import agent_registry
        agent = agent_registry.get(agent_name)
        if agent:
            return agent.run(brand, **kwargs)
        return {}

    # ── Main run ───────────────────────────────────────────
    def run(self, brand: dict, **kwargs) -> AgentLog:
        t0 = time.time()
        try:
            thought  = self.think(brand)
            plan     = self.plan(thought)
            result   = self.execute(brand, **kwargs)
            self.observe(result)
            score    = self.reflect(result)
            valid    = self.validate(result)

            if not valid and score < 0.5:
                self._set_status(AgentStatus.RETRY)
                result = self.execute(brand, **kwargs)
                self.reflect(result)

            self._set_status(AgentStatus.SUCCESS)
            ms = int((time.time() - t0) * 1000)
            return AgentLog(
                agent=self.name, status=AgentStatus.SUCCESS,
                thought=thought, plan=plan,
                tool_calls=self.tool_calls, output=result,
                confidence=self.confidence, ms=ms,
            )
        except Exception as e:
            self._set_status(AgentStatus.FAILED)
            ms = int((time.time() - t0) * 1000)
            return AgentLog(
                agent=self.name, status=AgentStatus.FAILED,
                output={"error": str(e)}, ms=ms,
            )

    # ── Abstract methods ───────────────────────────────────
    @abstractmethod
    def _think(self, brand: dict) -> str: ...

    @abstractmethod
    def _plan(self, thought: str) -> str: ...

    @abstractmethod
    def _execute(self, brand: dict, **kwargs) -> Dict[str, Any]: ...

    def _observe(self, result: Dict) -> str:
        return f"Produced {len(result)} output keys"

    def _reflect(self, result: Dict) -> float:
        return 0.9 if result else 0.1

    def _validate(self, result: Dict) -> bool:
        return bool(result)

    def _set_status(self, status: AgentStatus):
        self.status = status
