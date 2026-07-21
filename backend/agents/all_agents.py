import random
from typing import Dict, Any, List
from core.platforms import normalize_platforms, platform_lookup
from framework.base_agent import BaseAgent

CHAR_LIMITS = {"Instagram":2200,"LinkedIn":3000,"Twitter":280,"YouTube":5000,"Facebook":63206}

HOOK_TEMPLATES = [
    "Nobody in {industry} is talking about what {brand} just figured out.",
    "If you're a {audience}, you need to hear this from {brand}.",
    "Hot take: {brand} is changing how {audience} thinks about {offer}.",
    "Real talk — {audience} deserves better. That's why {brand} exists.",
    "Every {audience} asks: what makes {brand} different? Here's the honest answer.",
    "Stop scrolling. If you care about {offer}, this is for you.",
    "{brand} was built by {audience}, for {audience}. Here's proof.",
]

BODY_TEMPLATES = {
    "Instagram": [
        "We didn't build {brand} in a boardroom. We built it because {audience} told us exactly what was missing.\n\nEvery {offer} starts with one question: does this actually help {audience}?\n\nThe answer has to be yes. Always. 💫",
        "Here's what {audience} never hears from {industry} brands:\n\nThe truth about {offer}.\n\n{brand} is saying it anyway — because we were built on honesty, not hype. 🔥",
    ],
    "LinkedIn": [
        "When we started {brand}, everyone said {audience} wouldn't care about {offer} at this level.\n\nThey were wrong.\n\n→ {audience} don't want to be sold to. They want to be understood.\n→ {offer} isn't just a product — it's an identity decision.\n→ Brands winning in {industry} are the ones listening first.\n\n{brand} was built on that principle.",
        "3 things {industry} gets wrong about {audience}:\n\n1. They assume price drives decisions — it's trust.\n2. They talk features — {audience} cares about outcomes.\n3. They broadcast — {audience} wants conversation.\n\n{brand} does the opposite.",
    ],
    "Twitter": [
        "{brand} to {audience}: we see you, we hear you, {offer} was made for you.",
        "Unpopular opinion: {industry} brands are too scared to speak to {audience}. {brand} isn't.",
    ],
    "YouTube": [
        "🎬 {brand} just dropped something for every {audience} who's been asking about {offer}. Watch till the end.",
        "Community update from {brand}: here's what {audience} needs to know about {offer} this week 👇",
    ],
    "Facebook": [
        "To our community — every {audience} who's been with us from the start:\n\nWe built {brand} for you. {offer} was designed with one goal: give {audience} exactly what they've been asking for.",
    ],
}

CTA_MAP = {
    "awareness":  ["Follow {brand} for more","Share with a fellow {audience}","Tag someone who needs this 👇"],
    "engagement": ["Which part resonated? Comment below 👇","Are you a {audience}? Drop a 🙋","Vote: does {brand} get it right?"],
    "conversion": ["DM us '{offer}' to get started","Link in bio — built for {audience}","Limited to first 100 {audience}"],
    "retention":  ["Save this if you're a real {audience} 🔖","Share with your {audience} community","Which tip hits hardest?"],
}

HASHTAG_SETS = {
    "Instagram":["#reels","#explore","#contentcreator","#instadaily","#viral"],
    "LinkedIn": ["#leadership","#marketing","#branding","#founder","#growth"],
    "Twitter":  ["#startup","#marketing","#brand","#growth"],
    "YouTube": ["#youtube","#community","#shorts","#subscribe","#creator"],
    "Facebook": ["#community","#brand","#business","#local"],
}

def fill(template: str, brand: dict) -> str:
    return template.format(
        brand=brand.get("brand_name","us"),
        audience=brand.get("target_audience","our audience"),
        offer=brand.get("offer", brand.get("brand_name","our product")),
        industry=brand.get("industry","our industry"),
    )

