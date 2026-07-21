import time, random
from datetime import datetime, timedelta
from core.platforms import normalize_platform
from memory.db import get_collection

BEST_TIMES = {
    "Instagram": ["8:00 AM", "11:00 AM", "2:00 PM", "7:00 PM"],
    "LinkedIn":  ["7:30 AM", "10:00 AM", "12:00 PM", "5:30 PM"],
    "Twitter":   ["8:00 AM", "12:00 PM", "5:00 PM",  "9:00 PM"],
    "TikTok":    ["7:00 AM", "12:00 PM", "7:00 PM",  "9:00 PM"],
    "Facebook":  ["9:00 AM", "1:00 PM",  "3:00 PM",  "8:00 PM"],
}

class SchedulerAgent:
    name = "SchedulerAgent"

    def _col(self):
        return get_collection("queue")

    def schedule_posts(self, posts: list) -> list:
        base    = datetime.now()
        entries = []

        for i, post in enumerate(posts):
            platform    = normalize_platform(post.get("platform", "Instagram"))
            best_times  = BEST_TIMES.get(platform, BEST_TIMES["Instagram"])
            slot_time   = best_times[i % len(best_times)]
            day_offset  = i // len(best_times)
            schedule_dt = (base + timedelta(days=day_offset)).strftime("%Y-%m-%d") + f" {slot_time}"

            entry = {
                "id":           int(time.time() * 1000) + i,
                "platform":     platform,
                "content":      post.get("content", ""),
                "char_count":   post.get("char_count", 0),
                "char_limit":   post.get("char_limit", 2200),
                "status":       "scheduled",
                "scheduled_at": schedule_dt,
                "best_time":    slot_time,
                "created_at":   datetime.now().isoformat(),
                "published_at": None,
                "engagement":   None,
            }
            self._col().insert_one({**entry, "_id": entry["id"]})
            entries.append(entry)

        return entries

    def get_queue(self) -> list:
        return list(self._col().find({}, {"_id": 0}).sort("created_at", -1))

    def publish_post(self, post_id: int) -> dict:
        engagement = {
            "likes":    random.randint(50, 800),
            "comments": random.randint(5, 120),
            "shares":   random.randint(2, 80),
            "reach":    random.randint(300, 9000),
        }
        self._col().update_one(
            {"id": post_id},
            {"$set": {"status": "published", "published_at": datetime.now().isoformat(), "engagement": engagement}}
        )
        doc = self._col().find_one({"id": post_id}, {"_id": 0})
        return doc or {}

    def delete_post(self, post_id: int) -> bool:
        result = self._col().delete_one({"id": post_id})
        return result.deleted_count > 0

    def run(self, posts: list) -> dict:
        scheduled = self.schedule_posts(posts)
        return {
            "agent":     self.name,
            "scheduled": scheduled,
            "total":     len(scheduled),
            "message":   f"{len(scheduled)} posts queued at optimal times.",
        }
