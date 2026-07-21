import time
from memory.db import get_collection

def save_run(brand: dict, result: dict):
    get_collection("runs").insert_one({
        "brand_name": brand.get("brand_name", "Unknown"),
        "timestamp":  time.strftime("%Y-%m-%dT%H:%M:%S"),
        "brand":      brand,
        "summary":    result.get("executive_summary", ""),
    })

def get_history() -> list:
    return list(get_collection("runs").find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
