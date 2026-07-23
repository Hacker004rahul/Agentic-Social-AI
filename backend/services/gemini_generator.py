import os
import httpx        
import base64
import asyncio

def generate_caption_and_image(platform: str, brand: dict, goal: str, limit: int) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    brand_name = brand.get("brand_name", "us")
    audience = brand.get("target_audience", "our audience")
    offer = brand.get("offer", brand_name)
    industry = brand.get("industry", "general")
    tone = brand.get("tone", "casual")

    # Generate Caption via Gemini 1.5 Flash
    caption_prompt = f"""
    Generate a highly engaging social media post caption for {platform}.
    Brand: {brand_name}
    Industry: {industry}
    Target Audience: {audience}
    Offer/Product: {offer}
    Tone/Voice: {tone}
    Goal: {goal}
    
    Requirements:
    1. Write in a modern, premium, engaging style.
    2. Respect the character limit of {limit} characters.
    3. Include 3 relevant hashtags.
    4. Do not include placeholders, formatting blocks, or metadata. Output ONLY the raw caption text.
    """

    caption = ""
    image_base64 = None

    with httpx.Client(timeout=30.0) as client:
        try:
            # 1. Generate text caption
            r = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": caption_prompt}]}],
                    "generationConfig": {"maxOutputTokens": 800}
                },
                headers={"Content-Type": "application/json"}
            )
            if r.status_code == 200:
                data = r.json()
                caption = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                print(f"[Gemini Generator] Caption API error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"[Gemini Generator] Caption generation failed: {e}")

        # If caption generation failed or returned empty, return None to trigger template fallback
        if not caption:
            return None

        # 2. Generate matching image via Imagen 3.0
        image_prompt = f"A professional, clean, premium commercial ad banner image for {brand_name}. {offer} for {audience}. High resolution, realistic product photo, studio lighting, modern minimalist design, {tone} aesthetic."
        try:
            # Try Imagen 3.0 generateImages REST API
            img_r = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key={api_key}",
                json={
                    "prompt": image_prompt,
                    "numberOfImages": 1,
                    "aspectRatio": "1:1",
                    "outputMimeType": "image/jpeg"
                },
                headers={"Content-Type": "application/json"}
            )
            if img_r.status_code == 200:
                img_data = img_r.json()
                image_base64 = img_data["generatedImages"][0]["image"]["imageBytes"]
            else:
                print(f"[Gemini Generator] Imagen API error {img_r.status_code}: {img_r.text}")
        except Exception as e:
            print(f"[Gemini Generator] Imagen generation failed: {e}")

    return {
        "content": caption,
        "image_data": f"data:image/jpeg;base64,{image_base64}" if image_base64 else None
    }
