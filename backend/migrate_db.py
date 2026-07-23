import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME") or "agentic_social_ai"

print(f"Connecting to MongoDB: {DB_NAME}...")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

broken_url = "https://assets.mixkit.co/videos/preview/mixkit-star-ry-night-sky-over-a-forest-44390-large.mp4"
replacement_url = "/static/templates/fallback.mp4"

collections = db.list_collection_names()
print(f"Collections found: {collections}")

for coll_name in collections:
    coll = db[coll_name]
    # Update documents containing the broken video_url
    res = coll.update_many(
        {"video_url": broken_url},
        {"$set": {"video_url": replacement_url}}
    )
    if res.modified_count > 0:
        print(f"Updated {res.modified_count} docs in '{coll_name}' with key 'video_url'")

    # Update scheduled posts that failed because of the video URL, reset them to "scheduled" so they retry publishing
    res2 = coll.update_many(
        {"status": "failed", "api_response": {"$regex": "Video file not found"}},
        {"$set": {"status": "scheduled", "api_response": ""}}
    )
    if res2.modified_count > 0:
        print(f"Reset {res2.modified_count} failed docs in '{coll_name}' to scheduled")

print("Migration completed.")
client.close()
