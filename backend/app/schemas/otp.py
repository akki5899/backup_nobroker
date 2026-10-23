from pydantic import BaseModel, EmailStr

class SendOTPRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None

class VerifyOTPRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    otp: str

class OTPResponse(BaseModel):
    message: str
    success: bool