import httpx
from app.core.config import settings


class AgentService:
    """
    Agent service client
    This is a placeholder that communicates with the dummy agent service
    Will be replaced with OpenClaw integration in later phases
    """

    def __init__(self):
        self.base_url = settings.agent_service_url

    async def execute(self, prompt: str, context: dict = None) -> dict:
        """Execute agent with given prompt"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/execute",
                json={"prompt": prompt, "context": context or {}},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_status(self) -> dict:
        """Get agent service status"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/status",
                timeout=5.0
            )
            response.raise_for_status()
            return response.json()
