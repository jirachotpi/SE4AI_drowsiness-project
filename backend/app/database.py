import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# โหลดตัวแปรจาก .env
load_dotenv()

# ดึงค่าจาก .env ถ้าไม่มีให้ใช้ localhost สำรองไว้
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_URI)

# ใช้ Database ชื่อเดียวกับที่ระบุใน URI (drowsiness_db)
db = client.get_database() 

print("Connected to MongoDB Atlas successfully!")