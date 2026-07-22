"""
OAuth 2.0 flow for LinkedIn, X, Facebook/Instagram, YouTube.

Flow:
  1. Frontend opens  GET /social/oauth/{platform}/start?user_id=...
  2. Backend redirects user to platform login page
  3. User logs in and approves
  4. Platform redirects to GET /social/oauth/{platform}/callback?code=...&state=...
  5. Backend exchanges code for access token
  6. Token saved encrypted to social_credentials
  7. Backend closes popup with postMessage to frontend
"""
import os
import base64
import hashlib
import hmac
import json
import secrets
import urllib.parse
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse

from core.config import get_db, settings
from core.platforms import normalize_platform

router = APIRouter(prefix="/social/oauth", tags=["oauth"])

# ── Helpers ────────────────────────────────────────────────
def _fernet():
    from cryptography.fernet import Fernet
    raw = settings.JWT_SECRET.encode()
    key = base64.urlsafe_b64encode(raw.ljust(32)[:32])
    return Fernet(key)

def _encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()

def _redirect_uri(platform: str) -> str:
    base = settings.OAUTH_REDIRECT_BASE
    if "localhost" in base:
        base = base.replace("localhost", "127.0.0.1")
    return f"{base}/social/oauth/{platform}/callback"

def _close_popup(status: str, platform: str, error: str = "") -> HTMLResponse:
    """Returns an HTML page that posts a message to the opener and closes itself."""
    msg = json.dumps({"type": "oauth_done", "platform": platform, "status": status, "error": error})
    html = f"""<!DOCTYPE html><html><body><script>
    if (window.opener) {{ window.opener.postMessage({msg}, '*'); }}
    window.close();
    </script><p>{status} — you can close this window.</p></body></html>"""
    return HTMLResponse(html)

