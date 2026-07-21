import random
from core.platforms import normalize_platforms, platform_lookup

CHAR_LIMITS = {"Instagram": 2200, "LinkedIn": 3000, "Twitter": 280, "TikTok": 2200, "YouTube": 5000, "Facebook": 63206}

# Brand-aware hooks using actual brand context
HOOK_TEMPLATES = [
    "Nobody in {industry} is talking about what {brand} just figured out.",
    "If you're a {audience}, you need to hear this from {brand}.",
    "We've been building {brand} for {audience} — and we finally cracked it.",
    "Hot take: {brand} is changing how {audience} thinks about {offer}.",
    "The {industry} industry keeps lying to {audience}. {brand} won't.",
    "Real talk — {audience} deserves better than what's out there. That's why {brand} exists.",
    "Every {audience} asks us: what makes {brand} different? Here's the honest answer.",
    "Stop scrolling. If you care about {offer}, this is for you.",
    "{brand} was built by {audience}, for {audience}. Here's proof.",
    "What if {offer} actually delivered on its promise? {brand} does.",
]

BODY_TEMPLATES = {
    "Instagram": [
        "We didn't build {brand} in a boardroom. We built it because {audience} told us exactly what was missing — and we listened.\n\nEvery {offer} we create starts with one question: does this actually help {audience} or does it just look good?\n\nThe answer has to be both. Always. 💫",
        "Here's what {audience} never hears from {industry} brands:\n\nThe truth about {offer}.\n\nWe're saying it anyway — because {brand} was built on honesty, not hype. 🔥",
        "{audience} — you've been settling for less.\n\nNot anymore.\n\n{brand} exists to give you {offer} that actually lives up to the promise. No gimmicks. Just results. 💪",
    ],
    "LinkedIn": [
        "When we started {brand}, everyone told us {audience} wouldn't care about {offer} at this level.\n\nThey were wrong.\n\nHere's what we've learned building for {audience}:\n\n→ They don't want to be sold to. They want to be understood.\n→ {offer} isn't just a product to them — it's an identity decision.\n→ The brands winning in {industry} right now are the ones listening first.\n\nWe built {brand} on that principle. Every decision goes back to it.",
        "3 things the {industry} industry gets wrong about {audience}:\n\n1. They assume price drives decisions — it's actually trust.\n2. They talk about features — {audience} cares about outcomes.\n3. They broadcast — {audience} wants conversation.\n\n{brand} was built to do the opposite. That's not a marketing line — it's the entire strategy.",
    ],
    "Twitter": [
        "{brand} to {audience}: we see you, we hear you, and {offer} was made specifically for you. No middleman.",
        "Unpopular opinion: {industry} brands are too scared to actually speak to {audience}. {brand} isn't.",
        "Real ones know: {offer} from {brand} hits different. Built for {audience}, not algorithms.",
    ],
    "TikTok": [
        "POV: you're {audience} and you just discovered {brand} 🎯 {offer} but make it actually good. Here's why we're different from every other {industry} brand out there — thread 🧵",
        "Wait — {audience} has been SLEEPING on {offer}? Let {brand} fix that. First 3 seconds: this is what most {industry} brands won't tell you 🔥",
    ],
    "Facebook": [
        "To our community — especially every {audience} who's been with us from the start:\n\nWe built {brand} for you. Every product, every campaign, every decision — it comes back to you.\n\n{offer} was designed with one goal: give {audience} exactly what they've been asking for. We think we delivered. We'd love to hear what you think.",
        "Something we want to share with our {brand} family today:\n\nBuilding something for {audience} in the {industry} space isn't easy. But watching you all connect with {offer} makes every challenge worth it. Thank you for being part of this.",
    ],
}

CTA_MAP = {
    "awareness":  ["Follow {brand} for more of this", "Share this with a fellow {audience}", "Tag someone who needs to hear this 👇"],
    "engagement": ["Which part resonated most? Comment below 👇", "Tell us — are you a {audience}? Drop a 🙋 below", "Vote: does {brand} get it right? 👇"],
    "conversion": ["DM us '{offer}' to get started", "Link in bio — built for {audience}", "Limited to the first 100 {audience} who respond"],
    "retention":  ["Save this if you're a real {audience} 🔖", "Share with your {audience} community", "Which tip hits hardest for you?"],
}

HASHTAG_SETS = {
    "Instagram": ["#reels", "#explore", "#contentcreator", "#instadaily", "#viral"],
    "LinkedIn":  ["#leadership", "#marketing", "#branding", "#founder", "#growth"],
    "Twitter":   ["#startup", "#marketing", "#brand", "#growth"],
    "YouTube":   ["#youtube", "#community", "#shorts", "#subscribe", "#creator"],
    "TikTok":    ["#fyp", "#viral", "#brandtok", "#foryoupage", "#trending"],
    "Facebook":  ["#community", "#brand", "#business", "#local"],
}

def fill(template, brand):
    return template.format(
        brand    = brand.get("brand_name", "us"),
        audience = brand.get("target_audience", "our audience"),
        offer    = brand.get("offer", brand.get("brand_name", "our product")),
        industry = brand.get("industry", "our industry"),
    )

def build_post(platform, brand, goal, trend_tags):
    hook    = fill(random.choice(HOOK_TEMPLATES), brand)
    bodies  = platform_lookup(BODY_TEMPLATES, platform)
    body    = fill(random.choice(bodies), brand)
    cta_raw = random.choice(CTA_MAP.get(goal, CTA_MAP["awareness"]))
    cta     = fill(cta_raw, brand)
    platform_tags = HASHTAG_SETS.get(platform, [])
    base_tags = random.sample(platform_tags, min(3, len(platform_tags)))
    all_tags  = list(set(base_tags + random.sample(trend_tags, min(2, len(trend_tags)))))
    hashtags  = " ".join(all_tags)

    brand_tag = f"#{brand.get('brand_name','Brand').replace(' ','')}"
    if platform == "Twitter":
        content = f"{hook} {cta} {brand_tag} {hashtags}"
    else:
        content = f"{hook}\n\n{body}\n\n{cta}\n\n{brand_tag} {hashtags}"

    limit     = CHAR_LIMITS.get(platform, 2200)
    truncated = False
    if len(content) > limit:
        content   = content[:limit - 3] + "..."
        truncated = True

    return {
        "platform":   platform,
        "content":    content,
        "char_count": len(content),
        "char_limit": limit,
        "truncated":  truncated,
    }

class ContentAgent:
    name = "ContentAgent"

    def run(self, brand: dict, strategy: dict, trends: dict) -> dict:
        goal      = strategy.get("goal", "awareness")
        platforms = normalize_platforms(brand.get("platforms", ["Instagram"]))
        tags      = trends.get("trending_hashtags", [])
        posts     = [build_post(p, brand, goal, tags) for p in platforms]
        return {"agent": self.name, "posts": posts}
