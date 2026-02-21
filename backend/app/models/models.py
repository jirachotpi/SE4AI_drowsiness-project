# --- backend/app/models/models.py ---
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# 1. แบบแปลนสำหรับ "สมัครสมาชิก" (จาก models.py เดิม)
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)

# 2. แบบแปลนสำหรับ "เข้าสู่ระบบ" (จาก models.py เดิม)
class UserLogin(BaseModel):
    username: str
    password: str

# 3. แบบแปลนสำหรับ LOGGING (ย้ายมาจาก main.py)
class LogEntry(BaseModel):
    user_id: str
    event_type: str       # เช่น "drowsy", "deep_sleep"
    ear_value: float      # ค่า EAR ณ เวลาที่เกิดเหตุ
    duration_ms: int = 0  # ระยะเวลาที่หลับ (ms)
    timestamp: datetime = Field(default_factory=datetime.utcnow)