import random
from datetime import datetime, timedelta
from typing import Any, Dict, List
from core.platforms import normalize_platforms

class BaseTool:
    name: str = "BaseTool"
    def run(self, **kwargs) -> Any: ...

class TrendTool(BaseTool):
    name = "trend_tool"
    INDUSTRY_DATA = {
        "sports":   { "tags": ["#AthleteMindset","#TrainHard","#GameDay","#WinningMentality","#SportsCulture"], "formats": ["Training Reels","Athlete Stories","Match-day Carousels"] },
        "fashion":  { "tags": ["#OOTD","#StreetStyle","#FashionWeek","#StyleInspo","#WearYourStory"],           "formats": ["GRWM Reels","Style Carousels","Collab Reveals"] },
        "food":     { "tags": ["#FoodieLife","#RecipeAlert","#EatLocal","#FoodPhotography","#CheatDay"],         "formats": ["Recipe Reels","Ingredient Carousels","Chef Stories"] },
        "tech":     { "tags": ["#TechLife","#AIRevolution","#BuildInPublic","#ProductHunt","#StartupLife"],      "formats": ["Demo Reels","Explainer Carousels","Founder Threads"] },
        "fitness":  { "tags": ["#FitLife","#TransformationTuesday","#WorkoutRoutine","#GymRat","#SweatEveryDay"],"formats": ["Form-check Reels","30-day Challenges","Meal Prep Stories"] },
        "business": { "tags": ["#Entrepreneurship","#BuildInPublic","#Leadership","#GrowthHacking","#Founder"],  "formats": ["Insight Threads","Myth-busting Carousels","Revenue Reveals"] },
        "general":  { "tags": ["#Trending","#Authentic","#RealTalk","#CommunityFirst","#Inspiration"],           "formats": ["Storytelling Reels","Value Carousels","BTS Stories"] },
    }
    def run(self, industry: str = "general", **kwargs) -> Dict:
        key  = industry.lower() if industry.lower() in self.INDUSTRY_DATA else "general"
        data = self.INDUSTRY_DATA[key]
        return {
            "trending_hashtags":     random.sample(data["tags"], min(5, len(data["tags"]))),
            "trending_formats":      random.sample(data["formats"], min(3, len(data["formats"]))),
            "trend_relevance_score": f"{random.randint(82,97)}%",
            "audience_interest":     f"Audiences in {industry} are highly engaged with {data['formats'][0].lower()} right now.",
        }

class AnalyticsTool(BaseTool):
    name = "analytics_tool"
    BENCHMARKS = {
        "Instagram": {"likes":(80,600),  "comments":(10,100),"shares":(5,80),  "reach":(500,8000)},
        "LinkedIn":  {"likes":(30,300),  "comments":(5,60),  "shares":(10,120),"reach":(300,5000)},
        "Twitter":   {"likes":(20,400),  "comments":(3,50),  "shares":(5,200), "reach":(200,10000)},
        "YouTube":    {"likes":(100,3000),"comments":(10,200),"shares":(20,300),"reach":(500,20000)},
        "Facebook":  {"likes":(10,200),  "comments":(2,40),  "shares":(1,50),  "reach":(100,3000)},
    }
    def run(self, platforms: List[str] = None, **kwargs) -> Dict:
        platforms = normalize_platforms(platforms or ["Instagram"])
        metrics = []
        for p in platforms:
            b = self.BENCHMARKS.get(p, self.BENCHMARKS["Instagram"])
            likes    = random.randint(*b["likes"])
            comments = random.randint(*b["comments"])
            shares   = random.randint(*b["shares"])
            reach    = random.randint(*b["reach"])
            eng      = round((likes + comments + shares) / reach * 100, 2)
            metrics.append({"platform": p, "likes": likes, "comments": comments, "shares": shares, "reach": reach, "engagement_rate": f"{eng}%"})
        best = max(metrics, key=lambda x: float(x["engagement_rate"].replace("%","")))
        return {"platform_metrics": metrics, "best_platform": best["platform"], "total_reach": sum(m["reach"] for m in metrics)}

