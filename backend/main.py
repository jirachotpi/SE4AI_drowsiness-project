from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# 1. เพิ่มตัวช่วยเชื่อมต่อ MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI()

# อนุญาตให้ React (หน้าบ้าน) เข้ามาคุยกับ Backend ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ยอมรับทุกเว็บ (สำหรับช่วงทดสอบ)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. ตั้งค่าการเชื่อมต่อ Database (แบบ Local ในเครื่อง)
# ไม่ต้องใช้รหัสผ่านเพราะรันในเครื่องตัวเอง
MONGO_URL = "mongodb://127.0.0.1:27017"

try:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.drowsiness_db  # ตั้งชื่อ Database ว่า drowsiness_db
    print("MongoDB Client Created")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# 3. หน้าแรก (Home)
@app.get("/")
async def root():
    return {"message": "สวัสดี! Backend ของฉันทำงานแล้วนะ (FastAPI Running)"}

# 4. API เช็คสถานะ Database (เพิ่มใหม่)
# เอาไว้ให้ React ยิงมาเช็คว่าต่อ Database ติดไหม
@app.get("/check-db")
async def check_database():
    try:
        # ลองส่งคำสั่ง ping ไปเช็ค
        await client.admin.command('ping')
        return {"status": "Database Connected Successfully! (Local MongoDB)"}
    except Exception as e:
        return {"status": "Connection Failed", "error": str(e)}

# 5. จำลอง API ตรวจจับความง่วง (Mock Up)
@app.get("/api/detect-mock")
async def detect_mock():
    # สมมติว่าตอนนี้ค่า EAR ต่ำมาก (ง่วง)
    return {
        "status": "success",
        "ear_value": 0.18,
        "is_drowsy": True,
        "alert_message": "ตื่นเดี๋ยวนี้! คุณกำลังหลับตา!"
    }