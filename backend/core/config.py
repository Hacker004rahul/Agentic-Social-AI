import json
import os
import time
import uuid
from pathlib import Path
from threading import Lock
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGO_URI: str
    DB_NAME: str = "agentic_social_ai"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    # OAuth app credentials
    LINKEDIN_CLIENT_ID:     str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    X_CLIENT_ID:            str = ""
    X_CLIENT_SECRET:        str = ""
    META_CLIENT_ID:         str = ""
    META_CLIENT_SECRET:     str = ""
    GOOGLE_CLIENT_ID:       str = ""
    GOOGLE_CLIENT_SECRET:   str = ""
    OAUTH_REDIRECT_BASE:    str = "http://localhost:8000"

settings = Settings()

class _InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class LocalCursor(list):
    def sort(self, key: str, direction: int = 1):
        reverse = direction == -1
        return LocalCursor(sorted(self, key=lambda item: item.get(key) or "", reverse=reverse))

    def limit(self, count: int):
        return LocalCursor(self[:count])

    async def to_list(self, length: int = 100):
        return list(self[:length])


class LocalCollection:
    def __init__(self, name: str):
        self.name = name
        self.path = BASE_DIR / "memory" / f"{name}.json"

    def _read(self) -> list:
        if not self.path.exists():
            return []
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _write(self, docs: list):
        self.path.write_text(json.dumps(docs, indent=2), encoding="utf-8")

    async def insert_one(self, doc: dict):
        with _lock:
            docs = self._read()
            stored = dict(doc)
            stored.setdefault("_id", f"local-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}")
            docs.append(stored)
            self._write(docs)
        return _InsertResult(stored["_id"])

    async def find(self, query: dict = None, projection: dict = None):
        query = query or {}
        docs  = [dict(doc) for doc in self._read() if self._matches(doc, query)]
        for doc in docs:
            doc.pop("_id", None)
        return LocalCursor(docs)

    async def find_one(self, query: dict = None, projection: dict = None):
        docs = await self.find(query, projection)
        return docs[0] if docs else None

    async def update_one(self, query: dict, update: dict, upsert: bool = False):
        with _lock:
            docs  = self._read()
            found = False
            for doc in docs:
                if self._matches(doc, query):
                    doc.update(update.get("$set", {}))
                    found = True
                    break
            if not found and upsert:
                new_doc = {**query, **update.get("$set", {})}
                new_doc.setdefault("_id", f"local-{int(time.time()*1000)}-{uuid.uuid4().hex[:8]}")
                docs.append(new_doc)
            self._write(docs)

    async def delete_one(self, query: dict):
        with _lock:
            docs = self._read()
            remaining = [doc for doc in docs if not self._matches(doc, query)]
            deleted = len(docs) - len(remaining)
            self._write(remaining)
            return _DeleteResult(deleted)

    async def count_documents(self, query: dict = None):
        return len(await self.find(query or {}))

    @staticmethod
    def _matches(doc: dict, query: dict):
        return all(doc.get(key) == value for key, value in query.items())


class LocalDatabase:
    is_local = True

    def __getitem__(self, name: str):
        return LocalCollection(name)

    async def list_collection_names(self):
        return sorted(path.stem for path in (BASE_DIR / "memory").glob("*.json"))


_lock = Lock()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    local_db: Optional[LocalDatabase] = None
    mongo_failed = False


db_instance = Database()

async def connect_db():
    if db_instance.client is not None:
        return
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        await db_instance.client.admin.command("ping")
        print(f"✅ MongoDB connected — {settings.DB_NAME}")
    except Exception as exc:
        db_instance.mongo_failed = True
        db_instance.local_db = LocalDatabase()
        print(f"⚠️ MongoDB unavailable, using local JSON fallback: {exc}")

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        db_instance.client = None


def get_db():
    if db_instance.mongo_failed and db_instance.local_db is not None:
        return db_instance.local_db
    if db_instance.client is None:
        return db_instance.local_db or LocalDatabase()
    return db_instance.client[settings.DB_NAME]
