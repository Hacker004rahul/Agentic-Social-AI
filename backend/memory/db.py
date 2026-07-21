import os
import time
import uuid
from pathlib import Path
from threading import Lock
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
_client = None
_mongo_failed = False
_local_db = None
_lock = Lock()
DATA_DIR = Path(__file__).resolve().parent
DEFAULT_MONGO_URI = "mongodb://localhost:27017"


class _DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class LocalCursor(list):
    def sort(self, key: str, direction: int = 1):
        reverse = direction == -1
        return LocalCursor(sorted(self, key=lambda item: item.get(key) or "", reverse=reverse))

    def limit(self, count: int):
        return LocalCursor(self[:count])


class LocalCollection:
    def __init__(self, name: str):
        self.name = name
        self.path = DATA_DIR / f"{name}.json"

    def _read(self) -> list:
        if not self.path.exists():
            return []
        import json

        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _write(self, docs: list):
        import json

        self.path.write_text(json.dumps(docs, indent=2), encoding="utf-8")

    def insert_one(self, doc: dict):
        with _lock:
            docs = self._read()
            stored = dict(doc)
            stored.setdefault("_id", f"local-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}")
            docs.append(stored)
            self._write(docs)
        return stored

    def find(self, query: dict = None, projection: dict = None):
        query = query or {}
        docs = [dict(doc) for doc in self._read() if self._matches(doc, query)]
        if projection and projection.get("_id") == 0:
            for doc in docs:
                doc.pop("_id", None)
        return LocalCursor(docs)

    def find_one(self, query: dict = None, projection: dict = None):
        docs = self.find(query, projection)
        return docs[0] if docs else None

    def update_one(self, query: dict, update: dict):
        with _lock:
            docs = self._read()
            for doc in docs:
                if self._matches(doc, query):
                    doc.update(update.get("$set", {}))
                    break
            self._write(docs)

    def delete_one(self, query: dict):
        with _lock:
            docs = self._read()
            remaining = [doc for doc in docs if not self._matches(doc, query)]
            deleted = len(docs) - len(remaining)
            self._write(remaining)
            return _DeleteResult(deleted)

    def count_documents(self, query: dict = None):
        return len(self.find(query or {}))

    @staticmethod
    def _matches(doc: dict, query: dict):
        return all(doc.get(key) == value for key, value in query.items())


class LocalDatabase:
    is_local = True

    def __getitem__(self, name: str):
        return LocalCollection(name)

    def command(self, name: str):
        if name == "ping":
            return {"ok": 1, "storage": "local-json"}
        return {"ok": 1}

    def list_collection_names(self):
        return sorted(path.stem for path in DATA_DIR.glob("*.json"))

def get_db():
    global _client, _mongo_failed, _local_db
    if _mongo_failed:
        if _local_db is None:
            _local_db = LocalDatabase()
        return _local_db

    if _client is None:
        uri = os.getenv("MONGO_URI") or DEFAULT_MONGO_URI
        _client = MongoClient(uri, serverSelectionTimeoutMS=1200, connectTimeoutMS=1200)

    try:
        _client.admin.command("ping")
        return _client["agentic_social_ai"]
    except Exception:
        _mongo_failed = True
        if _local_db is None:
            _local_db = LocalDatabase()
        return _local_db

def get_collection(name: str):
    return get_db()[name]


def get_storage_status():
    db = get_db()
    return {
        "status": "local" if getattr(db, "is_local", False) else "connected",
        "database": "local JSON fallback" if getattr(db, "is_local", False) else "agentic_social_ai",
        "collections": {
            collection: db[collection].count_documents({})
            for collection in db.list_collection_names()
        },
    }
