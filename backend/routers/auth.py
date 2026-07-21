from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId
from core.config import get_db
from core.auth import hash_password, verify_password, create_token
from models.schemas import UserRegister, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(body: UserRegister):
    db = get_db()
    if await db["users"].find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    user = {"name": body.name, "email": body.email, "password": hash_password(body.password), "created_at": datetime.utcnow()}
    result = await db["users"].insert_one(user)
    token  = create_token({"sub": str(result.inserted_id), "email": body.email})
    return {"token": token, "user": {"id": str(result.inserted_id), "name": body.name, "email": body.email}}

@router.post("/login")
async def login(body: UserLogin):
    db   = get_db()
    user = await db["users"].find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token({"sub": str(user["_id"]), "email": user["email"]})
    return {"token": token, "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}}

@router.get("/me")
async def me(user=__import__('fastapi').Depends(__import__('core.auth', fromlist=['get_current_user']).get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}