# ── 1. StrategyAgent ───────────────────────────────────────
class StrategyAgent(BaseAgent):
    name = "StrategyAgent"
    THEMES = {
        "awareness":  ["Brand Origin Story","Founder's Vision","Mission Spotlight","Culture & Values"],
        "engagement": ["Community Challenge","Fan Spotlight","Interactive Poll Series","Q&A Drop"],
        "conversion": ["Limited Drop Reveal","Social Proof Stack","Product Deep Dive","Urgency CTA"],
        "retention":  ["Loyalty Exclusive","Insider Tips Series","Customer Win Stories","VIP Community"],
    }
    def _think(self, brand): return f"Analyzing {brand.get('brand_name')} targeting {brand.get('target_audience')} for {brand.get('campaign_goal')} campaign"
    def _plan(self, thought): return "Select campaign theme → define content direction → set posting frequency → identify strategic hook"
    def _execute(self, brand, **kwargs):
        goal = brand.get("campaign_goal","awareness").lower()
        platform = brand.get("platforms",["Instagram"])[0]
        competitors = brand.get("competitors",[])
        comp_note = f"Outmaneuver {competitors[0]} by owning the narrative they ignore." if competitors else "Own your niche before expanding reach."
        return {
            "agent": self.name,
            "campaign_theme": random.choice(self.THEMES.get(goal, self.THEMES["awareness"])),
            "content_direction": f"Lead with emotional storytelling for {brand.get('target_audience')}. {comp_note}",
            "primary_platform": platform,
            "goal": goal,
            "recommended_post_frequency": "2–3 posts/day",
            "best_posting_times": ["8:00 AM","12:30 PM","7:00 PM"],
            "strategic_hook": f"Position {brand.get('brand_name')} as the brand that speaks to {brand.get('target_audience')} — not at them.",
        }

# ── 2. TrendAgent ──────────────────────────────────────────
class TrendAgent(BaseAgent):
    name = "TrendAgent"
    def _think(self, brand): return f"Scanning trending content in {brand.get('industry','general')} for {brand.get('brand_name')}"
    def _plan(self, thought): return "Call trend_tool → extract hashtags → identify formats → score relevance"
    def _execute(self, brand, **kwargs):
        result = self.call_tool("trend_tool", industry=brand.get("industry","general"))
        result["agent"] = self.name
        result["trending_topic_hook"] = f"What's working this week: {result['trending_formats'][0]} content is seeing highest organic reach."
        return result

# ── 3. ContentAgent ────────────────────────────────────────
class ContentAgent(BaseAgent):
    name = "ContentAgent"
    def _think(self, brand): return f"Planning platform-specific content for {brand.get('brand_name')} across {brand.get('platforms')}"
    def _plan(self, thought): return "Build hook → write body → add CTA → append hashtags → validate char limit"
    def _execute(self, brand, strategy=None, trends=None, **kwargs):
        goal      = (strategy or {}).get("goal", brand.get("campaign_goal","awareness"))
        platforms = normalize_platforms(brand.get("platforms",["Instagram"]))
        tags      = (trends or {}).get("trending_hashtags",[])
        posts = []
        for p in platforms:
            hook     = fill(random.choice(HOOK_TEMPLATES), brand)
            body     = fill(random.choice(platform_lookup(BODY_TEMPLATES, p)), brand)
            cta      = fill(random.choice(CTA_MAP.get(goal, CTA_MAP["awareness"])), brand)
            base_tags= random.sample(HASHTAG_SETS.get(p,[]), min(3, len(HASHTAG_SETS.get(p,[]))))
            all_tags = list(set(base_tags + random.sample(tags, min(2,len(tags)))))
            brand_tag= f"#{brand.get('brand_name','Brand').replace(' ','')}"
            content  = f"{hook}\n\n{body}\n\n{cta}\n\n{brand_tag} {' '.join(all_tags)}" if p != "Twitter" else f"{hook} {cta} {brand_tag}"
            limit    = CHAR_LIMITS.get(p,2200)
            truncated= len(content) > limit
            if truncated: content = content[:limit-3]+"..."
            posts.append({"platform":p,"content":content,"char_count":len(content),"char_limit":limit,"truncated":truncated})
        return {"agent": self.name, "posts": posts}

