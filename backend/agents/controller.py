import time
from agents.strategy_agent    import StrategyAgent
from agents.trend_agent       import TrendAgent
from agents.content_agent     import ContentAgent
from agents.engagement_agent  import EngagementAgent
from agents.analytics_agent   import AnalyticsAgent
from agents.suggestion_agent  import SuggestionAgent
from agents.brand_voice_agent import BrandVoiceAgent
from agents.competitor_agent  import CompetitorAgent
from agents.campaign_agent    import CampaignAgent
from agents.scheduler_agent   import SchedulerAgent
from agents.recycle_agent     import RecycleAgent
from agents.inbox_agent       import InboxAgent
from agents.publisher_agent   import PublisherAgent

class AgentController:
    def __init__(self):
        self.strategy    = StrategyAgent()
        self.trend       = TrendAgent()
        self.content     = ContentAgent()
        self.engagement  = EngagementAgent()
        self.analytics   = AnalyticsAgent()
        self.suggestion  = SuggestionAgent()
        self.brand_voice = BrandVoiceAgent()
        self.competitor  = CompetitorAgent()
        self.campaign    = CampaignAgent()
        self.scheduler   = SchedulerAgent()
        self.recycle     = RecycleAgent()
        self.inbox       = InboxAgent()
        self.publisher   = PublisherAgent()

    def run(self, brand: dict) -> dict:
        trace = []

        def step(name, fn):
            t0 = time.time()
            trace.append({"agent": name, "status": "running"})
            result = fn()
            ms = round((time.time() - t0) * 1000)
            trace[-1].update({"status": "completed", "ms": ms})
            return result

        strategy    = step("StrategyAgent",   lambda: self.strategy.run(brand))
        trend       = step("TrendAgent",      lambda: self.trend.run(brand))
        content     = step("ContentAgent",    lambda: self.content.run(brand, strategy, trend))
        engagement  = step("EngagementAgent", lambda: self.engagement.run(brand))
        analytics   = step("AnalyticsAgent",  lambda: self.analytics.run(brand.get("platforms", ["Instagram"])))
        suggestion  = step("SuggestionAgent", lambda: self.suggestion.run(analytics, brand))
        brand_voice = step("BrandVoiceAgent", lambda: self.brand_voice.run(brand, content["posts"]))
        competitor  = step("CompetitorAgent", lambda: self.competitor.run(brand))
        campaign    = step("CampaignAgent",   lambda: self.campaign.run(brand, strategy, trend))
        scheduler   = step("SchedulerAgent",  lambda: self.scheduler.run(content["posts"]))
        recycle     = step("RecycleAgent",    lambda: self.recycle.run(content["posts"]))
        inbox       = step("InboxAgent",      lambda: self.inbox.run(brand))
        publisher   = step("PublisherAgent",  lambda: self.publisher.run(content["posts"]))

        name       = brand.get("brand_name", "Brand")
        audience   = brand.get("target_audience", "general audience")
        platforms  = ", ".join(brand.get("platforms", ["Instagram"]))
        goal       = strategy["goal"]
        best_plat  = analytics["best_platform"]
        reach      = analytics["total_reach"]

        summary = (
            f"{name} ({audience}) — {goal} campaign launched across {platforms}. "
            f"{publisher['published']} posts published live. "
            f"Best platform: {best_plat} with {reach:,} estimated reach. "
            f"Inbox: {inbox['unread_count']} messages. "
            f"Evergreen pool: {recycle['evergreen_pool']} posts. "
            f"Strategic direction: {strategy['content_direction'][:100]}..."
        )

        return {
            "executive_summary": summary,
            "workflow_trace":    trace,
            "strategy":          strategy,
            "trends":            trend,
            "content":           content,
            "engagement":        engagement,
            "analytics":         analytics,
            "suggestions":       suggestion,
            "brand_voice":       brand_voice,
            "competitor":        competitor,
            "campaign":          campaign,
            "scheduler":         scheduler,
            "recycle":           recycle,
            "inbox":             inbox,
            "publisher":         publisher,
        }
