import random
from datetime import datetime, timedelta

USERNAMES = ["@alex_m", "@priya.k", "@john_doe99", "@sara_c", "@techguy42", "@brandlover", "@marketingpro", "@sneakerhead", "@fitnessfirst", "@coffeelover_99"]

COMMENT_TEMPLATES = {
    "positive": [
        "This is exactly what I've been looking for from {brand} 🙌",
        "{brand} never misses. Every drop hits harder than the last 🔥",
        "As a {audience}, this speaks directly to me. Saving this.",
        "Finally a {industry} brand that actually gets it. {brand} is different.",
        "You guys just earned a new loyal customer. The {offer} is 🔥",
        "Shared this with my entire {audience} group — we've been waiting for this.",
    ],
    "negative": [
        "Not impressed tbh. Expected more from {brand} after all the hype.",
        "The {offer} looks good but the price point for {audience} is way off.",
        "I've seen better from other {industry} brands lately. Feeling let down.",
        "Used to love {brand} but this feels like it's lost its identity.",
    ],
    "question": [
        "Does {brand} ship internationally? Asking for {audience} in the EU 🙋",
        "How is {offer} different from what others in {industry} are doing?",
        "Is there a discount for {audience} who've been following since day one?",
        "Can you break down how {offer} actually works? Would love more context.",
        "Is {brand} doing any collabs soon? The {audience} community is watching 👀",
    ],
}

SMART_REPLY_TEMPLATES = {
    "positive": [
        "This makes everything worth it 🙏 You're exactly who {brand} was built for. More coming for the {audience} community soon 🔥",
        "We built {brand} for people exactly like you. Welcome to the family — stay close, it gets better from here 💙",
        "Your support is what keeps us going. Sharing this with the whole team — genuine thank you 🙏",
    ],
    "negative": [
        "We hear you — and honestly, this matters. DM {brand} directly and we'll personally address your experience with {offer}. We won't leave this unresolved 🙏",
        "Fair feedback and we appreciate it. The {brand} team takes this seriously — please reach out so we can understand and improve.",
        "Not the experience we want for any {audience}. DM us — {brand} will make this right, no questions asked.",
    ],
    "question": [
        "Great question! {offer} was designed specifically with {audience} in mind — DM {brand} and we'll give you the full breakdown personally 📩",
        "We'd love to walk you through this! Check the link in bio or DM {brand} directly — our team responds within 24h 😊",
        "Yes! And there's more to it than what we can fit here — DM {brand} and let's talk {offer} properly 🙌",
    ],
}

class InboxAgent:
    name = "InboxAgent"

    def run(self, brand: dict) -> dict:
        b = brand.get("brand_name", "us")
        a = brand.get("target_audience", "our audience")
        o = brand.get("offer", brand.get("brand_name", "our product"))
        ind = brand.get("industry", "this industry")
        platforms = brand.get("platforms", ["Instagram"])

        def fill(t):
            return t.format(brand=b, audience=a, offer=o, industry=ind)

        comments = []
        sentiments = ["positive", "positive", "positive", "negative", "question", "question"]
        for sent in sentiments:
            user    = random.choice(USERNAMES)
            message = fill(random.choice(COMMENT_TEMPLATES[sent]))
            reply   = fill(random.choice(SMART_REPLY_TEMPLATES[sent]))
            comments.append({
                "user":        user,
                "message":     message,
                "sentiment":   sent,
                "smart_reply": reply,
                "time":        (datetime.now() - timedelta(minutes=random.randint(5, 300))).strftime("%H:%M"),
                "platform":    random.choice(platforms),
            })

        dms = []
        dm_questions = [fill(t) for t in random.sample(COMMENT_TEMPLATES["question"], 3)]
        for i, q in enumerate(dm_questions):
            dms.append({
                "from":    random.choice(USERNAMES),
                "message": q,
                "time":    (datetime.now() - timedelta(hours=random.randint(1, 12))).strftime("%Y-%m-%d %H:%M"),
            })

        counts = {s: sum(1 for c in comments if c["sentiment"] == s) for s in ["positive", "negative", "question"]}

        return {
            "agent":             self.name,
            "comments":          comments,
            "dms":               dms,
            "sentiment_summary": counts,
            "unread_count":      len(comments) + len(dms),
        }