# ── 4. BrandVoiceAgent ─────────────────────────────────────
class BrandVoiceAgent(BaseAgent):
    name = "BrandVoiceAgent"
    RULES = {
        "professional": {"avoid":["LOL","OMG","gonna","wanna"],"prefer":["We believe","Research shows","Key insight"],"style":"Formal. Lead with data."},
        "casual":       {"avoid":["Furthermore","In conclusion"],"prefer":["Hey!","Real talk:","Here's the thing —"],"style":"Conversational. Short sentences."},
        "inspirational":{"avoid":["failed","impossible","can't"],"prefer":["You've got this","Every step matters"],"style":"Uplifting. End with powerful CTA."},
        "witty":        {"avoid":["To summarize"],"prefer":["Plot twist:","Unpopular opinion:"],"style":"Clever humour. Subvert expectations."},
        "educational":  {"avoid":["just","simply","obviously"],"prefer":["Here's how","Step 1:","Most people don't know"],"style":"Clear. Numbered lists."},
    }
    def _think(self, brand): return f"Checking tone consistency for {brand.get('tone','casual')} voice across all posts"
    def _plan(self, thought): return "Load tone rules → scan each post → flag violations → compute score → return guide"
    def _execute(self, brand, posts=None, **kwargs):
        tone  = brand.get("tone","casual").lower()
        rules = self.RULES.get(tone, self.RULES["casual"])
        flags = []
        for post in (posts or []):
            content = post.get("content","")
            for word in rules["avoid"]:
                if word.lower() in content.lower():
                    flags.append({"platform":post["platform"],"issue":f"Found '{word}'","fix":f"Replace with {tone}-appropriate language."})
        score = max(0, 100 - len(flags)*10)
        return {"agent":self.name,"tone":tone,"style_guide":rules["style"],"prefer":rules["prefer"],"avoid":rules["avoid"],"flags":flags,"score":score,"status":"✅ All posts match brand voice" if not flags else f"⚠ {len(flags)} issue(s) found"}
    def _reflect(self, result): return result.get("score",80) / 100

# ── 5. EngagementAgent ─────────────────────────────────────
class EngagementAgent(BaseAgent):
    name = "EngagementAgent"
    COMMENT_REPLIES = [
        "This is exactly why we built {brand} for {audience} 🙌",
        "You just made our whole team's day. More coming soon 🔥",
        "THIS. This is why {brand} exists. Thank you 💙",
        "You're exactly who we built {brand} for. Welcome ✨",
    ]
    NEGATIVE_REPLIES = [
        "We hear you. DM {brand} directly and we'll make it right 🙏",
        "Fair feedback. The {brand} team takes this seriously — please reach out.",
        "Not the experience we want for any {audience}. DM us — we'll fix this.",
    ]
    DM_TEMPLATES = [
        "Hey [Name] 👋 Thanks for reaching out to {brand}! How can we help with {offer} today?",
        "Hi [Name]! {brand} here. We saw your message about {offer} — here's what you need to know: [answer].",
        "[Name], we built {brand} specifically for {audience}. Let us walk you through {offer} — got 2 minutes?",
    ]
    def _think(self, brand): return f"Generating engagement templates for {brand.get('brand_name')}"
    def _plan(self, thought): return "Build comment replies → negative handling → DM templates using brand context"
    def _execute(self, brand, **kwargs):
        return {
            "agent": self.name,
            "comment_replies":  [fill(t, brand) for t in random.sample(self.COMMENT_REPLIES, min(4,len(self.COMMENT_REPLIES)))],
            "negative_replies": [fill(t, brand) for t in random.sample(self.NEGATIVE_REPLIES, min(2,len(self.NEGATIVE_REPLIES)))],
            "dm_templates":     [fill(t, brand) for t in random.sample(self.DM_TEMPLATES, min(3,len(self.DM_TEMPLATES)))],
        }

