import os
import shutil
import uuid
from abc import ABC, abstractmethod
from fastapi import UploadFile
from .config import UPLOAD_DIR, STORAGE_PROVIDER

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file: UploadFile, subfolder: str = "") -> str:
        """Saves a file and returns its URL/reference string"""
        pass

    @abstractmethod
    def delete_file(self, file_url: str) -> bool:
        """Deletes a file by its URL/reference string"""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str):
        self.base_dir = base_dir

    def save_file(self, file: UploadFile, subfolder: str = "") -> str:
        target_dir = os.path.join(self.base_dir, subfolder) if subfolder else self.base_dir
        os.makedirs(target_dir, exist_ok=True)
        
        # Generate unique filename to avoid collision
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(target_dir, unique_name)
        
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return path relative to the server root for access via static mount
        return f"/uploads/{subfolder}/{unique_name}" if subfolder else f"/uploads/{unique_name}"

    def delete_file(self, file_url: str) -> bool:
        if not file_url:
            return False
        
        # Parse relative URL back to local path
        relative_path = file_url.lstrip("/")
        if relative_path.startswith("uploads/"):
            relative_path = relative_path.replace("uploads/", "", 1)
            
        file_path = os.path.join(self.base_dir, relative_path)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except Exception:
                return False
        return False


# Pluggable templates for cloud providers (can be wired in via environment variables)
class S3StorageProvider(StorageProvider):
    def save_file(self, file: UploadFile, subfolder: str = "") -> str:
        # Placeholder for AWS S3 upload logic
        # return f"https://your-bucket.s3.amazonaws.com/{subfolder}/{uuid.uuid4().hex}"
        raise NotImplementedError("S3 storage provider is configured but not implemented yet.")

    def delete_file(self, file_url: str) -> bool:
        raise NotImplementedError("S3 storage provider is configured but not implemented yet.")


# Initialize active provider based on environment setting
if STORAGE_PROVIDER == "s3":
    storage_client = S3StorageProvider()
else:
    storage_client = LocalStorageProvider(UPLOAD_DIR)
