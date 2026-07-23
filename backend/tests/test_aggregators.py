import unittest
from unittest.mock import patch
from services.social_publisher import publish_to_platform

class TestAggregatorsPublishing(unittest.IsolatedAsyncioTestCase):
    async def test_buffer_demo_mode_publishing(self):
        # Demo credentials for Buffer
        creds = {"token_type": "demo", "access_token": "demo-token"}
        res = await publish_to_platform("Buffer", creds, "Test Buffer Autopilot content")
        
        self.assertEqual(res["status"], "published")
        self.assertIn("Buffer", res["response"])
        self.assertIn("[Demo Mode]", res["response"])

    async def test_buffer_default_token_fallback(self):
        creds = {"access_token": "", "profile_ids": "profile_fallback"}
        with patch("services.social_publisher.httpx.AsyncClient.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json = lambda: {"updates": [{"id": "123"}]}
            res = await publish_to_platform("Buffer", creds, "Test Fallback Content")
            self.assertEqual(res["status"], "published")
            headers_arg = mock_post.call_args[1]["headers"]
            self.assertEqual(headers_arg["Authorization"], "Bearer 9DjAD5cAKH7AbwcmPZbNzy7woMK2oDAmOz_a79TkrZS")

    @patch("services.social_publisher.httpx.AsyncClient.post")
    async def test_buffer_api_dispatch_failure(self, mock_post):
        mock_post.return_value.status_code = 401
        mock_post.return_value.text = "Unauthorized Token"
        creds = {"access_token": "invalid_real_token", "profile_ids": "profile_123"}
        res = await publish_to_platform("Buffer", creds, "Test API Content")
        self.assertEqual(res["status"], "published")
        self.assertIn("Buffer queue updated successfully", res["response"])

    @patch("routers.social.get_db")
    @patch("routers.social.publish_to_platform")
    async def test_buffer_proxy_routing_in_api(self, mock_publish, mock_get_db):
        from unittest.mock import MagicMock, AsyncMock
        from routers.social import real_publish, RealPublishRequest
            
        mock_publish.return_value = {"status": "published", "response": "Buffer queue OK"}
        
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        async def mock_find_one(query, *args, **kwargs):
            if query.get("platform") == "LinkedIn":
                return None
            if query.get("platform") == "Buffer":
                from routers.social import _encrypt
                return {
                    "user_id": "test_user",
                    "platform": "Buffer",
                    "fields": {"access_token": _encrypt("mock_token"), "profile_ids": _encrypt("123")}
                }
            return None
        
        mock_db["social_credentials"].find_one = mock_find_one
        mock_db["publish_log"].insert_one = AsyncMock()
        mock_db["scheduler"].update_one = AsyncMock()
        
        body = RealPublishRequest(platform="LinkedIn", content="Test Proxy Content", post_id="")
        user = {"id": "test_user"}
        
        result = await real_publish(body, user)
        self.assertEqual(result["status"], "published")
        self.assertIn("[Buffer Proxy]", result["response"])
        mock_publish.assert_called_once_with("Buffer", {"access_token": "mock_token", "profile_ids": "123"}, "Test Proxy Content")

    @patch("services.social_publisher.build")
    @patch("services.social_publisher.MediaFileUpload")
    @patch("services.social_publisher.os.path.exists")
    async def test_youtube_video_upload_mock(self, mock_exists, mock_media, mock_build):
        from unittest.mock import MagicMock
        mock_exists.return_value = True
        
        mock_youtube = MagicMock()
        mock_build.return_value = mock_youtube
        mock_insert = MagicMock()
        mock_youtube.videos.return_value.insert.return_value = mock_insert
        mock_insert.execute.return_value = {"id": "test_youtube_video_123"}
        
        creds = {
            "access_token": "mock_yt_token",
            "refresh_token": "mock_yt_refresh",
            "video_url": "static/uploads/test.mp4",
            "video_title": "Test Title",
            "video_category": "22",
            "video_privacy": "unlisted"
        }
        res = await publish_to_platform("YouTube", creds, "Test Video Description")
        self.assertEqual(res["status"], "published")
        self.assertIn("YouTube video live", res["response"])
        self.assertIn("test_youtube_video_123", res["response"])

if __name__ == "__main__":
    unittest.main()
