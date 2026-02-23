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
from pydantic import BaseModel
from typing import Optional

# สร้าง Schema สำหรับรับข้อมูลอัปเดต
class UserUpdateModel(BaseModel):
    username: str
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

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
    
    # 1. ถ้ามีการส่ง Email ใหม่มา ให้เตรียมอัปเดต
    if data.email:
        update_data["email"] = data.email
        
    # 2. ถ้ามีการส่ง รหัสผ่านใหม่มา ต้องเช็กรหัสผ่านเดิมก่อน
    if data.new_password:
        if not data.current_password or data.current_password != user.get("password"):
            # หมายเหตุ: หากระบบคุณมีการเข้ารหัสผ่าน (Hash) ให้ใช้ฟังก์ชันตรวจสอบ Hash ตรงนี้แทน
            raise HTTPException(status_code=400, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")
        
        # หมายเหตุ: หากระบบคุณมีการ Hash รหัสผ่าน ให้ Hash data.new_password ก่อนบันทึก
        update_data["password"] = data.new_password 
        
    if update_data:
        await db.users.update_one({"username": data.username}, {"$set": update_data})
        return {"message": "อัปเดตข้อมูลสำเร็จเรียบร้อย"}
    else:
        raise HTTPException(status_code=400, detail="ไม่มีข้อมูลให้อัปเดต")