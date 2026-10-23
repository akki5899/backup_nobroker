import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

try:
    from app.main import app
    from fastapi.openapi.utils import get_openapi
    
    print("Attempting to generate OpenAPI schema...")
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    print("Successfully generated OpenAPI schema!")
except Exception as e:
    print(f"Failed to generate OpenAPI schema: {e}")
    import traceback
    traceback.print_exc()