# ── 6. AnalyticsAgent ─────────────────────────────────────
class AnalyticsAgent(BaseAgent):
    name = "AnalyticsAgent"
    def _think(self, brand): return f"Predicting performance metrics for {brand.get('platforms')} platforms"
    def _plan(self, thought): return "Call analytics_tool → compute engagement → identify best platform → flag if <5%"
    def _execute(self, brand, **kwargs):
        result = self.call_tool("analytics_tool", platforms=brand.get("platforms",["Instagram"]))
        result["agent"] = self.name
        result["improvement_tip"] = f"Post at peak hours and use trending formats to boost reach for {brand.get('brand_name')}."
        low = [m for m in result["platform_metrics"] if float(m["engagement_rate"].replace("%","")) < 5]
        if low:
            result["suggestion_needed"] = True
        return result

# ── 7. SuggestionAgent ────────────────────────────────────
class SuggestionAgent(BaseAgent):
    name = "SuggestionAgent"
    QUICK_WINS = [
        "Pin your most authentic {brand} post — it signals real community.",
        "Add a direct question about {offer} to your next caption — 3x more comments.",
        "Repurpose best {brand} content into a 15-second Reel — same message, 10x reach.",
        "Reply to every {audience} comment in the first hour — boosts algorithmic reach.",
        "Use 3–5 niche {industry} hashtags instead of broad ones.",
        "Post one raw behind-the-scenes {brand} moment this week.",
    ]
    AB_TESTS = [
        {"va":"Hook: '{brand} was built for {audience}'","vb":"Hook: 'What {audience} actually wants from {offer}'","goal":"Test identity-led vs curiosity-led hooks"},
        {"va":"Carousel showing {offer} features","vb":"Reel showing real {audience} using {offer}","goal":"Test product-first vs people-first"},
        {"va":"Post at 9 AM peak hour","vb":"Post at 10 PM low-competition window","goal":"Test algorithmic peak vs quiet window"},
    ]
    RESCUE_PLANS = [
        "If {brand} engagement drops below 2%, go all-in on short-form video for 7 days.",
        "If reach stalls, partner with 2–3 {industry} micro-creators who speak to {audience}.",
        "If {offer} CTR is low, A/B test 5 different opening lines this week.",
    ]
    def _think(self, brand): return f"Generating optimization suggestions for {brand.get('brand_name')}"
    def _plan(self, thought): return "Analyze analytics → generate quick wins → build A/B tests → create rescue plans"
    def _execute(self, brand, analytics=None, **kwargs):
        best = (analytics or {}).get("best_platform","Instagram")
        total_r = (analytics or {}).get("total_reach",0)
        ab = [{"variant_a":fill(t["va"],brand),"variant_b":fill(t["vb"],brand),"goal":fill(t["goal"],brand)} for t in random.sample(self.AB_TESTS,2)]
        return {
            "agent": self.name,
            "quick_wins":     [fill(t,brand) for t in random.sample(self.QUICK_WINS,3)],
            "ab_tests":       ab,
            "rescue_plans":   [fill(t,brand) for t in random.sample(self.RESCUE_PLANS,2)],
            "focus_platform": best,
            "note": f"Double down on {best} — {total_r:,} reach this run. Own this platform before expanding.",
        }

