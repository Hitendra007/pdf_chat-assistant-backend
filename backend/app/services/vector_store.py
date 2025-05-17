from langchain_qdrant import QdrantVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.settings import settings
import os
from qdrant_client import QdrantClient

embedder = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=settings.GEMINI_API_KEY
)

VECTOR_COLLECTION_NAME = "chat_pdf"
QDRANT_URL = settings.QDRANT_URL
QDRANT_API_KEY = settings.QDRANT_API_KEY
client = QdrantClient(url=QDRANT_URL,api_key=QDRANT_API_KEY)

if VECTOR_COLLECTION_NAME not in [c.name for c in client.get_collections().collections]:
    client.recreate_collection(
        collection_name=VECTOR_COLLECTION_NAME,
        vectors_config={
            "size": 768, 
            "distance": "Cosine"  
        },
    )

def upsert_pdf_embeddings(chunks=[], pdf_hash: str=""):
    for i, chunk in enumerate(chunks):
        chunk.metadata["pdf_id"] = pdf_hash
    print(pdf_hash,"-------------------------------------------")
    vector_store = QdrantVectorStore.from_documents(
        documents=chunks,
        collection_name=VECTOR_COLLECTION_NAME,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        embedding=embedder
    )

    print(f"Embeddings saved to Qdrant. for pdf_id:{pdf_hash}")
