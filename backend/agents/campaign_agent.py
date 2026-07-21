import random

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

POST_TYPES = {
    "awareness":   ["Brand Story", "Founder Post", "Mission Statement", "Behind the Scenes"],
    "engagement":  ["Poll / Quiz", "Question Post", "Community Shoutout", "Challenge Launch"],
    "conversion":  ["Offer Reveal", "Testimonial", "Product Demo", "CTA Post"],
    "retention":   ["Tips & Tricks", "How-To Post", "Customer Success", "Value Post"],
}

FORMATS = ["Reel", "Carousel", "Static Image", "Story", "Text Post", "Live Session"]

class CampaignAgent:
    name = "CampaignAgent"

    def run(self, brand: dict, strategy: dict, trends: dict) -> dict:
        goal      = strategy.get("goal", "awareness")
        platforms = brand.get("platforms", ["Instagram"])
        types     = POST_TYPES.get(goal, POST_TYPES["awareness"])
        plan      = []

        for i, day in enumerate(DAYS):
            post_type = types[i % len(types)]
            platform  = platforms[i % len(platforms)]
            plan.append({
                "day":        day,
                "platform":   platform,
                "post_type":  post_type,
                "format":     random.choice(FORMATS),
                "theme":      strategy.get("campaign_theme", "Brand Story"),
                "hashtags":   random.sample(trends.get("trending_hashtags", []), min(3, len(trends.get("trending_hashtags", [])))),
                "post_time":  random.choice(["9:00 AM", "12:00 PM", "5:00 PM", "7:00 PM"]),
            })

        return {
            "agent":         self.name,
            "campaign_name": f"{brand.get('brand_name', 'Brand')} — 7-Day {goal.title()} Campaign",
            "goal":          goal,
            "platform_focus": platforms,
            "weekly_plan":   plan,
        }
