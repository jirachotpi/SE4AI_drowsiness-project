# --- backend/app/routers/logs.py ---
from fastapi import APIRouter
from typing import Optional
from app.database import db
from app.models.models import LogEntry
from datetime import datetime, timedelta
import calendar

router = APIRouter()

@router.post("/api/logs")
async def create_log(log: LogEntry):
    log_dict = log.dict()
    result = await db.logs.insert_one(log_dict)
    return {"message": "Log saved", "id": str(result.inserted_id)}

# --- อัปเดต GET /api/logs ให้รองรับการค้นหาด้วย username ---
@router.get("/api/logs")
async def get_logs(user_id: Optional[str] = None): # เปลี่ยน username เป็น user_id
    query = {}
    if user_id:
        query["user_id"] = user_id # กรองตาม user_id

    # ดึงประวัติมาทั้งหมดก่อน (เดี๋ยวเราไปทำ Pagination ที่ Frontend)
    logs = await db.logs.find(query).sort("timestamp", -1).to_list(None)
    
    results = []
    for log in logs:
        log["id"] = str(log["_id"]) 
        del log["_id"]              
        results.append(log)
        
    return results

@router.get("/api/logs/stats")
async def get_stats(user_id: str, period: str = "7d", m: Optional[int] = None, y: Optional[int] = None):
    # 💡 [NEW] ใช้เวลาประเทศไทย (UTC+7) เพื่อความแม่นยำในการจัดกลุ่มวัน
    now = datetime.utcnow() + timedelta(hours=7)
    stats = {}
    
    # กำหนดปีและเดือนเป้าหมาย (ถ้าไม่ได้ส่งมา ให้ใช้เดือน/ปี ปัจจุบัน)
    target_year = y if y else now.year
    target_month = m if m else now.month

    if period == "7d":
        # 🟢 โหมด 7 วันล่าสุด
        start_date = now - timedelta(days=6)
        for i in range(6, -1, -1):
            day_str = (now - timedelta(days=i)).strftime("%d/%m")
            # 💡 [NEW] เพิ่ม staring
            stats[day_str] = {"date": day_str, "drowsy": 0, "deep_sleep": 0, "staring": 0}
            
        query = {"user_id": user_id, "timestamp": {"$gte": start_date}}
        logs = await db.logs.find(query).to_list(None)
        
        for log in logs:
            key = log["timestamp"].strftime("%d/%m")
            if key in stats:
                if log["event_type"] == "drowsy": stats[key]["drowsy"] += 1
                elif log["event_type"] == "deep_sleep": stats[key]["deep_sleep"] += 1
                elif log["event_type"] == "staring": stats[key]["staring"] += 1 # นับตาค้าง

    elif period == "month":
        # 🟡 โหมดเลือกเดือน (เดือน 1 ถึง 12) โชว์วันที่ 1-31
        num_days = calendar.monthrange(target_year, target_month)[1]
        start_date = datetime(target_year, target_month, 1)
        
        # จัดการวันสิ้นเดือนเพื่อใช้ค้นหาใน Database
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1)
        else:
            end_date = datetime(target_year, target_month + 1, 1)

        for d in range(1, num_days + 1):
            day_str = f"{d:02d}/{target_month:02d}"
            # 💡 [NEW] เพิ่ม staring
            stats[day_str] = {"date": day_str, "drowsy": 0, "deep_sleep": 0, "staring": 0}
            
        query = {"user_id": user_id, "timestamp": {"$gte": start_date, "$lt": end_date}}
        logs = await db.logs.find(query).to_list(None)
        
        for log in logs:
            key = log["timestamp"].strftime("%d/%m")
            if key in stats:
                if log["event_type"] == "drowsy": stats[key]["drowsy"] += 1
                elif log["event_type"] == "deep_sleep": stats[key]["deep_sleep"] += 1
                elif log["event_type"] == "staring": stats[key]["staring"] += 1 # นับตาค้าง

    elif period == "year":
        # 🔴 โหมด 1 ปี (โชว์ภาพรวม 12 เดือน)
        start_date = datetime(target_year, 1, 1)
        end_date = datetime(target_year + 1, 1, 1)
        
        month_names = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
        for i in range(1, 13):
            # 💡 [NEW] เพิ่ม staring
            stats[i] = {"date": month_names[i-1], "drowsy": 0, "deep_sleep": 0, "staring": 0}
            
        query = {"user_id": user_id, "timestamp": {"$gte": start_date, "$lt": end_date}}
        logs = await db.logs.find(query).to_list(None)
        
        for log in logs:
            m_idx = log["timestamp"].month
            if m_idx in stats:
                if log["event_type"] == "drowsy": stats[m_idx]["drowsy"] += 1
                elif log["event_type"] == "deep_sleep": stats[m_idx]["deep_sleep"] += 1
                elif log["event_type"] == "staring": stats[m_idx]["staring"] += 1 # นับตาค้าง
                
    return list(stats.values())