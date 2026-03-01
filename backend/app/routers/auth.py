# --- backend/app/routers/auth.py ---
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from app.database import db
from app.models.models import UserRegister, UserLogin
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# 💡 [NEW PB-33] ตั้งค่าสำหรับการทำ JWT
# ==========================================
SECRET_KEY = "your-super-secret-pb33-key" # ในอนาคตควรย้ายไปไว้ในไฟล์ .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # Token มีอายุ 1 วัน (24 ชั่วโมง)

# ตัวช่วยดึง Token จาก Header (Authorization: Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# ฟังก์ชันสำหรับ "สร้าง" Token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ฟังก์ชันสำหรับ "ตรวจสอบ" Token (Middleware)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # พยายามแกะรหัส Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token ไม่ถูกต้อง")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token หมดอายุแล้ว กรุณา Login ใหม่")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="ยืนยันตัวตนไม่สำเร็จ")
    
    # เช็คว่ามี User นี้ในฐานข้อมูลจริงๆ
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="ไม่พบผู้ใช้งานนี้ในระบบ")
    return user


# ==========================================
# Schema สำหรับรับข้อมูล
# ==========================================
class UserUpdateModel(BaseModel):
    username: str
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None

# ==========================================
# API Routes
# ==========================================
@router.post("/api/register")
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้นี้มีคนใช้แล้ว")

    if user.email:
        existing_email = await db.users.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="อีเมลนี้มีคนใช้แล้ว")

    hashed_password = pwd_context.hash(user.password)
    
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": "user",
        "is_suspended": False, 
        "age": user.age,
        "gender": user.gender,
        "phone": user.phone,
        "department": user.department
    }
    await db.users.insert_one(new_user)
    return {"status": "success", "message": "สมัครสมาชิกสำเร็จ!"}

@router.post("/api/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=400, detail="ไม่พบชื่อผู้ใช้นี้")

    if db_user.get("is_suspended") is True:
        raise HTTPException(status_code=403, detail="บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ")

    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่ถูกต้อง")

    # 💡 [NEW PB-33] สร้าง JWT Token เมื่อ Login สำเร็จ
    access_token = create_access_token(
        data={"sub": db_user["username"], "role": db_user["role"]}
    )

    return {
        "status": "success",
        "message": "เข้าสู่ระบบสำเร็จ",
        "username": db_user["username"],
        "role": db_user["role"],
        "access_token": access_token, # ส่ง Token กลับไปให้ Frontend
        "token_type": "bearer"
    }

# 💡 [NEW PB-33] บังคับให้ต้องมี Token ถึงจะดึง Profile ได้
@router.get("/api/users/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    # ไม่ต้องรับ username จาก params แล้ว ดึงจากคนที่ Login (Token) ได้เลยเพื่อความปลอดภัย
    user = await db.users.find_one({"username": current_user["username"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ใช้งาน")
    return user

# 💡 [NEW PB-33] บังคับให้ต้องมี Token ถึงจะอัปเดต Profile ได้
@router.put("/api/users/me")
async def update_my_profile(data: UserUpdateModel, current_user: dict = Depends(get_current_user)):
    # เช็คความปลอดภัย: คนที่ขอแก้ข้อมูล ต้องเป็นเจ้าของบัญชีเท่านั้น (ป้องกันการแฮ็กแก้ของคนอื่น)
    if data.username != current_user["username"]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์แก้ไขข้อมูลของบัญชีนี้")

    user = await db.users.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ใช้งาน")
    
    update_data = {}
    
    if data.email and data.email != user.get("email"):
        existing_email = await db.users.find_one({"email": data.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว")
        update_data["email"] = data.email
        
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="กรุณากรอกรหัสผ่านปัจจุบัน")
            
        if not pwd_context.verify(data.current_password, user.get("password")):
            raise HTTPException(status_code=400, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")
        
        update_data["password"] = pwd_context.hash(data.new_password)
        
    if data.age is not None: update_data["age"] = data.age
    if data.gender is not None: update_data["gender"] = data.gender
    if data.phone is not None: update_data["phone"] = data.phone
    if data.department is not None: update_data["department"] = data.department

    if update_data:
        await db.users.update_one({"username": data.username}, {"$set": update_data})
        return {"message": "อัปเดตข้อมูลสำเร็จเรียบร้อย"}
    else:
        raise HTTPException(status_code=400, detail="ไม่มีข้อมูลให้อัปเดต")