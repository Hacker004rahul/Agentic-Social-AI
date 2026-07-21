import random

COMMENT_REPLY_TEMPLATES = [
    "This is exactly why we built {brand} for {audience} — love hearing this! 🙌",
    "You just made our whole team's day. More of this coming very soon 🔥",
    "THIS. This is why {brand} exists. Thank you for getting it 💙",
    "Saving your comment to share with the team — genuinely means a lot to us 🙏",
    "If you found this helpful, wait until you see what we're dropping next week 👀",
    "You're exactly who we built {brand} for. Welcome to the community ✨",
]

NEGATIVE_REPLY_TEMPLATES = [
    "We hear you — and honestly, fair. DM us and let's figure out what went wrong. We'll make it right. 🙏",
    "This feedback matters more than you know. Can you DM {brand} directly? We want to understand your experience.",
    "Not the experience we want for any {audience}. Please reach out — we're genuinely committed to fixing this.",
]

DM_TEMPLATES = [
    "Hey [Name] 👋 Thanks for reaching out to {brand}! We saw your message about {offer} and we're on it. What's the best way to help you today?",
    "Hi [Name]! The {brand} team here. We noticed your question about {offer} — here's exactly what you need to know: [answer]. Anything else we can help with? 😊",
    "Hey [Name]! We don't want you to wait — here's a direct answer on {offer} from {brand}: [details]. If there's more we can do, just reply here 🙏",
    "[Name], thanks for reaching out! We built {brand} specifically for {audience} and {offer} is a big part of that. Let us walk you through it — got 2 minutes?",
]

class EngagementAgent:
    name = "EngagementAgent"

    def run(self, brand: dict) -> dict:
        b = brand.get("brand_name", "us")
        a = brand.get("target_audience", "our audience")
        o = brand.get("offer", brand.get("brand_name", "our product"))

        def fill(t):
            return t.format(brand=b, audience=a, offer=o)

        return {
            "agent":            self.name,
            "comment_replies":  [fill(t) for t in random.sample(COMMENT_REPLY_TEMPLATES, 4)],
            "negative_replies": [fill(t) for t in random.sample(NEGATIVE_REPLY_TEMPLATES, 2)],
            "dm_templates":     [fill(t) for t in random.sample(DM_TEMPLATES, 3)],
        }
