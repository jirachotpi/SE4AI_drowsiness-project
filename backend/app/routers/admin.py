# --- backend/app/routers/admin.py ---
from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime, time
from bson import ObjectId # ใช้สำหรับแปลง ID ของ MongoDB

router = APIRouter()

# 1. API ดึงสถิติภาพรวม (จาก PB-17)
@router.get("/api/admin/stats")
async def get_admin_stats():
    total_users = await db.users.count_documents({"role": "user"})
    total_logs = await db.logs.count_documents({})
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

# 2. [NEW] API ดึงรายชื่อผู้ใช้ทั้งหมด
@router.get("/api/admin/users")
async def get_all_users():
    users = await db.users.find({"role": "user"}).to_list(1000)
    result = []
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
        del u["password"] # ซ่อนรหัสผ่านเพื่อความปลอดภัย
        result.append(u)
    return result

# 3. [NEW] API ระงับบัญชีผู้ใช้ (Suspend)
@router.put("/api/admin/users/{user_id}/suspend")
async def toggle_suspend_user(user_id: str, status: dict):
    is_suspended = status.get("is_suspended", True)
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_suspended": is_suspended}}
    )
    if result.modified_count == 1:
        return {"message": "อัปเดตสถานะสำเร็จ"}
    raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")

# 4. [NEW] API ลบผู้ใช้ (Delete)
@router.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        # ลบประวัติ log ของผู้ใช้นี้ทิ้งไปด้วย
        await db.logs.delete_many({"user_id": user_id})
        return {"message": "ลบผู้ใช้สำเร็จ"}
    raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")