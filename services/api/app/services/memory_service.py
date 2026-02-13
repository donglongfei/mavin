from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict
import hashlib
from app.core.config import settings


class MemoryService:
    """
    Memory service using Qdrant vector database
    Handles storage and retrieval of agent memories
    """

    def __init__(self):
        self.client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port
        )
        self.collection_name = settings.qdrant_collection_name
        self._ensure_collection()

    def _ensure_collection(self):
        """Ensure the collection exists"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # Using sentence-transformers/all-MiniLM-L6-v2 dimensions
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            print(f"⚠️  Collection check failed: {e}")

    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text
        TODO: Replace with proper embedding model (sentence-transformers)
        For now, using a simple hash-based dummy embedding
        """
        # This is a placeholder - will be replaced with actual embeddings
        hash_obj = hashlib.sha384(text.encode())
        hash_bytes = hash_obj.digest()
        # Convert to 384-dimensional vector (normalized)
        embedding = [float(b) / 255.0 for b in hash_bytes]
        return embedding

    async def store(self, content: str, metadata: dict = None) -> str:
        """Store a memory item"""
        embedding = self._generate_embedding(content)
        point_id = hashlib.md5(content.encode()).hexdigest()

        point = PointStruct(
            id=point_id,
            vector=embedding,
            payload={
                "content": content,
                "metadata": metadata or {}
            }
        )

        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )

        return point_id

    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for similar memories"""
        query_embedding = self._generate_embedding(query)

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit
        )

        return [
            {
                "content": hit.payload.get("content"),
                "score": hit.score,
                "metadata": hit.payload.get("metadata", {})
            }
            for hit in results
        ]

    async def get_stats(self) -> dict:
        """Get collection statistics"""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                "collection": self.collection_name,
                "points_count": collection_info.points_count,
                "status": "operational"
            }
        except Exception as e:
            return {
                "collection": self.collection_name,
                "error": str(e),
                "status": "error"
            }
