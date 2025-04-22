from app.services.vector_store import embedder
from app.services.vector_store import VECTOR_COLLECTION_NAME
from app.services.vector_store import QDRANT_URL
from langchain_qdrant import QdrantVectorStore
from qdrant_client import models


retriever = QdrantVectorStore.from_existing_collection(
    collection_name=VECTOR_COLLECTION_NAME,
    embedding=embedder,
    url=QDRANT_URL,
)


def relevent_chunks(query: str,pdf_id:str):
    results = retriever.similarity_search(
        query=query,
        filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="metadata.pdf_id",
                    match=models.MatchValue(value=pdf_id),
                ),
            ]
        ),
    )

    docs = [{"text":doc.page_content,"metadata":doc.metadata} for doc in results]
    return docs
