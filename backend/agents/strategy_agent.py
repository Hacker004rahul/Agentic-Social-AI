import random
from core.platforms import normalize_platform

THEME_MAP = {
    "awareness":   ["Brand Origin Story", "Founder's Vision", "Behind the Campaign", "Mission Spotlight", "Culture & Values"],
    "engagement":  ["Community Challenge", "Fan Spotlight", "Interactive Poll Series", "Q&A Drop", "User Story Takeover"],
    "conversion":  ["Limited Drop Reveal", "Proof-of-Performance", "Product Deep Dive", "Social Proof Stack", "Urgency CTA"],
    "retention":   ["Loyalty Exclusive", "Insider Tips Series", "Customer Win Stories", "How-To Masterclass", "VIP Community"],
}

DIRECTION_MAP = {
    "sports":    "Lead with performance data and athlete stories. Use kinetic, action-driven visuals.",
    "fashion":   "Focus on aesthetics, culture collabs, and self-expression narratives.",
    "food":      "Trigger sensory desire first. Use close-up visuals, smell/taste language.",
    "tech":      "Lead with a problem, then reveal the solution. Use before/after framing.",
    "fitness":   "Speak to transformation and identity, not just physical results.",
    "business":  "Lead with insight or contrarian opinion. Establish thought leadership.",
    "education": "Break complex ideas into digestible steps. Be the smartest-but-friendliest voice.",
    "general":   "Lead with emotional storytelling before any product mention.",
}

FREQ_MAP = {
    "Instagram": "1–2 Reels/day + 3–5 Stories",
    "TikTok":    "2–4 videos/day during peak 6–9 PM",
    "LinkedIn":  "1 post/day, Tuesday–Thursday",
    "Twitter":   "3–5 tweets/day + 1 thread/week",
    "Facebook":  "1 post/day, boosted on weekends",
}

class StrategyAgent:
    name = "StrategyAgent"

    def run(self, brand: dict) -> dict:
        name       = brand.get("brand_name", "Brand")
        audience   = brand.get("target_audience", "general audience")
        goal       = brand.get("campaign_goal", "awareness").lower()
        industry   = brand.get("industry", "general").lower()
        platform   = normalize_platform(brand.get("platforms", ["Instagram"])[0])
        competitors= brand.get("competitors", [])
        tone       = brand.get("tone", "casual")
        offer      = brand.get("offer", "")

        theme     = random.choice(THEME_MAP.get(goal, THEME_MAP["awareness"]))
        direction = DIRECTION_MAP.get(industry, DIRECTION_MAP["general"])
        freq      = FREQ_MAP.get(platform, "2–3 posts/day")

        comp_note = f"Outmaneuver {competitors[0]} by owning the narrative they ignore." if competitors else "Own your niche before expanding reach."

        return {
            "agent":             self.name,
            "campaign_theme":    theme,
            "content_direction": f"{direction} For {name}, targeting {audience} — {comp_note}",
            "primary_platform":  platform,
            "goal":              goal,
            "tone":              tone,
            "offer_focus":       offer or name,
            "recommended_post_frequency": freq,
            "best_posting_times": ["8:00 AM", "12:30 PM", "7:00 PM"],
            "strategic_hook":    f"Position {name} as the brand that actually speaks to {audience} — not at them.",
        }
