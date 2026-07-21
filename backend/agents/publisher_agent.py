import random
from datetime import datetime
from core.platforms import normalize_platform
from memory.db import get_collection

PLATFORM_RESPONSES = {
    "Instagram": ["Post live on Instagram ✅", "Reels submitted for review ✅", "Story published ✅"],
    "LinkedIn":  ["Article posted on LinkedIn ✅", "Post shared with network ✅"],
    "Twitter":   ["Tweet posted ✅", "Thread published ✅"],
    "TikTok":    ["Video queued for TikTok ✅", "TikTok post scheduled ✅"],
    "Facebook":  ["Published to Facebook Page ✅", "Facebook post live ✅"],
}

class PublisherAgent:
    name = "PublisherAgent"

    def _col(self):
        return get_collection("publish_log")

    def run(self, posts: list) -> dict:
        results = []

        for post in posts:
            platform = normalize_platform(post.get("platform", "Instagram"))
            success  = random.random() > 0.05
            status   = "published" if success else "failed"
            response = random.choice(PLATFORM_RESPONSES.get(platform, ["Post submitted ✅"])) if success else "❌ Publish failed — retry scheduled"

            entry = {
                "platform":     platform,
                "content":      post.get("content", "")[:80] + "...",
                "status":       status,
                "response":     response,
                "published_at": datetime.now().isoformat() if success else None,
                "retry":        not success,
            }
            self._col().insert_one({**entry})
            results.append(entry)

        published = [r for r in results if r["status"] == "published"]
        failed    = [r for r in results if r["status"] == "failed"]

        return {
            "agent":     self.name,
            "results":   results,
            "published": len(published),
            "failed":    len(failed),
            "message":   f"{len(published)} posts published. {len(failed)} failed and queued for retry.",
        }

    def get_log(self) -> list:
        return list(self._col().find({}, {"_id": 0}).sort("published_at", -1).limit(100))
