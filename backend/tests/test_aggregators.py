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

if __name__ == "__main__":
    unittest.main()
