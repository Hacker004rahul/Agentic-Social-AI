from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from core.platforms import normalize_platforms

# ── Enums ──────────────────────────────────────────────────
class AgentStatus(str, Enum):
    WAITING   = "WAITING"
    THINKING  = "THINKING"
    PLANNING  = "PLANNING"
    RUNNING   = "RUNNING"
    TOOL_CALL = "CALLING TOOL"
    VALIDATING= "VALIDATING"
    REFLECTING= "REFLECTING"
    SUCCESS   = "SUCCESS"
    FAILED    = "FAILED"
    RETRY     = "RETRY"
    SKIPPED   = "SKIPPED"

class TaskStatus(str, Enum):
    PENDING   = "PENDING"
    RUNNING   = "RUNNING"
    SUCCESS   = "SUCCESS"
    FAILED    = "FAILED"
    SKIPPED   = "SKIPPED"

# ── Auth ───────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ── Brand ──────────────────────────────────────────────────
class BrandInput(BaseModel):
    brand_name:        str
    industry:          str = "general"
    target_audience:   str
    platforms:         List[str] = ["Instagram"]
    offer:             str = ""
    competitors:       List[str] = []
    tone:              str = "casual"
    campaign_goal:     str = "awareness"
    budget:            str = ""
    posting_frequency: str = "daily"
    constraints:       str = ""
    autonomous:        bool = False
    autonomous_interval_hours: int = 24
    last_autonomous_run_at: Optional[str] = None

    @field_validator("platforms", mode="before")
    @classmethod
    def normalize_platform_ids(cls, value):
        return normalize_platforms(value)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        schema = handler(source_type)
        return schema

# ── Task ───────────────────────────────────────────────────
class Task(BaseModel):
    id:           str
    agent:        str
    priority:     int = 5
    dependencies: List[str] = []
    status:       TaskStatus = TaskStatus.PENDING
    retry_count:  int = 0
    created_at:   datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    result:       Optional[Dict[str, Any]] = None
    error:        Optional[str] = None

# ── Agent Log ──────────────────────────────────────────────
class AgentLog(BaseModel):
    agent:      str
    status:     AgentStatus
    thought:    Optional[str] = None
    plan:       Optional[str] = None
    tool_calls: List[str] = []
    output:     Optional[Dict[str, Any]] = None
    confidence: float = 0.0
    ms:         int = 0
    timestamp:  datetime = Field(default_factory=datetime.utcnow)

# ── Publish Request ────────────────────────────────────────
# Now handled by /social/publish (real API publishing)
# kept for backwards compatibility
class PublishRequest(BaseModel):
    post_id: str