# ── 8. CompetitorAgent ────────────────────────────────────
class CompetitorAgent(BaseAgent):
    name = "CompetitorAgent"
    GAPS = [
        "No competitor is speaking directly to the '{audience}' identity — {brand} can own this.",
        "Behind-the-process content is absent in {industry}. First mover advantage available now.",
        "UGC campaigns are underutilized — {audience} wants to participate, not just watch.",
        "Short-form education (under 60s) is missing. {audience} is hungry for quick knowledge.",
    ]
    COUNTERS = [
        "When competitors run product campaigns, {brand} runs community/values campaigns — contrast builds identity.",
        "Own the content format competitors ignore most.",
        "Engage directly with {audience} in competitors' comment sections — provide value, don't pitch.",
        "Launch a hashtag {brand} owns — make it about {audience}'s identity, not the product.",
    ]
    def _think(self, brand): return f"Analyzing {len(brand.get('competitors',[]))} competitors for {brand.get('brand_name')}"
    def _plan(self, thought): return "Call competitor_tool → identify weaknesses → find gaps → build counter-strategies → generate AI insight"
    def _execute(self, brand, **kwargs):
        result = self.call_tool("competitor_tool", competitors=brand.get("competitors",[]), brand=brand.get("brand_name",""), audience=brand.get("target_audience",""))
        comps  = brand.get("competitors",[])
        gaps     = [fill(t,brand) for t in random.sample(self.GAPS, min(3,len(self.GAPS)))]
        counters = [fill(t,brand) for t in random.sample(self.COUNTERS, min(3,len(self.COUNTERS)))]
        insight  = (f"{comps[0]}'s avg engagement means their audience is passive — {brand.get('brand_name')} targeting the same {brand.get('target_audience')} with authentic community content could achieve 2–3x their engagement within 60 days." if comps else f"{brand.get('brand_name')} has first-mover advantage in owning the {brand.get('target_audience')} narrative.")
        return {"agent":self.name, **result, "gaps_to_exploit":gaps, "counter_strategy":counters, "ai_insight":insight}

# ── 9. CampaignAgent ──────────────────────────────────────
class CampaignAgent(BaseAgent):
    name = "CampaignAgent"
    def _think(self, brand): return f"Building 7-day campaign calendar for {brand.get('brand_name')}"
    def _plan(self, thought): return "Call calendar_tool → assign platforms → set post types → attach hashtags"
    def _execute(self, brand, strategy=None, trends=None, **kwargs):
        goal = (strategy or {}).get("goal", brand.get("campaign_goal","awareness"))
        plan = self.call_tool("calendar_tool", platforms=brand.get("platforms",["Instagram"]), goal=goal)
        tags = (trends or {}).get("trending_hashtags",[])
        for day in plan:
            day["hashtags"] = random.sample(tags, min(3,len(tags)))
            day["theme"]    = (strategy or {}).get("campaign_theme","Brand Story")
        return {"agent":self.name,"campaign_name":f"{brand.get('brand_name')} — 7-Day {goal.title()} Campaign","goal":goal,"platform_focus":brand.get("platforms",["Instagram"]),"weekly_plan":plan}

# ── 10. SchedulerAgent ────────────────────────────────────
class SchedulerAgent(BaseAgent):
    name = "SchedulerAgent"
    def _think(self, brand): return "Calculating optimal posting times per platform"
    def _plan(self, thought): return "Call scheduler_tool → assign time slots → save to queue"
    def _execute(self, brand, posts=None, **kwargs):
        scheduled = self.call_tool("scheduler_tool", posts=posts or [])
        return {"agent":self.name,"scheduled":scheduled,"total":len(scheduled),"message":f"{len(scheduled)} posts queued at optimal times."}

# ── 11. RecycleAgent ──────────────────────────────────────
class RecycleAgent(BaseAgent):
    name = "RecycleAgent"
    VARIATIONS = [
        "Revisiting this one — still as relevant as ever:\n\n{content}",
        "One of our most saved posts. Worth sharing again:\n\n{content}",
        "In case you missed it — this one hits different:\n\n{content}",
    ]
    def _think(self, brand): return "Scanning evergreen pool for recyclable high-performing content"
    def _plan(self, thought): return "Add new posts to evergreen pool → sample old posts → generate fresh intros → schedule reposts"
    def _execute(self, brand, posts=None, **kwargs):
        posts = posts or []
        recycled = []
        for p in random.sample(posts, min(2,len(posts))):
            variation = random.choice(self.VARIATIONS).format(content=p.get("content","")[:200]+"...")
            recycled.append({"platform":p.get("platform"),"original":p.get("content","")[:100]+"...","recycled_post":variation,"recycle_count":1})
        return {"agent":self.name,"evergreen_pool":len(posts),"recycled":recycled,"message":f"{len(posts)} posts in pool. {len(recycled)} recycled."}

