import os
import random
import asyncio
import httpx
import json
from datetime import datetime
from typing import List, Dict, Any
from core.config import get_db, settings
from services.video_providers import get_selected_provider

# Ensure directories exist
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/templates", exist_ok=True)

async def download_fallback_video(duration: int) -> str:
    # Instantly return high quality vertical stock video CDN URL to bypass blocking download times
    return "https://assets.mixkit.co/videos/preview/mixkit-star-ry-night-sky-over-a-forest-44390-large.mp4"


# ── Storyboard Generator ───────────────────────────────────
async def generate_storyboard(caption: str, platform: str, tone: str, objective: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Default Storyboard fallback
        return [
            {"scene": 1, "heading": "Hook", "visual_description": f"Fast-paced visual matching the theme: {caption[:50]}...", "narration": "Stop scrolling and check this out!", "duration": 3},
            {"scene": 2, "heading": "Problem", "visual_description": "Desaturated, frustrating visual illustrating user struggles.", "narration": "Are you tired of wasting time on manual work?", "duration": 4},
            {"scene": 3, "heading": "Solution", "visual_description": "Bright, high-energy demo showcasing the main offer.", "narration": "Here is the ultimate automated tool built for you.", "duration": 5},
            {"scene": 4, "heading": "Benefits", "visual_description": "Clean metrics dashboard or benefit list transition.", "narration": "Get results faster, save money, and scale.", "duration": 5},
            {"scene": 5, "heading": "CTA", "visual_description": "Animated brand logo with direct text call to action.", "narration": "Link in bio! Subscribe and get started today.", "duration": 3}
        ]

    prompt = f"""
    You are an AI Video Director.
    Create a 5-scene vertical storyboard outline for a {platform} video.
    Caption: {caption}
    Tone: {tone}
    Objective: {objective}
    
    For each scene, output:
    1. "scene" index (1 to 5)
    2. "heading" (e.g. Hook, Problem, Solution, Benefits, CTA)
    3. "visual_description" (specific visual details)
    4. "narration" (narration line to voiceover)
    5. "duration" (scene duration in seconds, integer)
    
    Output format MUST be valid JSON list of objects exactly like this:
    [
      {{
        "scene": 1,
        "heading": "Hook",
        "visual_description": "Close up of...",
        "narration": "Narration text here",
        "duration": 5
      }}
    ]
    Do not output any markdown code blocks, backticks, or extra commentary. Output ONLY the raw JSON string.
    """
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 1000}
                },
                headers={"Content-Type": "application/json"}
            )
            if r.status_code == 200:
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                return json.loads(text.strip())
    except Exception as e:
        print(f"[-] Storyboard generation error: {e}")
        
    return [
        {"scene": 1, "heading": "Hook", "visual_description": f"Hook visual: {caption[:30]}", "narration": "Hey there! Listen to this.", "duration": 3},
        {"scene": 2, "heading": "Problem", "visual_description": "Frustrating scenario illustration", "narration": "Why is this always so hard?", "duration": 4},
        {"scene": 3, "heading": "Solution", "visual_description": "Product solution screen transition", "narration": "We just solved it for good.", "duration": 5},
        {"scene": 4, "heading": "Benefits", "visual_description": "Benefit slide highlighting productivity", "narration": "Boost your metrics starting now.", "duration": 5},
        {"scene": 5, "heading": "CTA", "visual_description": "Visual of call to action button", "narration": "Get started today, follow for more!", "duration": 3}
    ]


# ── AI Voiceover Generator ──────────────────────────────────
def generate_voiceover(text: str, gender: str = "female") -> str:
    try:
        from gtts import gTTS
        # Clever trick: com for general female, co.uk for British female/male style distinction
        tld = "com" if gender == "female" else "co.uk"
        tts = gTTS(text=text, lang="en", tld=tld)
        filename = f"voice_{uuid_sec()}.mp3"
        filepath = os.path.join("static", "uploads", filename)
        tts.save(filepath)
        return f"/static/uploads/{filename}"
    except Exception as e:
        print(f"[-] gTTS failed: {e}")
        
    # Return placeholder
    return "/static/templates/placeholder_voice.mp3"


