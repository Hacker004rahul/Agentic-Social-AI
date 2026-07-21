import random

INDUSTRY_TRENDS = {
    "sports": {
        "hashtags": ["#JustDoIt", "#TrainHard", "#AthleteMindset", "#SportsCulture", "#WinningMentality", "#Gameday", "#PerformanceFirst"],
        "formats":  ["Behind-the-training Reels", "Athlete transformation Carousels", "Match-day Stories", "Fan reaction compilations"],
        "interest": "Performance content and athlete lifestyle storytelling is dominating — audiences want raw, unfiltered training footage.",
    },
    "fashion": {
        "hashtags": ["#OOTD", "#StreetStyle", "#FashionWeek", "#SustainableFashion", "#StyleInspo", "#FashionForward", "#WearYourStory"],
        "formats":  ["Get-ready-with-me Reels", "Style Carousels", "Collab reveal Stories", "Aesthetic mood boards"],
        "interest": "Micro-trends cycle fast — audiences engage most with 'this week's look' content and behind-the-design access.",
    },
    "food": {
        "hashtags": ["#FoodieLife", "#RecipeAlert", "#EatLocal", "#FoodPhotography", "#CheatDay", "#HealthyEating", "#FoodCulture"],
        "formats":  ["45-second recipe Reels", "Ingredient reveal Carousels", "Chef's table Stories", "Food-ASMR clips"],
        "interest": "Recipe content with a story hook (not just how-to) drives 3x more saves and shares than standard food photography.",
    },
    "tech": {
        "hashtags": ["#TechLife", "#AIRevolution", "#BuildInPublic", "#ProductHunt", "#StartupLife", "#FutureIsNow", "#TechTips"],
        "formats":  ["Demo screen-record Reels", "Explainer Carousels", "Founder-story threads", "Live product builds"],
        "interest": "Behind-the-build and 'I made this in 24 hours' content massively outperforms polished product ads right now.",
    },
    "fitness": {
        "hashtags": ["#FitLife", "#TransformationTuesday", "#WorkoutRoutine", "#HealthFirst", "#GymRat", "#FitnessJourney", "#SweatEveryDay"],
        "formats":  ["Form-check Reels", "30-day challenge Carousels", "Meal prep Stories", "PR celebration clips"],
        "interest": "Transformation narratives and form-check content drive the most saves. Community challenges boost follower acquisition.",
    },
    "business": {
        "hashtags": ["#Entrepreneurship", "#BuildInPublic", "#StartupLife", "#Leadership", "#BusinessMindset", "#GrowthHacking", "#Founder"],
        "formats":  ["Insight thread posts", "Myth-busting Carousels", "Revenue milestone reveals", "Decision-making frameworks"],
        "interest": "Controversial takes and contrarian business advice generate 5–8x more comments than standard motivational content.",
    },
    "education": {
        "hashtags": ["#LearnEveryDay", "#EdTech", "#SkillBuilding", "#KnowledgeIsPower", "#StudyTips", "#MicroLearning", "#GrowthMindset"],
        "formats":  ["Tip Carousels (5-slide max)", "Mini-lecture Reels", "Quiz Story stickers", "Resource round-up threads"],
        "interest": "Bite-sized knowledge with visual hierarchy (numbered lists, clean design) outperforms long-form educational content.",
    },
    "general": {
        "hashtags": ["#Trending", "#Authentic", "#RealTalk", "#CommunityFirst", "#StoriesFirst", "#HumanFirst", "#Inspiration"],
        "formats":  ["Storytelling Reels", "Value Carousels", "Behind-the-scenes Stories", "Reaction threads"],
        "interest": "Authenticity and raw unpolished content significantly outperforms highly-produced brand content right now.",
    },
}

class TrendAgent:
    name = "TrendAgent"

    def run(self, brand: dict) -> dict:
        industry = brand.get("industry", "general").lower()
        name     = brand.get("brand_name", "your brand")
        audience = brand.get("target_audience", "your audience")
        key      = industry if industry in INDUSTRY_TRENDS else "general"
        data     = INDUSTRY_TRENDS[key]

        tags    = random.sample(data["hashtags"], min(5, len(data["hashtags"])))
        formats = random.sample(data["formats"], min(3, len(data["formats"])))

        return {
            "agent":                  self.name,
            "trending_hashtags":      tags,
            "trending_formats":       formats,
            "audience_interest":      f"{data['interest']} {name} should capitalize on this with {audience} now.",
            "trend_relevance_score":  f"{random.randint(82, 97)}%",
            "trending_topic_hook":    f"What's working this week in {industry}: {formats[0].lower()} content is seeing the highest organic reach.",
        }
