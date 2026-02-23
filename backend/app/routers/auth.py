# --- backend/app/routers/auth.py ---
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from app.database import db
from app.models.models import UserRegister, UserLogin
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# สร้าง Schema สำหรับรับข้อมูลอัปเดต
class UserUpdateModel(BaseModel):
    username: str
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@router.post("/api/register")
async def register(user: UserRegister):
    # 1. เช็ก Username ซ้ำ
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้นี้มีคนใช้แล้ว")

    # 2. เช็ก Email ซ้ำ (เพิ่มใหม่ ป้องกันสมัครอีเมลซ้ำ)
    if user.email:
        existing_email = await db.users.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="อีเมลนี้มีคนใช้แล้ว")

    # เข้ารหัสผ่านก่อนบันทึก
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

    # ตรวจสอบรหัสผ่านที่ถูกเข้ารหัส
    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่ถูกต้อง")

    return {
        "status": "success",
        "message": "เข้าสู่ระบบสำเร็จ",
        "username": db_user["username"],
        "role": db_user["role"]
    }

@router.get("/api/users/me")
async def get_my_profile(username: str):
    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล (ไม่ดึงรหัสผ่านและ _id กลับไปเพื่อความปลอดภัย)
    user = await db.users.find_one({"username": username}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ใช้งาน")
    return user

@router.put("/api/users/me")
async def update_my_profile(data: UserUpdateModel):
    user = await db.users.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ใช้งาน")
    
    update_data = {}
    
    # 1. จัดการอัปเดต Email และเช็ก Email ซ้ำ
    if data.email and data.email != user.get("email"):
        existing_email = await db.users.find_one({"email": data.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว")
        update_data["email"] = data.email
        
    # 2. จัดการอัปเดตรหัสผ่าน (เช็ก Hash และเข้ารหัสใหม่)
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="กรุณากรอกรหัสผ่านปัจจุบัน")
            
        # เช็กรหัสผ่านปัจจุบันด้วย pwd_context.verify (แก้ไขให้เช็กถูกต้อง)
        if not pwd_context.verify(data.current_password, user.get("password")):
            raise HTTPException(status_code=400, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")
        
        # เข้ารหัสผ่านใหม่ก่อนบันทึกลง Database (แก้ไขให้เข้ารหัสก่อนบันทึก)
        update_data["password"] = pwd_context.hash(data.new_password)
        
    if update_data:
        await db.users.update_one({"username": data.username}, {"$set": update_data})
        return {"message": "อัปเดตข้อมูลสำเร็จเรียบร้อย"}
    else:
        raise HTTPException(status_code=400, detail="ไม่มีข้อมูลให้อัปเดต")