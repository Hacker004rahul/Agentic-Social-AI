import unittest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
from core.config import get_db, connect_db
from services.background_orchestrator import start_background_orchestrator, run_autonomous_cycle_for_brand

class TestAutonomousOrchestrator(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # ensure we use local json DB fallback or mock client
        await connect_db()
        self.db = get_db()
        # Clean test entries
        await self.db["brands"].delete_one({"brand_name": "TestAutoBrand"})
        await self.db["agentic_actions"].delete_one({"brand_name": "TestAutoBrand"})

    async def asyncTearDown(self):
        await self.db["brands"].delete_one({"brand_name": "TestAutoBrand"})
        await self.db["agentic_actions"].delete_one({"brand_name": "TestAutoBrand"})

    @patch("services.background_orchestrator.orchestrator.run")
    @patch("services.background_orchestrator.publish_to_platform")
    async def test_autonomous_cycle_execution(self, mock_publish, mock_orchestrator_run):
        # Mock orchestrator run response
        mock_orchestrator_run.return_value = {
            "executive_summary": "Test run success summary",
            "inbox": {
                "comments": [
                    {"user": "@test_user", "message": "hello", "sentiment": "positive", "smart_reply": "thanks!", "platform": "Twitter"}
                ]
            }
        }
        mock_publish.return_value = {"status": "published", "response": "Tweet posted successfully"}

        test_brand = {
            "user_id": "test_user_id",
            "brand_name": "TestAutoBrand",
            "autonomous": True,
            "autonomous_interval_hours": 1,
            "last_autonomous_run_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
        }
        
        await self.db["brands"].insert_one(test_brand)
        
        # Manually run the cycle logic
        await run_autonomous_cycle_for_brand(test_brand)
        
        # Verify orchestrator was run
        mock_orchestrator_run.assert_called_once()
        
        # Verify reply was published
        mock_publish.assert_called_once()
        
        # Check that action log was created in DB
        action_log = await self.db["agentic_actions"].find_one({"brand_name": "TestAutoBrand"})
        self.assertIsNotNone(action_log)
        self.assertEqual(action_log["status"], "success")
        
        # Check brand last run was updated
        updated_brand = await self.db["brands"].find_one({"brand_name": "TestAutoBrand"})
        self.assertIsNotNone(updated_brand.get("last_autonomous_run_at"))

if __name__ == "__main__":
    unittest.main()
