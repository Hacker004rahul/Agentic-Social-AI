import unittest
from unittest.mock import patch

from core.config import connect_db, get_db


class DatabaseFallbackTests(unittest.IsolatedAsyncioTestCase):
    async def test_connect_db_falls_back_when_mongo_unavailable(self):
        with patch("core.config.AsyncIOMotorClient", side_effect=Exception("boom")):
            await connect_db()
            db = get_db()
            await db["users"].insert_one({"email": "test@example.com"})
            user = await db["users"].find_one({"email": "test@example.com"})
            self.assertEqual(user["email"], "test@example.com")


if __name__ == "__main__":
    unittest.main()
