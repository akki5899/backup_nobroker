from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import redis
from ..core.config import settings

# Redis client for rate limiting
try:
    redis_client = redis.from_url(settings.redis_url)
except:
    redis_client = None

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if redis_client is None:
            return await call_next(request)
        
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            current = redis_client.get(key)
            if current is None:
                redis_client.setex(key, 60, 1)
            else:
                current = int(current)
                if current >= settings.rate_limit_per_minute:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={"detail": "Rate limit exceeded"}
                    )
                redis_client.incr(key)
        except:
            pass  # Continue if Redis is unavailable
        
        response = await call_next(request)
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response