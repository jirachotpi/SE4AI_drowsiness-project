from pydantic import BaseModel, EmailStr, Field

# แบบแปลนสำหรับ "สมัครสมาชิก"
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)

# แบบแปลนสำหรับ "เข้าสู่ระบบ"
class UserLogin(BaseModel):
    username: str
    password: str