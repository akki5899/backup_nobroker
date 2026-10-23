import os
import shutil
from uuid import uuid4
from fastapi import UploadFile, HTTPException
from typing import List
from ..core.config import settings

ALLOWED_EXTENSIONS = settings.allowed_extensions.split(",")
MAX_FILE_SIZE = settings.max_file_size

def validate_file(file: UploadFile) -> bool:
    if not file.filename:
        return False
    
    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        return False
    
    return True

def save_uploaded_file(file: UploadFile, directory: str) -> str:
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    os.makedirs(directory, exist_ok=True)
    
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{file_extension}"
    file_path = os.path.join(directory, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def delete_file(file_path: str) -> bool:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False