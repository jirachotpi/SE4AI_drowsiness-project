from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# อนุญาตให้ React (หน้าบ้าน) เข้ามาคุยกับ Backend ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ยอมรับทุกเว็บ (สำหรับช่วงทดสอบ)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. หน้าแรก (Home) เอาไว้เช็คว่า Server ทำงานไหม
@app.get("/")
async def root():
    return {"message": "สวัสดี! Backend ของฉันทำงานแล้วนะ (FastAPI Running)"}

# 2. จำลอง API ตรวจจับความง่วง (Mock Up)
# เดี๋ยวพอทำ AI เสร็จ เราจะแก้ตรงนี้ให้ส่งค่าจริง
@app.get("/api/detect-mock")
async def detect_mock():
    # สมมติว่าตอนนี้ค่า EAR ต่ำมาก (ง่วง)
    return {
        "status": "success",
        "ear_value": 0.18,
        "is_drowsy": True,
        "alert_message": "ตื่นเดี๋ยวนี้! คุณกำลังหลับตา!"
    }