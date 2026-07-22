import unittest
from unittest.mock import patch

from core.config import connect_db, get_db


class DatabaseFallbackTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from core.config import db_instance
        db_instance.client = None
        db_instance.mongo_failed = False
        db_instance.local_db = None

    async def asyncTearDown(self):
        from core.config import db_instance
        db_instance.client = None
        db_instance.mongo_failed = False
        db_instance.local_db = None

    async def test_connect_db_falls_back_when_mongo_unavailable(self):
        with patch("core.config.AsyncIOMotorClient", side_effect=Exception("boom")):
            await connect_db()
            db = get_db()
            await db["users"].insert_one({"email": "test@example.com"})
            user = await db["users"].find_one({"email": "test@example.com"})
            self.assertEqual(user["email"], "test@example.com")


if __name__ == "__main__":
    unittest.main()
