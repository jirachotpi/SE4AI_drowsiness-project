# --- backend/main.py ---
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# 1. โหลด Environment Variables (จาก .env ในเครื่อง หรือจาก Settings ใน Render)
load_dotenv()

# นำเข้า API ที่เราแยกไว้ในโฟลเดอร์ routers
from app.routers import auth, logs, detection, admin

app = FastAPI()

# 2. ตั้งค่า CORS ให้ยืดหยุ่น
# ดึง FRONTEND_URL จาก env ถ้าไม่มีให้ใช้ localhost (ห้ามใส่ / ต่อท้าย URL)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    "http://localhost:5173",    
    "http://127.0.0.1:5173",    
    FRONTEND_URL, # รองรับ URL ของ Vercel ที่เราจะเอามาใส่ภายหลัง
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ประกอบร่าง API เข้ากับ FastAPI
app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(detection.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Drowsiness Detection API is Ready for Production!"}

if __name__ == "__main__":
    # 3. จุดสำคัญสำหรับการ Deploy บน Render
    # Render จะสุ่ม PORT มาให้ เราต้องดึงค่าจาก os.environ
    port = int(os.environ.get("PORT", 8000))
    
    # 4. host ต้องเป็น 0.0.0.0 และปิด reload=True เมื่อใช้ใน Production
    # แต่ถ้าคุณรันในเครื่อง (Local) ก็ยังใช้ reload ได้
    is_prod = os.getenv("RENDER", False) # Render จะมีตัวแปรชื่อ RENDER ให้อัตโนมัติ
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=not is_prod # ปิด reload อัตโนมัติถ้าอยู่บน Cloud
    )