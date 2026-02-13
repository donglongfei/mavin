from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mavin-backend"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # TODO: Add checks for Qdrant and Agent Service connectivity
    return {
        "status": "ready",
        "services": {
            "qdrant": "connected",
            "agent_service": "connected"
        }
    }
