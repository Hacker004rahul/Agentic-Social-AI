import random

WEAKNESS_TEMPLATES = [
    "{comp} posts consistently but never engages back — their comment section is a graveyard. {brand}'s responsiveness is an instant differentiator.",
    "{comp} leads with product specs, not people. {brand} has an opportunity to own the human story in {industry}.",
    "{comp}'s content is polished but cold — {audience} can feel the inauthenticity. Raw, real content from {brand} will resonate harder.",
    "{comp} ignores {audience} on weekends when engagement peaks — a window {brand} can dominate.",
    "{comp} has high follower count but sub-2% engagement — their audience is passive. {brand} can steal active fans with better community building.",
    "{comp} never does behind-the-scenes content. {audience} is hungry for it and {brand} can own that space.",
    "{comp} focuses only on {industry} insiders — {brand} can expand the conversation to attract mainstream {audience}.",
]

GAP_TEMPLATES = [
    "No competitor is speaking directly to the '{audience}' identity — they market at them, not with them. {brand} can own this.",
    "Behind-the-process content is completely absent from the {industry} space. First mover advantage is available right now.",
    "User-generated content campaigns are underutilized — {audience} wants to participate, not just watch.",
    "Short-form education content (under 60 seconds) is missing. {audience} is hungry for quick, useful knowledge.",
    "Collaborations with micro-influencers who actually speak to {audience} are wide open — big brands ignore this tier.",
    "Honest, unfiltered product comparison content doesn't exist in {industry}. {brand} doing this would go viral.",
]

COUNTER_TEMPLATES = [
    "When {comp} runs a product campaign, {brand} should simultaneously run a community or values campaign — contrast builds brand identity.",
    "Own the content format {comp} ignores most: if they post static images, {brand} goes all-in on video.",
    "Engage directly with {audience} in {comp}'s comment sections — provide value, don't pitch. Build affinity before they know your name.",
    "Launch a hashtag that {brand} owns — make it about {audience}'s identity, not the product. Let the community build it.",
    "Post during {comp}'s inactive hours (late evening, early morning) to capture their audience when they're absent.",
    "Create content that {comp} is too corporate to touch — controversial truths, real failures, unfiltered opinions.",
]

class CompetitorAgent:
    name = "CompetitorAgent"

    def run(self, brand: dict) -> dict:
        competitors = brand.get("competitors", ["Competitor A", "Competitor B"])
        name        = brand.get("brand_name", "your brand")
        audience    = brand.get("target_audience", "your audience")
        industry    = brand.get("industry", "this industry")

        def fill(t, comp=""):
            return t.format(brand=name, audience=audience, industry=industry, comp=comp)

        analysis = []
        for comp in competitors[:3]:
            avg_eng = round(random.uniform(1.2, 4.8), 1)
            analysis.append({
                "competitor":        comp,
                "estimated_posting": f"{random.randint(1, 3)}x per day",
                "top_content_type":  random.choice(["Reels", "Carousels", "Static Posts", "Stories", "Text Posts"]),
                "avg_engagement":    f"{avg_eng}%",
                "follower_estimate": f"{random.randint(50, 900)}K",
                "weakness":          fill(random.choice(WEAKNESS_TEMPLATES), comp),
                "content_gap":       f"{comp} rarely posts {random.choice(['behind-the-scenes', 'user stories', 'educational content', 'real-time reactions'])} — leaving that space open.",
            })

        gaps       = [fill(random.choice(GAP_TEMPLATES)) for _ in range(3)]
        counters   = [fill(random.choice(COUNTER_TEMPLATES), competitors[0] if competitors else "competitors") for _ in range(3)]

        ai_insight = (
            f"{competitors[0] if competitors else 'Your top competitor'}'s avg engagement of "
            f"{analysis[0]['avg_engagement'] if analysis else '2.1%'} means their audience is passive — "
            f"{name} targeting the same {audience} with authentic community content could realistically "
            f"achieve 2–3x their engagement rate within 60 days."
        ) if competitors else f"No direct competitors listed — {name} has first-mover advantage in owning the {audience} narrative."

        return {
            "agent":               self.name,
            "competitor_analysis": analysis,
            "gaps_to_exploit":     gaps,
            "counter_strategy":    counters,
            "ai_insight":          ai_insight,
        }
