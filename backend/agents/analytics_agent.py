import random
from core.platforms import normalize_platforms

PLATFORM_BENCHMARKS = {
    "Instagram": {"likes": (80, 600),  "comments": (10, 100), "shares": (5, 80),  "reach": (500, 8000),  "ctr": (1.5, 4.5)},
    "LinkedIn":  {"likes": (30, 300),  "comments": (5, 60),   "shares": (10, 120),"reach": (300, 5000),  "ctr": (2.0, 6.0)},
    "Twitter":   {"likes": (20, 400),  "comments": (3, 50),   "shares": (5, 200), "reach": (200, 10000), "ctr": (0.5, 3.0)},
    "TikTok":    {"likes": (200, 5000),"comments": (20, 300), "shares": (50, 500),"reach": (1000, 50000),"ctr": (3.0, 8.0)},
    "Facebook":  {"likes": (10, 200),  "comments": (2, 40),   "shares": (1, 50),  "reach": (100, 3000),  "ctr": (0.5, 2.5)},
}

def simulate(platform):
    b = PLATFORM_BENCHMARKS.get(platform, PLATFORM_BENCHMARKS["Instagram"])
    likes    = random.randint(*b["likes"])
    comments = random.randint(*b["comments"])
    shares   = random.randint(*b["shares"])
    reach    = random.randint(*b["reach"])
    ctr      = round(random.uniform(*b["ctr"]), 2)
    eng_rate = round((likes + comments + shares) / reach * 100, 2)
    return {
        "platform":         platform,
        "likes":            likes,
        "comments":         comments,
        "shares":           shares,
        "reach":            reach,
        "ctr":              f"{ctr}%",
        "engagement_rate":  f"{eng_rate}%",
        "performance_label": "🟢 Strong" if eng_rate > 5 else "🟡 Average" if eng_rate > 2 else "🔴 Needs Work",
    }

class AnalyticsAgent:
    name = "AnalyticsAgent"

    def run(self, platforms: list) -> dict:
        metrics    = [simulate(p) for p in normalize_platforms(platforms)]
        best       = max(metrics, key=lambda x: float(x["engagement_rate"].replace("%", "")))
        total_reach = sum(m["reach"] for m in metrics)
        return {
            "agent":         self.name,
            "platform_metrics": metrics,
            "best_platform": best["platform"],
            "total_reach":   total_reach,
            "improvement_tip": "Post at peak hours and use trending formats like Reels to boost reach.",
        }