# ── Subtitles Generator ─────────────────────────────────────
def generate_subtitles(storyboard: List[dict]) -> str:
    lines = ["WEBVTT\n"]
    current_time = 0.0
    for scene in storyboard:
        duration = float(scene.get("duration", 4.0))
        start_min, start_sec = divmod(current_time, 60)
        end_min, end_sec = divmod(current_time + duration, 60)
        
        start_str = f"{int(start_min):02d}:{start_sec:06.3f}"
        end_str = f"{int(end_min):02d}:{end_sec:06.3f}"
        
        lines.append(f"\n{start_str} --> {end_str}")
        lines.append(scene.get("narration", "Scene Video Narration"))
        
        current_time += duration
        
    filename = f"subtitles_{uuid_sec()}.vtt"
    filepath = os.path.join("static", "uploads", filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return f"/static/uploads/{filename}"


# ── Background Music Selector ──────────────────────────────
def generate_music(mood: str) -> str:
    # Retuns virtual background loop tracks
    music_map = {
        "energetic": "/static/templates/music_energetic.mp3",
        "corporate": "/static/templates/music_corporate.mp3",
        "cinematic": "/static/templates/music_cinematic.mp3",
        "chill": "/static/templates/music_chill.mp3"
    }
    return music_map.get(mood, "/static/templates/music_chill.mp3")


# ── Thumbnail Cover Image Generator ────────────────────────
def generate_thumbnail(title: str, visual_style: str = "clean minimal") -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            image_prompt = f"A professional high resolution visual cover for {title}. Style: {visual_style}. 9:16 vertical aspect ratio banner, cinematic, premium lighting."
            with httpx.Client(timeout=30.0) as client:
                img_r = client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key={api_key}",
                    json={
                        "prompt": image_prompt,
                        "numberOfImages": 1,
                        "aspectRatio": "9:16",
                        "outputMimeType": "image/jpeg"
                    },
                    headers={"Content-Type": "application/json"}
                )
                if img_r.status_code == 200:
                    import base64
                    img_data = img_r.json()
                    image_base64 = img_data["generatedImages"][0]["image"]["imageBytes"]
                    filename = f"cover_{uuid_sec()}.jpg"
                    filepath = os.path.join("static", "uploads", filename)
                    with open(filepath, "wb") as f:
                        f.write(base64.b64decode(image_base64))
                    return f"/static/uploads/{filename}"
        except Exception as e:
            print(f"[-] Thumbnail Imagen generation failed: {e}")
            
    # Mock cover fallback
    return "/static/templates/mock_cover.jpg"


# ── Core Video Pipeline Coordination ────────────────────────
async def create_video_project(brand_name: str, user_id: str, platform: str, duration: int, content: str, mood: str, voice_gender: str) -> Dict[str, Any]:
    db = get_db()
    
    # 1. Generate Storyboard
    storyboard = await generate_storyboard(content, platform, "professional", "awareness")
    
    # 2. Select Video Provider and request generation
    provider = get_selected_provider()
    prompt = " ".join([s.get("visual_description", "") for s in storyboard])
    res = provider.generate_video(prompt, duration)
    
    # 3. Handle Fallback download if key was missing
    video_url = res.get("video_url")
    if not video_url:
        video_url = await download_fallback_video(duration)
        
    # 4. Generate Voiceover from storyboard narration lines
    full_narration = " ".join([s.get("narration", "") for s in storyboard])
    voice_url = generate_voiceover(full_narration, voice_gender)
    
    # 5. Generate Subtitles
    subtitle_url = generate_subtitles(storyboard)
    
    # 6. Generate Music
    music_url = generate_music(mood)
    
    # 7. Generate Thumbnail Cover
    thumbnail_url = generate_thumbnail(content[:40], "minimalistic")
    
    project_id = str(uuid_sec())
    
    # Save project doc
    project_doc = {
        "id": project_id,
        "brand_name": brand_name,
        "user_id": user_id,
        "caption": content,
        "video_url": video_url,
        "thumbnail_url": thumbnail_url,
        "duration": duration,
        "platform": platform,
        "provider": provider.name,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    await db["video_projects"].insert_one(project_doc)
    
    # Save Storyboard
    await db["storyboards"].insert_one({
        "video_project_id": project_id,
        "scenes": storyboard
    })
    
    # Save Video Assets
    await db["video_assets"].insert_one({
        "id": str(uuid_sec()),
        "video_project_id": project_id,
        "voice_over_url": voice_url,
        "music_url": music_url,
        "subtitle_url": subtitle_url,
        "created_at": datetime.utcnow().isoformat()
    })
    
    return project_doc


# Helpers
def uuid_sec() -> str:
    import uuid
    import secrets
    return f"{uuid.uuid4().hex[:12]}_{secrets.token_hex(4)}"


async def auto_synthesis_videos_for_scheduled_posts(run_id: str, user_id: str):
    db = get_db()
    # Find all scheduled items generated in this run
    items = await db["scheduler"].find({"run_id": run_id}).to_list(100)
    for item in items:
        # Check if platform is YouTube and it doesn't have video URL yet
        if item.get("platform") == "YouTube" and not item.get("video_url"):
            # Update status to "generating_video" so UI tracks in real-time
            await db["scheduler"].update_one(
                {"id": item["id"]},
                {"$set": {"status": "generating_video"}}
            )
            try:
                # Generate AI video draft (includes storyboard, voice, and visual CDN fallback)
                project = await create_video_project(
                    brand_name=item.get("brand_name", "My Brand"),
                    user_id=user_id,
                    platform="YouTube",
                    duration=30,  # default Shorts/Video length
                    content=item.get("content", ""),
                    mood="chill",
                    voice_gender="female"
                )
                # Link video assets directly to the scheduled post document
                await db["scheduler"].update_one(
                    {"id": item["id"]},
                    {
                        "$set": {
                            "video_url": project["video_url"],
                            "video_title": project["caption"][:60],
                            "video_category": "22",
                            "video_privacy": "public",
                            "status": "scheduled" # Set back to scheduled so publisher picks it up
                        }
                    }
                )
            except Exception as e:
                # Fallback to standard scheduled text if video gen fails
                await db["scheduler"].update_one(
                    {"id": item["id"]},
                    {"$set": {"status": "scheduled", "error_message": f"Auto video gen failed: {str(e)}"}}
                )
