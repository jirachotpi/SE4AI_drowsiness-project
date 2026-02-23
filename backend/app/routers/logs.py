# --- backend/app/routers/logs.py ---
from fastapi import APIRouter
from typing import Optional
from app.database import db
from app.models.models import LogEntry

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

    logs = await db.logs.find(query).sort("timestamp", -1).limit(100).to_list(100)
    
    results = []
    for log in logs:
        log["id"] = str(log["_id"]) 
        del log["_id"]              
        results.append(log)
        
    return results