# ── 12. InboxAgent ────────────────────────────────────────
class InboxAgent(BaseAgent):
    name = "InboxAgent"
    COMMENTS = {
        "positive":["This is exactly what I needed from {brand} 🙌","{brand} never misses. Every drop hits harder 🔥","Finally a {industry} brand that gets it. {brand} is different."],
        "negative":["Not impressed tbh. Expected more from {brand}.","The {offer} looks good but price point is off."],
        "question":["Does {brand} ship internationally?","How is {offer} different from others in {industry}?","Is there a discount for loyal {audience}?"],
    }
    REPLIES = {
        "positive":["This makes everything worth it 🙏 You're exactly who {brand} was built for 🔥","We built {brand} for people exactly like you. Welcome to the family 💙"],
        "negative":["We hear you. DM {brand} directly and we'll make it right 🙏","Fair feedback. {brand} takes this seriously — please reach out."],
        "question":["Great question! DM {brand} and we'll give you the full breakdown 📩","Check the link in bio or DM {brand} — our team responds within 24h 😊"],
    }
    def _think(self, brand): return f"Simulating inbox activity for {brand.get('brand_name')}"
    def _plan(self, thought): return "Generate brand-aware comments → assign sentiments → create smart replies → simulate DMs"
    def _execute(self, brand, **kwargs):
        from datetime import datetime, timedelta
        platforms = brand.get("platforms",["Instagram"])
        comments  = []
        for sent in ["positive","positive","positive","negative","question","question"]:
            msg   = fill(random.choice(self.COMMENTS[sent]), brand)
            reply = fill(random.choice(self.REPLIES[sent]), brand)
            comments.append({"user":random.choice(["@alex_m","@priya.k","@john_doe99","@sara_c","@techguy42"]),"message":msg,"sentiment":sent,"smart_reply":reply,"time":(datetime.utcnow()-timedelta(minutes=random.randint(5,300))).strftime("%H:%M"),"platform":random.choice(platforms)})
        dms = [{"from":random.choice(["@alex_m","@priya.k","@john_doe99"]),"message":fill(random.choice(self.COMMENTS["question"]),brand),"time":(datetime.utcnow()-timedelta(hours=random.randint(1,12))).strftime("%Y-%m-%d %H:%M")} for _ in range(3)]
        counts = {s:sum(1 for c in comments if c["sentiment"]==s) for s in ["positive","negative","question"]}
        return {"agent":self.name,"comments":comments,"dms":dms,"sentiment_summary":counts,"unread_count":len(comments)+len(dms)}

# ── 13. PublisherAgent ────────────────────────────────────
class PublisherAgent(BaseAgent):
    name = "PublisherAgent"
    RESPONSES = {
        "Instagram":["Post live on Instagram ✅","Reel submitted ✅"],
        "LinkedIn": ["Article posted on LinkedIn ✅","Post shared ✅"],
        "Twitter": ["Tweet posted ✅","Thread published ✅"],
        "YouTube":   ["YouTube Community post live ✅", "YouTube post published ✅"],
        "Facebook": ["Published to Facebook Page ✅"],
    }
    def _think(self, brand): return f"Publishing {len(brand.get('platforms',[]))} posts across platforms"
    def _plan(self, thought): return "Iterate posts → attempt publish → log status → queue retries for failures"
    def _execute(self, brand, posts=None, **kwargs):
        from datetime import datetime
        results = []
        for post in (posts or []):
            p       = post.get("platform","Instagram")
            success = random.random() > 0.05
            results.append({"platform":p,"content":post.get("content","")[:80]+"...","status":"published" if success else "failed","response":random.choice(self.RESPONSES.get(p,["Submitted ✅"])) if success else "❌ Failed — retry queued","published_at":datetime.utcnow().isoformat() if success else None,"retry":not success})
        published = sum(1 for r in results if r["status"]=="published")
        return {"agent":self.name,"results":results,"published":published,"failed":len(results)-published,"message":f"{published} published. {len(results)-published} failed."}
