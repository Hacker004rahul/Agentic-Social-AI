import random

QUICK_WIN_TEMPLATES = [
    "Pin your most authentic {brand} post to your profile — it signals real community, not just promotion.",
    "Add a direct question about {offer} to your next caption — questions get 3x more comments than statements.",
    "Repurpose your best {brand} content into a 15-second Reel with text overlay — same message, 10x the reach.",
    "Reply to every {audience} comment within the first hour of posting — this signals the algorithm to boost reach.",
    "Use 3–5 niche hashtags specific to {industry} instead of broad ones — you'll reach fewer but far more relevant {audience}.",
    "Post one raw, unpolished behind-the-scenes {brand} moment this week — authenticity outperforms production value right now.",
    "DM the top 10 accounts that engage most with {brand} — personal outreach converts to loyal advocates.",
]

AB_TEST_TEMPLATES = [
    {"va": "Hook: '{brand} was built for {audience}'", "vb": "Hook: 'What {audience} actually wants from {offer}'", "goal": "Test identity-led vs curiosity-led hooks"},
    {"va": "Carousel showing {offer} features", "vb": "Reel showing a real {audience} using {offer}", "goal": "Test product-first vs people-first content"},
    {"va": "Post at 9 AM peak hour", "vb": "Post at 10 PM when competitors are quiet", "goal": "Test algorithmic peak vs low-competition window"},
    {"va": "CTA: 'Comment your thoughts'", "vb": "CTA: 'DM us \"{offer}\" to learn more'", "goal": "Test engagement vs conversion intent"},
    {"va": "Formal {brand} brand voice", "vb": "Casual first-person voice from a team member", "goal": "Test brand vs human voice resonance with {audience}"},
]

RESCUE_TEMPLATES = [
    "If {brand} engagement drops below 2%, go all-in on short-form video for 7 days — {audience} respond to motion.",
    "If reach is stalling, partner with 2–3 {industry} micro-creators who already speak to {audience}. Their trust transfers.",
    "If {offer} CTR is low, the problem is the hook not the product — A/B test 5 different opening lines this week.",
    "If follower growth stalls, launch a '{brand} challenge' specifically designed for {audience} identity expression.",
    "If comments disappear, you've become a broadcaster. Go back to asking direct questions and responding to every single one.",
]

class SuggestionAgent:
    name = "SuggestionAgent"

    def run(self, analytics: dict, brand: dict = None) -> dict:
        brand    = brand or {}
        b        = brand.get("brand_name", "your brand")
        a        = brand.get("target_audience", "your audience")
        o        = brand.get("offer", "your product")
        ind      = brand.get("industry", "your industry")
        best     = analytics.get("best_platform", "Instagram")
        total_r  = analytics.get("total_reach", 0)

        def fill(t):
            return t.format(brand=b, audience=a, offer=o, industry=ind)

        ab_raw = random.sample(AB_TEST_TEMPLATES, 2)
        ab_tests = [{"variant_a": fill(t["va"]), "variant_b": fill(t["vb"]), "goal": fill(t["goal"])} for t in ab_raw]

        return {
            "agent":          self.name,
            "quick_wins":     [fill(t) for t in random.sample(QUICK_WIN_TEMPLATES, 3)],
            "ab_tests":       ab_tests,
            "rescue_plans":   [fill(t) for t in random.sample(RESCUE_TEMPLATES, 2)],
            "focus_platform": best,
            "note":           f"Double down on {best} — it generated {total_r:,} reach this run. {b} should own this platform before expanding.",
        }
