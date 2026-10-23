from pydantic import BaseModel, validator
from typing import Optional
import re
from email_validator import validate_email, EmailNotValidError

class ValidationError(Exception):
    pass

def validate_email_format(email: str) -> str:
    try:
        valid = validate_email(email)
        return valid.email
    except EmailNotValidError:
        raise ValidationError("Invalid email format")

def validate_phone_format(phone: str) -> str:
    # Remove all non-digit characters
    phone_digits = re.sub(r'\D', '', phone)
    
    # Check if it's a valid Indian phone number (10 digits)
    if len(phone_digits) == 10 and phone_digits[0] in '6789':
        return phone_digits
    # Check if it's with country code (+91)
    elif len(phone_digits) == 12 and phone_digits.startswith('91'):
        return phone_digits[2:]
    else:
        raise ValidationError("Invalid phone number format")

def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one digit")
    
    return password

def sanitize_string(text: str, max_length: int = 255) -> str:
    if not text:
        return ""
    
    # Remove HTML tags and dangerous characters
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[<>"\'\\]', '', text)
    
    # Limit length
    return text[:max_length].strip()