import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from core.auth import get_current_user
from services.video_providers import select_provider, get_selected_provider_key

class TestVideoStudioRouter(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.client = TestClient(app)
        
        # Override authentication dependency for test client
        self.mock_user = {"id": "test_user_id", "email": "test@domain.com", "name": "Test User"}
        app.dependency_overrides[get_current_user] = lambda: self.mock_user

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_providers(self):
        r = self.client.get("/video/providers")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("selected", data)
        self.assertIn("providers", data)
        self.assertTrue(any(p["key"] == data["selected"] for p in data["providers"]))

    def test_select_provider(self):
        r = self.client.post("/video/providers/select", json={"provider_key": "runway"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(get_selected_provider_key(), "runway")
        
        # Restore default
        select_provider("google")

    @patch("services.video_generator.generate_storyboard")
    @patch("services.video_generator.generate_thumbnail")
    @patch("core.config.get_db")
    async def test_generate_video(self, mock_get_db, mock_thumb, mock_storyboard):
        from unittest.mock import AsyncMock
        mock_storyboard.return_value = [
            {"scene": 1, "heading": "Hook", "visual_description": "visual prompt", "narration": "voice line", "duration": 5}
        ]
        mock_thumb.return_value = "/static/uploads/mock_cover.jpg"
        
        # Mock database calls
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db["video_projects"].insert_one = AsyncMock()
        mock_db["storyboards"].insert_one = AsyncMock()
        mock_db["video_assets"].insert_one = AsyncMock()
        
        # Trigger generation endpoint
        r = self.client.post("/video/generate", json={
            "brand_name": "Test Brand",
            "content": "Test caption to convert to video",
            "platform": "YouTube",
            "duration": 10,
            "mood": "chill",
            "voice_gender": "female"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["brand_name"], "Test Brand")
        self.assertEqual(data["duration"], 10)
        self.assertEqual(data["platform"], "YouTube")
        self.assertEqual(data["status"], "pending")

if __name__ == "__main__":
    unittest.main()