async def _save_creds(user_id: str, platform: str, fields: dict):
    db        = get_db()
    platform  = normalize_platform(platform)
    encrypted = {k: _encrypt(str(v)) for k, v in fields.items()}
    await db["social_credentials"].update_one(
        {"user_id": user_id, "platform": platform},
        {"$set": {"user_id": user_id, "platform": platform,
                  "fields": encrypted, "saved_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )

# ── State cookie helpers (CSRF protection) ─────────────────
def _make_state(user_id: str) -> str:
    """Encode user_id + random nonce into state param."""
    nonce = secrets.token_hex(16)
    raw   = json.dumps({"user_id": user_id, "nonce": nonce})
    return base64.urlsafe_b64encode(raw.encode()).decode()

def _parse_state(state: str) -> dict:
    try:
        return json.loads(base64.urlsafe_b64decode(state + "==").decode())
    except Exception:
        raise HTTPException(400, "Invalid OAuth state")


FIELDS_MAP = {
    "LinkedIn": [
        {"key": "access_token", "label": "Access Token", "type": "password"},
        {"key": "person_urn", "label": "Person URN (e.g. urn:li:person:ABC123)", "type": "text"}
    ],
    "Facebook": [
        {"key": "access_token", "label": "Page Access Token", "type": "password"},
        {"key": "page_id", "label": "Page ID", "type": "text"}
    ],
    "Instagram": [
        {"key": "access_token", "label": "Instagram Access Token", "type": "password"},
        {"key": "ig_user_id", "label": "Instagram User ID", "type": "text"}
    ],
    "Twitter": [
        {"key": "api_key",       "label": "Consumer Key (API Key)", "type": "password"},
        {"key": "api_secret",    "label": "Consumer Secret (API Secret)", "type": "password"},
        {"key": "access_token",  "label": "Access Token", "type": "password"},
        {"key": "access_secret", "label": "Access Secret (Access Token Secret)", "type": "password"}
    ],
    "YouTube": [
        {"key": "access_token", "label": "OAuth Access Token", "type": "password"},
        {"key": "channel_id",   "label": "Channel ID", "type": "text"}
    ]
}


def _missing_creds_html(platform: str, env_var: str, user_id: str, live_url: str = None) -> HTMLResponse:
    fields = FIELDS_MAP.get(platform, [])
    fields_html = ""
    for f in fields:
        fields_html += f"""
        <div class="form-group">
            <label>{f['label']}</label>
            <input type="{f['type']}" name="{f['key']}" required />
        </div>
        """

    live_button = ""
    if live_url:
        live_button = f"""
        <a href="{live_url}" class="btn btn-live">🔗 Sign in to Live {platform} Account</a>
        <div class="section-divider">
            <span>Or</span>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Connect {platform} — Agentic Social AI</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 24px; display: grid; place-items: center; min-height: 90vh; margin: 0; }}
        .card {{ background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; max-width: 480px; width: 100%; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); box-sizing: border-box; }}
        .badge {{ background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; display: inline-block; margin-bottom: 14px; letter-spacing: 0.05em; text-transform: uppercase; }}
        h2 {{ color: #f8fafc; margin: 0 0 8px 0; font-size: 1.35rem; }}
        p {{ font-size: 0.88rem; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }}
        code {{ background: #0f172a; color: #f59e0b; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 0.84rem; border: 1px solid #1e293b; }}
        .btn {{ display: block; width: 100%; box-sizing: border-box; text-align: center; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; border: none; cursor: pointer; transition: all 0.2s ease; margin-top: 14px; text-decoration: none; }}
        .btn:hover {{ background: #1d4ed8; transform: translateY(-1px); }}
        .btn-live {{ background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.15); }}
        .btn-live:hover {{ background: linear-gradient(135deg, #059669, #047857); }}
        .btn-secondary {{ background: #1e293b; color: #cbd5e1; border: 1px solid #334155; margin-top: 8px; }}
        .btn-secondary:hover {{ background: #334155; }}
        .form-group {{ display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }}
        .form-group label {{ font-size: 0.78rem; font-weight: 600; color: #94a3b8; }}
        .form-group input {{ background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; color: #fff; font-size: 0.86rem; box-sizing: border-box; width: 100%; }}
        .form-group input:focus {{ border-color: #2563eb; outline: none; }}
        .section-divider {{ margin: 20px 0; border-top: 1px solid #1e293b; position: relative; }}
        .section-divider span {{ position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #131b2e; padding: 0 10px; font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">Connection Center</div>
        <h2>Connect {platform}</h2>
        <p>Choose your preferred connection method below:</p>
        
        {live_button}

        <!-- Option 1: Manual Keys -->
        <form method="POST" action="/social/oauth/manual-connect">
            <input type="hidden" name="user_id" value="{user_id}" />
            <input type="hidden" name="platform" value="{platform}" />
            {fields_html}
            <button type="submit" class="btn">🔌 Save & Connect Real Account</button>
        </form>

        <div class="section-divider">
            <span>Or</span>
        </div>

        <!-- Option 2: 1-Click Demo -->
        <form method="POST" action="/social/oauth/demo-connect">
            <input type="hidden" name="user_id" value="{user_id}" />
            <input type="hidden" name="platform" value="{platform}" />
            <button type="submit" class="btn btn-secondary">✨ Connect with 1-Click Demo Mode</button>
        </form>
    </div>
</body>
</html>"""
    return HTMLResponse(html)


@router.post("/demo-connect")
async def demo_connect(user_id: str = Form(...), platform: str = Form(...)):
    p = normalize_platform(platform)
    await _save_creds(user_id, p, {
        "access_token": f"demo-token-{p.lower()}",
        "page_id": f"demo-page-{p.lower()}",
        "person_urn": f"urn:li:person:demo-{p.lower()}",
        "ig_user_id": f"demo-ig-{p.lower()}",
        "channel_id": f"demo-ch-{p.lower()}",
        "token_type": "demo",
    })
    if p in ("Facebook", "Instagram"):
        await _save_creds(user_id, "Facebook", {
            "access_token": "demo-token-facebook",
            "page_id": "demo-page-facebook",
            "token_type": "demo",
        })
        await _save_creds(user_id, "Instagram", {
            "access_token": "demo-token-instagram",
            "ig_user_id": "demo-ig-instagram",
            "token_type": "demo",
        })
    return _close_popup("success", platform)


@router.post("/manual-connect")
async def manual_connect(
    request: Request,
    user_id: str = Form(...),
    platform: str = Form(...),
):
    form_data = await request.form()
    fields = {}
    for k, v in form_data.items():
        if k not in ("user_id", "platform"):
            fields[k] = str(v)
            
    p = normalize_platform(platform)
    await _save_creds(user_id, p, fields)
    return _close_popup("success", platform)


# ══════════════════════════════════════════════════════════
# LINKEDIN
# ══════════════════════════════════════════════════════════
@router.get("/linkedin/start")
async def linkedin_start(user_id: str):
    client_id = os.getenv("LINKEDIN_CLIENT_ID") or settings.LINKEDIN_CLIENT_ID
    if not client_id:
        return _missing_creds_html("LinkedIn", "LINKEDIN_CLIENT_ID", user_id)
    state  = _make_state(user_id)
    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id":     client_id,
        "redirect_uri":  _redirect_uri("linkedin"),
        "state":         state,
        "scope":         "openid profile w_member_social",
    })
    return RedirectResponse(f"https://www.linkedin.com/oauth/v2/authorization?{params}")


@router.get("/linkedin/callback")
async def linkedin_callback(code: str = None, state: str = None, error: str = None):
    if error or not code:
        return _close_popup("error", "LinkedIn", error or "No code returned")

    data    = _parse_state(state)
    user_id = data["user_id"]

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        r = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  _redirect_uri("linkedin"),
                "client_id":     settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = r.json()
        if "access_token" not in token_data:
            return _close_popup("error", "LinkedIn", str(token_data))

        access_token = token_data["access_token"]

        # Get person URN
        me = await client.get(
            "https://api.linkedin.com/v2/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me_data    = me.json()
        person_urn = f"urn:li:person:{me_data.get('id', '')}"

    await _save_creds(user_id, "LinkedIn", {
        "access_token": access_token,
        "person_urn":   person_urn,
    })
    return _close_popup("success", "LinkedIn")


# ══════════════════════════════════════════════════════════
# FACEBOOK + INSTAGRAM (same Meta app)
# ══════════════════════════════════════════════════════════
@router.get("/facebook/start")
async def facebook_start(user_id: str):
    client_id = os.getenv("META_CLIENT_ID") or settings.META_CLIENT_ID
    if not client_id:
        return _missing_creds_html("Facebook", "META_CLIENT_ID", user_id)
    state  = _make_state(user_id)
    params = urllib.parse.urlencode({
        "client_id":     client_id,
        "redirect_uri":  _redirect_uri("facebook"),
        "state":         state,
        "scope":         "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
        "response_type": "code",
    })
    return RedirectResponse(f"https://www.facebook.com/v19.0/dialog/oauth?{params}")


@router.get("/facebook/callback")
async def facebook_callback(code: str = None, state: str = None, error: str = None):
    if error or not code:
        return _close_popup("error", "Facebook", error or "No code returned")

    data    = _parse_state(state)
    user_id = data["user_id"]

    async with httpx.AsyncClient() as client:
        # Exchange code for short-lived token
        r = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "client_id":     settings.META_CLIENT_ID,
                "client_secret": settings.META_CLIENT_SECRET,
                "redirect_uri":  _redirect_uri("facebook"),
                "code":          code,
            },
        )
        token_data = r.json()
        if "access_token" not in token_data:
            return _close_popup("error", "Facebook", str(token_data))

        short_token = token_data["access_token"]

        # Exchange for long-lived token (60 days)
        r2 = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type":        "fb_exchange_token",
                "client_id":         settings.META_CLIENT_ID,
                "client_secret":     settings.META_CLIENT_SECRET,
                "fb_exchange_token": short_token,
            },
        )
        long_token = r2.json().get("access_token", short_token)

        # Get pages
        pages_r  = await client.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            params={"access_token": long_token},
        )
        pages    = pages_r.json().get("data", [])
        page     = pages[0] if pages else {}
        page_id  = page.get("id", "")
        page_tok = page.get("access_token", long_token)

        # Get Instagram business account linked to the page
        ig_r    = await client.get(
            f"https://graph.facebook.com/v19.0/{page_id}",
            params={"fields": "instagram_business_account", "access_token": page_tok},
        )
        ig_data = ig_r.json()
        ig_id   = ig_data.get("instagram_business_account", {}).get("id", "")

    # Save Facebook creds
    await _save_creds(user_id, "Facebook", {
        "access_token": page_tok,
        "page_id":      page_id,
    })
    # Save Instagram creds if linked
    if ig_id:
        await _save_creds(user_id, "Instagram", {
            "access_token": page_tok,
            "ig_user_id":   ig_id,
        })

    return _close_popup("success", "Facebook")


