from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.memory_service import MemoryService

router = APIRouter()
memory_service = MemoryService()


class MemoryItem(BaseModel):
    """Memory item model"""
    content: str
    metadata: dict = {}


class MemorySearchRequest(BaseModel):
    """Memory search request"""
    query: str
    limit: int = 5


class MemorySearchResult(BaseModel):
    """Memory search result"""
    content: str
    score: float
    metadata: dict


@router.post("/store")
async def store_memory(item: MemoryItem):
    """Store a memory item in Qdrant"""
    try:
        result = await memory_service.store(item.content, item.metadata)
        return {"status": "stored", "id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=List[MemorySearchResult])
async def search_memory(request: MemorySearchRequest):
    """Search memory using semantic similarity"""
    try:
        results = await memory_service.search(request.query, request.limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def memory_stats():
    """Get memory statistics"""
    try:
        stats = await memory_service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
