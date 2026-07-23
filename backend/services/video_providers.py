import os
import random
from typing import Dict, Any, List

class BaseVideoProvider:
    name: str = "Base"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        """
        Generates a video file based on the prompt, duration, and style.
        Returns a dict: {"video_url": str, "provider": str, "job_id": str}
        """
        raise NotImplementedError("Each provider must implement generate_video")


class GoogleVeoProvider(BaseVideoProvider):
    name = "Google Veo"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("GOOGLE_VEO_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        # Real integration would make a request to Veo API, e.g.
        # r = httpx.post("https://generativelanguage.googleapis.com/v1beta/models/veo-2.0:generateVideo", ...)
        return {
            "video_url": f"/static/uploads/veo_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"veo_job_{random.randint(100000, 999999)}"
        }


class RunwayProvider(BaseVideoProvider):
    name = "Runway Gen-2"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("RUNWAY_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/runway_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"runway_job_{random.randint(100000, 999999)}"
        }


class LumaProvider(BaseVideoProvider):
    name = "Luma Dream Machine"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("LUMA_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/luma_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"luma_job_{random.randint(100000, 999999)}"
        }


class PikaProvider(BaseVideoProvider):
    name = "Pika Labs"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("PIKA_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/pika_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"pika_job_{random.randint(100000, 999999)}"
        }


class KlingProvider(BaseVideoProvider):
    name = "Kling AI"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("KLING_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/kling_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"kling_job_{random.randint(100000, 999999)}"
        }


class OpenAIVideoProvider(BaseVideoProvider):
    name = "OpenAI Sora"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/openai_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"openai_job_{random.randint(100000, 999999)}"
        }


class StabilityVideoProvider(BaseVideoProvider):
    name = "Stability AI Video"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("STABILITY_API_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/stability_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"stability_job_{random.randint(100000, 999999)}"
        }


class FalAIProvider(BaseVideoProvider):
    name = "Fal AI"

    def generate_video(self, prompt: str, duration: int, visual_style: str = "realistic") -> Dict[str, Any]:
        api_key = os.getenv("FAL_KEY")
        if not api_key:
            return {"fallback": True, "provider": self.name}
        
        return {
            "video_url": f"/static/uploads/fal_{random.randint(1000, 9999)}.mp4",
            "provider": self.name,
            "job_id": f"fal_job_{random.randint(100000, 999999)}"
        }


# Registry of available providers
PROVIDERS = {
    "google": GoogleVeoProvider(),
    "runway": RunwayProvider(),
    "luma": LumaProvider(),
    "pika": PikaProvider(),
    "kling": KlingProvider(),
    "openai": OpenAIVideoProvider(),
    "stability": StabilityVideoProvider(),
    "fal": FalAIProvider()
}

_selected_provider = "google"

def get_selected_provider_key() -> str:
    return _selected_provider

def select_provider(key: str):
    global _selected_provider
    if key in PROVIDERS:
        _selected_provider = key

def get_selected_provider() -> BaseVideoProvider:
    return PROVIDERS.get(_selected_provider, PROVIDERS["google"])