# ══════════════════════════════════════════════════════════
# X (Twitter) — OAuth 2.0 PKCE
# ══════════════════════════════════════════════════════════
@router.get("/x/start")
async def x_start(user_id: str):
    client_id = os.getenv("X_CLIENT_ID") or settings.X_CLIENT_ID
    if not client_id:
        return _missing_creds_html("Twitter", "X_CLIENT_ID", user_id)
    state         = _make_state(user_id)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode()

    # Store verifier in DB temporarily keyed by state
    db = get_db()
    await db["oauth_state"].update_one(
        {"state": state},
        {"$set": {"state": state, "code_verifier": code_verifier, "created_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )

    params = urllib.parse.urlencode({
        "response_type":         "code",
        "client_id":             client_id,
        "redirect_uri":          _redirect_uri("x"),
        "scope":                 "tweet.read tweet.write users.read offline.access",
        "state":                 state,
        "code_challenge":        code_challenge,
        "code_challenge_method": "S256",
    })
    return RedirectResponse(f"https://twitter.com/i/oauth2/authorize?{params}")


@router.get("/x/callback")
async def x_callback(code: str = None, state: str = None, error: str = None):
    if error or not code:
        return _close_popup("error", "X", error or "No code returned")

    data    = _parse_state(state)
    user_id = data["user_id"]

    db       = get_db()
    state_doc = await db["oauth_state"].find_one({"state": state})
    if not state_doc:
        return _close_popup("error", "X", "State not found — try again")
    code_verifier = state_doc["code_verifier"]
    await db["oauth_state"].delete_one({"state": state})

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  _redirect_uri("x"),
                "code_verifier": code_verifier,
            },
            auth=(settings.X_CLIENT_ID, settings.X_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = r.json()
        if "access_token" not in token_data:
            return _close_popup("error", "X", str(token_data))

    await _save_creds(user_id, "X", {
        "access_token":  token_data["access_token"],
        "refresh_token": token_data.get("refresh_token", ""),
        "token_type":    "oauth2",
    })
    return _close_popup("success", "X")


# ══════════════════════════════════════════════════════════
# YOUTUBE (Google OAuth 2.0)
# ══════════════════════════════════════════════════════════
@router.get("/youtube/start")
async def youtube_start(user_id: str):
    client_id = os.getenv("GOOGLE_CLIENT_ID") or settings.GOOGLE_CLIENT_ID
    live_url = None
    if client_id:
        state  = _make_state(user_id)
        params = urllib.parse.urlencode({
            "client_id":             client_id,
            "redirect_uri":          _redirect_uri("youtube"),
            "response_type":         "code",
            "scope":                 "https://www.googleapis.com/auth/youtube.force-ssl",
            "access_type":           "offline",
            "prompt":                "consent",
            "state":                 state,
        })
        live_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
        
    return _missing_creds_html("YouTube", "GOOGLE_CLIENT_ID", user_id, live_url=live_url)


@router.get("/youtube/callback")
async def youtube_callback(code: str = None, state: str = None, error: str = None):
    if error or not code:
        return _close_popup("error", "YouTube", error or "No code returned")

    data    = _parse_state(state)
    user_id = data["user_id"]

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri":  _redirect_uri("youtube"),
                "grant_type":    "authorization_code",
            },
        )
        token_data = r.json()
        if "access_token" not in token_data:
            return _close_popup("error", "YouTube", str(token_data))

        access_token  = token_data["access_token"]
        refresh_token = token_data.get("refresh_token", "")

        # Get channel ID
        ch_r     = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "id", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        ch_data    = ch_r.json()
        items      = ch_data.get("items") or []
        channel_id = items[0].get("id", "me") if items else "me"

    await _save_creds(user_id, "YouTube", {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "channel_id":    channel_id,
    })
    return _close_popup("success", "YouTube")
