from fastapi import APIRouter, File, UploadFile, Form, HTTPException,Depends,Request
from app.services.pdf_processor import process_pdf
from app.services.vector_store import upsert_pdf_embeddings
from app.db.models import PDFMeta
from app.db.session import SessionLocal
from app.utils.hashing import sha256_hash
from uuid import uuid4
from sqlalchemy.future import select
from app.utils.apiResponse import ApiResponse
from app.middleware.AuthMiddleware import auth_middleware

router = APIRouter()




@router.post("/upload", dependencies=[Depends(auth_middleware)])
async def upload_pdf(file: UploadFile = File(...), request: Request = None):
    user_id = request.state.user_id  # populated by your AuthMiddleware

    content = await file.read()
    try:
        decoded = content.decode("latin1")
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to decode PDF file")

    hash_ = sha256_hash(decoded)

    async with SessionLocal() as db:
        existing = await db.execute(
            select(PDFMeta).where(PDFMeta.hash == hash_, PDFMeta.user_id == user_id)
        )
        existing_pdf = existing.scalar_one_or_none()
        if existing_pdf:
            return ApiResponse(200, "PDF already exists", {"pdf":existing_pdf}).to_dict()

        chunks = process_pdf(content)
        upsert_pdf_embeddings(chunks, hash_)

        pdf = PDFMeta(id=uuid4(), user_id=user_id, name=file.filename, hash=hash_)
        db.add(pdf)
        await db.commit()
        

        return ApiResponse(200, "PDF uploaded and embedded", {"pdf":pdf}).to_dict()
