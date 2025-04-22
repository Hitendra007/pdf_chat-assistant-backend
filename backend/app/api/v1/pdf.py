from fastapi import APIRouter, File, UploadFile, Form, HTTPException,Depends
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

@router.post("/upload",dependencies=[Depends(auth_middleware)])
async def upload_pdf(file: UploadFile = File(...), user_id: str = Form(...)):
    content = await file.read()
    try:
        decoded = content.decode("latin1")  # works for most PDFs
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to decode PDF file")

    hash_ = sha256_hash(decoded)

    async with SessionLocal() as db:
        existing = await db.execute(
            select(PDFMeta).where(PDFMeta.hash == hash_, PDFMeta.user_id == user_id)
        )
        if existing.scalar_one_or_none():
            apiresponse = ApiResponse(200,'Pdf already exists',{"hash":hash_})
            return {"message": "PDF already exists for this user", "hash": hash_}

        chunks = process_pdf(content)
        upsert_pdf_embeddings(chunks, hash_)

        pdf = PDFMeta(id=uuid4(), user_id=user_id, name=file.filename, hash=hash_)
        db.add(pdf)
        await db.commit()

        return {"message": "PDF uploaded and embedded", "hash": hash_}
