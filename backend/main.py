from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import cv2
import mediapipe as mp
import numpy as np
import uvicorn

# นำเข้าแบบแปลนจาก models.py (ต้องมีไฟล์ models.py อยู่ที่เดิมนะครับ)
from models import UserRegister, UserLogin

app = FastAPI()

# ==========================================
# 1. SETUP: ระบบความปลอดภัย & ฐานข้อมูล
# ==========================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MONGO_URL = "mongodb://127.0.0.1:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.drowsiness_db

# ตั้งค่า CORS (เพื่อให้ Frontend React เรียกใช้ได้)
origins = [
    "http://localhost:5173",    # React Localhost
    "http://127.0.0.1:5173",    # React IP
    "*"                         # อนุญาตทั้งหมด (เผื่อเปลี่ยน Port)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. SETUP: ระบบ AI (MediaPipe & EAR)
# ==========================================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# จุดพิกัดตา (Landmark Indices)
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

# ค่า Threshold พื้นฐาน (Sensor Level)
# หมายเหตุ: Frontend จะเป็นตัวตัดสินใจเรื่องเวลา (Time), อันนี้แค่บอกว่า "ปิดหรือไม่"
EYE_AR_THRESH = 0.21 

def calculate_ear(landmarks, indices, img_w, img_h):
    """ฟังก์ชันคำนวณค่า EAR (Eye Aspect Ratio)"""
    try:
        coords = np.array([[landmarks[idx].x * img_w, landmarks[idx].y * img_h] for idx in indices])
        # ระยะแนวตั้ง
        v1 = np.linalg.norm(coords[1] - coords[5])
        v2 = np.linalg.norm(coords[2] - coords[4])
        # ระยะแนวนอน
        h = np.linalg.norm(coords[0] - coords[3])
        # สูตร EAR
        return (v1 + v2) / (2.0 * h)
    except Exception:
        return 0.0

# ==========================================
# 3. API ROUTES (Endpoints)
# ==========================================

@app.get("/")
async def root():
    return {"message": "Drowsiness Detection API is Running!"}

# --- [Auth] ระบบสมัครสมาชิก ---
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

# --- [Auth] ระบบเข้าสู่ระบบ ---
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

# --- [AI] ระบบตรวจจับความง่วง (Sensor Logic) ---
@app.post("/api/detect")
async def detect_drowsiness(file: UploadFile = File(...)):
    try:
        # 1. อ่านและแปลงไฟล์ภาพ
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"status": "error", "message": "Cannot decode image"}

        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 2. ให้ AI ประมวลผลหาหน้า
        results = face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return {
                "status": "no_face", 
                "ear": 0.0, 
                "is_eye_closed": False, 
                "face_box": None
            }

        # 3. คำนวณค่าต่างๆ
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark
            
            # คำนวณ EAR
            left_ear = calculate_ear(landmarks, LEFT_EYE, w, h)
            right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear = (left_ear + right_ear) / 2.0

            # สร้างกรอบหน้า (Face Box)
            x_coords = [lm.x for lm in landmarks]
            y_coords = [lm.y for lm in landmarks]
            face_box = [
                int(min(x_coords) * w), 
                int(min(y_coords) * h), 
                int((max(x_coords) - min(x_coords)) * w), 
                int((max(y_coords) - min(y_coords)) * h)
            ]

            # 4. ส่งค่ากลับไปให้ Frontend (React) คำนวณเวลาต่อ
            return {
                "status": "success",
                "ear": float(round(avg_ear, 3)),
                "is_eye_closed": bool(avg_ear < EYE_AR_THRESH),
                "face_box": face_box
            }
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

    return {"status": "error"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)