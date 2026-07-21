TONE_RULES = {
    "professional": {
        "avoid":    ["LOL", "OMG", "gonna", "wanna", "tbh", "ngl"],
        "prefer":   ["We believe", "Our approach", "Research shows", "Key insight"],
        "style":    "Use formal sentence structures. Avoid slang. Lead with data or insight.",
    },
    "casual": {
        "avoid":    ["Furthermore", "In conclusion", "It is imperative"],
        "prefer":   ["Hey!", "Let's talk about", "Real talk:", "Here's the thing —"],
        "style":    "Conversational and warm. Short sentences. Use contractions freely.",
    },
    "inspirational": {
        "avoid":    ["failed", "impossible", "can't"],
        "prefer":   ["You've got this", "Every step matters", "The journey starts now"],
        "style":    "Uplifting and motivational. End with a powerful CTA or quote.",
    },
    "witty": {
        "avoid":    ["To summarize", "As stated above"],
        "prefer":   ["Plot twist:", "Unpopular opinion:", "Nobody asked but —"],
        "style":    "Use humour carefully. Keep it clever, not offensive. Subvert expectations.",
    },
    "educational": {
        "avoid":    ["just", "simply", "obviously"],
        "prefer":   ["Here's how", "Step 1:", "The reason is", "Most people don't know"],
        "style":    "Clear and structured. Use numbered lists. Break down complex ideas.",
    },
}

class BrandVoiceAgent:
    name = "BrandVoiceAgent"

    def run(self, brand: dict, posts: list) -> dict:
        tone  = brand.get("tone", "casual").lower()
        rules = TONE_RULES.get(tone, TONE_RULES["casual"])
        flags = []

        for post in posts:
            content = post.get("content", "")
            for word in rules["avoid"]:
                if word.lower() in content.lower():
                    flags.append({
                        "platform": post["platform"],
                        "issue":    f"Found discouraged word/phrase: '{word}'",
                        "fix":      f"Replace with tone-appropriate language for '{tone}' voice.",
                    })

        return {
            "agent":       self.name,
            "tone":        tone,
            "style_guide": rules["style"],
            "prefer":      rules["prefer"],
            "avoid":       rules["avoid"],
            "flags":       flags,
            "status":      "✅ All posts match brand voice" if not flags else f"⚠️ {len(flags)} tone issue(s) found",
        }
