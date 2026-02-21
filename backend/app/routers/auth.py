# --- backend/app/routers/auth.py ---
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from app.database import db
from app.models.models import UserRegister, UserLogin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/api/register")
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้นี้มีคนใช้แล้ว")

    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": "user"
    }
    await db.users.insert_one(new_user)
    return {"status": "success", "message": "สมัครสมาชิกสำเร็จ!"}

@router.post("/api/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=400, detail="ไม่พบชื่อผู้ใช้นี้")

    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่ถูกต้อง")

    return {
        "status": "success",
        "message": "เข้าสู่ระบบสำเร็จ",
        "username": db_user["username"],
        "role": db_user["role"]
    }