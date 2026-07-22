PLATFORM_ALIASES = {
    "instagram": "Instagram",
    "ig": "Instagram",
    "linkedin": "LinkedIn",
    "likedin": "LinkedIn",
    "twitter": "Twitter",
    "x": "Twitter",
    "youtube": "YouTube",
    "yt": "YouTube",
    "facebook": "Facebook",
    "fb": "Facebook",
    "tiktok": "TikTok",
    "buffer": "Buffer",
    "hootsuite": "Hootsuite",
}


def normalize_platform(platform: str) -> str:
    key = str(platform or "").strip().lower()
    return PLATFORM_ALIASES.get(key, str(platform or "").strip() or "Instagram")


def normalize_platforms(platforms) -> list[str]:
    if not platforms:
        return ["Instagram"]
    return [normalize_platform(platform) for platform in platforms]


def platform_lookup(mapping: dict, platform: str, default_key: str = "Instagram"):
    if platform == "Twitter" and "X" in mapping:
        return mapping["X"]
    return mapping.get(platform, mapping[default_key])
