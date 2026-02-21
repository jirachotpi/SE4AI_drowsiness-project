# --- backend/app/routers/logs.py ---
from fastapi import APIRouter
from app.database import db
from app.models.models import LogEntry

router = APIRouter()

@router.post("/api/logs")
async def create_log(log: LogEntry):
    log_dict = log.dict()
    result = await db.logs.insert_one(log_dict)
    return {"message": "Log saved", "id": str(result.inserted_id)}

@router.get("/api/logs")
async def get_logs():
    logs = await db.logs.find().sort("timestamp", -1).limit(20).to_list(20)
    results = []
    for log in logs:
        log["id"] = str(log["_id"]) 
        del log["_id"]              
        results.append(log)
    return results