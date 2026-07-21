import random
from datetime import datetime, timedelta
from memory.db import get_collection

RECYCLE_VARIATIONS = [
    "Revisiting this one — still as relevant as ever:\n\n{content}",
    "One of our most saved posts. Worth sharing again:\n\n{content}",
    "In case you missed it — this one hits different:\n\n{content}",
    "Evergreen content worth revisiting:\n\n{content}",
    "We keep coming back to this. You should too:\n\n{content}",
]

class RecycleAgent:
    name = "RecycleAgent"

    def _col(self):
        return get_collection("evergreen")

    def add_evergreen(self, posts: list):
        for p in posts:
            self._col().insert_one({
                "platform":      p.get("platform"),
                "content":       p.get("content"),
                "added_at":      datetime.now().isoformat(),
                "recycle_count": 0,
            })

    def run(self, posts: list) -> dict:
        self.add_evergreen(posts)

        all_posts = list(self._col().find({}))
        recycled  = []

        for doc in random.sample(all_posts, min(2, len(all_posts))):
            variation = random.choice(RECYCLE_VARIATIONS).format(content=doc["content"][:300] + "...")
            new_count = doc.get("recycle_count", 0) + 1
            self._col().update_one({"_id": doc["_id"]}, {"$set": {"recycle_count": new_count}})
            recycled.append({
                "platform":      doc["platform"],
                "original":      doc["content"][:120] + "...",
                "recycled_post": variation,
                "recycle_count": new_count,
                "next_recycle":  (datetime.now() + timedelta(days=random.randint(7, 21))).strftime("%Y-%m-%d"),
            })

        total = self._col().count_documents({})
        return {
            "agent":          self.name,
            "evergreen_pool": total,
            "recycled":       recycled,
            "message":        f"{total} posts in evergreen pool. {len(recycled)} recycled this run.",
        }
