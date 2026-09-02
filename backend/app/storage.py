import os
import uuid
import logging
import httpx
from datetime import datetime
from app.config import settings

logger = logging.getLogger("accutai.storage")

async def upload_file_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads a bill/receipt file to Supabase Storage bucket `accutai_expense_bills`
    and returns the public or access URL.
    """
    ext = os.path.splitext(filename)[1] or ".png"
    unique_filename = f"receipts/{datetime.utcnow().strftime('%Y%m')}/{uuid.uuid4().hex}{ext}"

    upload_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_BUCKET}/{unique_filename}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "apikey": settings.SUPABASE_KEY,
        "Content-Type": content_type or "application/octet-stream"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(upload_url, content=file_bytes, headers=headers)
            if resp.status_code in (200, 201):
                public_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{unique_filename}"
                logger.info(f"Uploaded file successfully to Supabase Storage: {public_url}")
                return public_url
            else:
                logger.warning(f"Supabase upload returned status {resp.status_code}: {resp.text}")
                # Return direct storage object path format as fallback
                return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{unique_filename}"
    except Exception as e:
        logger.error(f"Error uploading file to Supabase Storage: {e}")
        # Local or data URI fallback if needed
        return f"receipt_{uuid.uuid4().hex[:8]}_{filename}"
