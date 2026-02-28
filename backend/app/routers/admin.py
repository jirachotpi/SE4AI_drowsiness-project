# --- backend/app/routers/admin.py ---
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import db
from datetime import datetime, time
from bson import ObjectId

router = APIRouter()

# ==========================================
# 1. API ดึงสถิติภาพรวม (Dashboard Stats)
# ==========================================
@router.get("/api/admin/stats")
async def get_admin_stats():
    total_users = await db.users.count_documents({"role": "user"})
    total_logs = await db.logs.count_documents({})
    
    # นับจำนวนแจ้งเตือนเฉพาะวันนี้
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_alerts = await db.logs.count_documents({"timestamp": {"$gte": today_start}})
    deep_sleep_today = await db.logs.count_documents({
        "timestamp": {"$gte": today_start},
        "event_type": "deep_sleep"
    })
    
    return {
        "total_users": total_users,
        "total_logs": total_logs,
        "today_alerts": today_alerts,
        "deep_sleep_today": deep_sleep_today
    }

# ==========================================
# 2. API ดึงรายชื่อผู้ใช้ทั้งหมด (User Management)
# ==========================================
@router.get("/api/admin/users")
async def get_all_users():
    # ดึงผู้ใช้ทั้งหมดมาแสดง
    users = await db.users.find({}).to_list(1000)
    result = []
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
        
        # ลบรหัสผ่านทิ้งเพื่อความปลอดภัยก่อนส่งไปหน้าเว็บ
        if "password" in u:
            del u["password"]
            
        # เติมสถานะ default ถ้ายังไม่มี
        if "is_suspended" not in u:
            u["is_suspended"] = False
            
        result.append(u)
    return result

# ==========================================
# 3. API ระงับ/ปลดแบน บัญชีผู้ใช้ (Suspend/Unsuspend)
# ==========================================
class SuspendPayload(BaseModel):
    is_suspended: bool

@router.put("/api/admin/users/{user_id}/suspend")
async def toggle_suspend_user(user_id: str, payload: SuspendPayload):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_suspended": payload.is_suspended}}
        )
        if result.matched_count == 1:
            return {"message": "อัปเดตสถานะผู้ใช้งานสำเร็จ"}
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ ID ผู้ใช้ไม่ถูกต้อง")

# ==========================================
# 4. API ลบผู้ใช้และประวัติการขับขี่ถาวร (Delete User)
# ==========================================
@router.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str):
    try:
        # 1. ค้นหาผู้ใช้ก่อนเพื่อเอา username
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")
        
        username = user.get("username")
        
        # 2. ลบบัญชีผู้ใช้
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 1:
            # 3. ลบประวัติ log ของผู้ใช้นี้ทิ้งไปด้วย (ใช้ username ในการค้นหา log)
            await db.logs.delete_many({"user_id": username})
            return {"message": "ลบผู้ใช้และประวัติสำเร็จ"}
            
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ ID ผู้ใช้ไม่ถูกต้อง")

# ==========================================
# 5. API ดึงค่าการตั้งค่าระบบ (GET AI Config)
# ==========================================
@router.get("/api/admin/config")
async def get_system_config():
    # ค้นหา config แบบตั้งค่า AI
    config = await db.config.find_one({"type": "ai_threshold"})
    
    if not config:
        # ถ้ายังไม่มีในระบบ ให้สร้างค่าเริ่มต้น (Default)
        default_config = {
            "type": "ai_threshold",
            "ear_threshold": 0.2,
            "drowsy_time": 2.0,
            "sleep_time": 3.0,
            "staring_time": 8.0  # เพิ่มค่าเริ่มต้นของตาค้าง
        }
        await db.config.insert_one(default_config)
        del default_config["_id"]
        return default_config
        
    config["id"] = str(config["_id"])
    del config["_id"]
    
    # ดักจับกรณีที่มีข้อมูลเก่าใน Database แต่ไม่มีฟิลด์ "ตาค้าง"
    if "staring_time" not in config:
        config["staring_time"] = 8.0 
        
    return config

# ==========================================
# 6. API บันทึกการตั้งค่าระบบ (PUT AI Config)
# ==========================================
@router.put("/api/admin/config")
async def update_system_config(new_config: dict):
    # ป้องกัน Error กรณีหน้าเว็บส่ง id หรือ _id ติดมาด้วย
    if "id" in new_config:
        del new_config["id"]
    if "_id" in new_config:
        del new_config["_id"]
        
    # บังคับประเภทเป็น ai_threshold เสมอ
    new_config["type"] = "ai_threshold"
    
    # อัปเดตข้อมูลทั้งหมดลง Database (Upsert: ถ้าไม่มีให้สร้างใหม่)
    await db.config.update_one(
        {"type": "ai_threshold"},
        {"$set": new_config},
        upsert=True
    )
    
    return {"message": "บันทึกการตั้งค่าระบบสำเร็จ", "config": new_config}