class CompetitorTool(BaseTool):
    name = "competitor_tool"
    def run(self, competitors: List[str] = None, brand: str = "", audience: str = "", **kwargs) -> Dict:
        competitors = competitors or ["Competitor A"]
        analysis = []
        for c in competitors[:3]:
            eng = round(random.uniform(1.2, 4.8), 1)
            analysis.append({
                "competitor": c, "avg_engagement": f"{eng}%",
                "estimated_posting": f"{random.randint(1,3)}x/day",
                "top_content_type": random.choice(["Reels","Carousels","Static","Stories"]),
                "follower_estimate": f"{random.randint(50,900)}K",
                "weakness": f"{c} posts consistently but never engages back — {brand}'s responsiveness is an instant differentiator.",
            })
        return {"competitor_analysis": analysis}

class SchedulerTool(BaseTool):
    name = "scheduler_tool"
    BEST_TIMES = {
        "Instagram":["8:00 AM","11:00 AM","2:00 PM","7:00 PM"],
        "LinkedIn": ["7:30 AM","10:00 AM","12:00 PM","5:30 PM"],
        "Twitter":  ["8:00 AM","12:00 PM","5:00 PM","9:00 PM"],
        "YouTube":   ["7:00 AM","12:00 PM","5:00 PM","8:00 PM"],
        "Facebook": ["9:00 AM","1:00 PM","3:00 PM","8:00 PM"],
    }
    def run(self, posts: List[Dict] = None, **kwargs) -> List[Dict]:
        posts = posts or []
        base  = datetime.utcnow()
        result = []
        for i, post in enumerate(posts):
            p     = post.get("platform","Instagram")
            times = self.BEST_TIMES.get(p, self.BEST_TIMES["Instagram"])
            slot  = times[i % len(times)]
            day   = (base + timedelta(days=i // len(times))).strftime("%Y-%m-%d")
            result.append({**post, "scheduled_at": f"{day} {slot}", "best_time": slot, "status": "scheduled"})
        return result

class ValidationTool(BaseTool):
    name = "validation_tool"
    def run(self, content: str = "", tone: str = "casual", min_length: int = 20, **kwargs) -> Dict:
        issues = []
        if len(content) < min_length:
            issues.append(f"Content too short (min {min_length} chars)")
        if tone == "professional" and any(w in content.lower() for w in ["lol","omg","gonna"]):
            issues.append("Informal language detected for professional tone")
        score = max(0.0, 1.0 - len(issues) * 0.2)
        return {"valid": len(issues) == 0, "score": score, "issues": issues}

class MemoryTool(BaseTool):
    name = "memory_tool"
    def run(self, **kwargs) -> Dict:
        return {"stored": True, "timestamp": datetime.utcnow().isoformat()}

class CalendarTool(BaseTool):
    name = "calendar_tool"
    DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    def run(self, platforms: List[str] = None, goal: str = "awareness", **kwargs) -> List[Dict]:
        platforms = normalize_platforms(platforms or ["Instagram"])
        types = {"awareness":["Brand Story","Founder Post","Mission Statement","BTS"],"engagement":["Poll","Q&A","Challenge","Community Shoutout"],"conversion":["Offer Reveal","Testimonial","Product Demo","CTA Post"],"retention":["Tips","How-To","Customer Win","Value Post"]}
        plan = []
        for i, day in enumerate(self.DAYS):
            p = platforms[i % len(platforms)]
            t = types.get(goal, types["awareness"])[i % 4]
            plan.append({"day": day, "platform": p, "post_type": t, "format": random.choice(["Reel","Carousel","Static","Story"]), "post_time": random.choice(["9:00 AM","12:00 PM","5:00 PM","7:00 PM"]), "hashtags": []})
        return plan

class NotificationTool(BaseTool):
    name = "notification_tool"
    def run(self, message: str = "", level: str = "info", **kwargs) -> Dict:
        return {"sent": True, "message": message, "level": level, "timestamp": datetime.utcnow().isoformat()}

# ── Register all tools ─────────────────────────────────────
from tools.registry import tool_registry
for tool_cls in [TrendTool, AnalyticsTool, CompetitorTool, SchedulerTool, ValidationTool, MemoryTool, CalendarTool, NotificationTool]:
    t = tool_cls()
    tool_registry.register(t.name, t)
