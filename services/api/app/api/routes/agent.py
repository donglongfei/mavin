from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.agent_service import AgentService

router = APIRouter()
agent_service = AgentService()


class AgentRequest(BaseModel):
    """Agent request model"""
    prompt: str
    context: dict = {}


class AgentResponse(BaseModel):
    """Agent response model"""
    response: str
    metadata: dict = {}


@router.post("/execute", response_model=AgentResponse)
async def execute_agent(request: AgentRequest):
    """
    Execute agent with given prompt
    This is a placeholder that calls the dummy agent service
    Will be replaced with OpenClaw integration
    """
    try:
        result = await agent_service.execute(request.prompt, request.context)
        return AgentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def agent_status():
    """Get agent service status"""
    try:
        status = await agent_service.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
