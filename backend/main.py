from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# นำเข้าแบบแปลนจาก models.py
from models import UserRegister, UserLogin

app = FastAPI()

# 1. ตั้งค่าความปลอดภัย (Hashing Password)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. เชื่อมต่อ MongoDB
MONGO_URL = "mongodb://127.0.0.1:27017" 
client = AsyncIOMotorClient(MONGO_URL)
db = client.drowsiness_db

# --- ปรับ CORS ให้ระบุชัดเจน (แก้ปัญหา Browser บล็อก) ---
origins = [
    "http://localhost:5173",    # React
    "http://127.0.0.1:5173",    # React IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # เปลี่ยนจาก ["*"] เป็นระบุชัดเจน เพื่อความชัวร์
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 👇 [ส่วนที่เพิ่มใหม่] จุดเช็คชื่อหน้าบ้าน ---
@app.get("/")
async def root():
    return {"message": "Drowsiness Detection API is Running!"}

# --- [Backlog-03] ระบบสมัครสมาชิก (Register) ---
@app.post("/api/register")
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

# --- [Backlog-03] ระบบเข้าสู่ระบบ (Login) ---
@app.post("/api/login")
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