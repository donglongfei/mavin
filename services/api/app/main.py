from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import agent, memory, health


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
)

# CORS middleware - Allow AIBook frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # AIBook dev server
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"🚀 Starting {settings.api_title} v{settings.api_version}")
    print(f"📊 Qdrant: {settings.qdrant_host}:{settings.qdrant_port}")
    print(f"🤖 Agent Service: {settings.agent_service_url}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down Mavin API")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "status": "operational"
    }
