import re
import html
from typing import Optional

def sanitize_string(value: Optional[str], max_length: int = 500) -> Optional[str]:
    """Sanitize string input to prevent XSS and injection attacks"""
    if not value:
        return value
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Limit length
    value = value[:max_length]
    
    # Escape HTML
    value = html.escape(value)
    
    # Remove potentially dangerous patterns
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe',
        r'<object',
        r'<embed'
    ]
    
    for pattern in dangerous_patterns:
        value = re.sub(pattern, '', value, flags=re.IGNORECASE)
    
    return value.strip()

def sanitize_number(value: any, min_val: float = None, max_val: float = None) -> Optional[float]:
    """Sanitize numeric input"""
    try:
        num = float(value)
        if min_val is not None and num < min_val:
            return min_val
        if max_val is not None and num > max_val:
            return max_val
        return num
    except (ValueError, TypeError):
        return None

def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate geographic coordinates"""
    return -90 <= lat <= 90 and -180 <= lng <= 180

def sanitize_phone(phone: str) -> Optional[str]:
    """Sanitize phone number"""
    if not phone:
        return None
    
    # Remove all non-digit characters
    phone = re.sub(r'\D', '', phone)
    
    # Validate length (Indian phone numbers)
    if len(phone) == 10 or len(phone) == 12:
        return phone
    
    return None

def sanitize_email(email: str) -> Optional[str]:
    """Sanitize email address"""
    if not email:
        return None
    
    email = email.lower().strip()
    
    # Basic email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(pattern, email):
        return email
    
    return None
