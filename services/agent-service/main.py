from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import subprocess
import json
import time
import os
import re

app = FastAPI(
    title="Mavin OpenClaw Agent Service",
    version="1.0.0",
    description="OpenClaw-powered agent service for Mavin OS"
)

# OpenClaw configuration
OPENCLAW_PATH = os.getenv("OPENCLAW_PATH", "/home/mt/npm-global/bin/openclaw-wrapper")
OPENCLAW_SESSION_ID = os.getenv("OPENCLAW_SESSION_ID", "mavin-agent")


class AgentRequest(BaseModel):
    """Agent request model"""
    prompt: str
    context: Dict = {}


class AgentResponse(BaseModel):
    """Agent response model"""
    response: str
    metadata: Dict = {}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Mavin OpenClaw Agent Service",
        "version": "1.0.0",
        "status": "operational",
        "engine": "OpenClaw CLI",
        "session_id": OPENCLAW_SESSION_ID
    }


@app.get("/status")
async def status():
    """Status endpoint"""
    try:
        # Check if OpenClaw is accessible
        result = subprocess.run(
            [OPENCLAW_PATH, "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        openclaw_version = result.stdout.strip().split('\n')[0] if result.returncode == 0 else "unknown"
        openclaw_ready = result.returncode == 0
    except Exception as e:
        openclaw_version = "error"
        openclaw_ready = False

    return {
        "status": "operational",
        "service": "openclaw-agent",
        "ready": openclaw_ready,
        "openclaw_version": openclaw_version,
        "session_id": OPENCLAW_SESSION_ID,
        "timestamp": time.time()
    }


@app.post("/execute", response_model=AgentResponse)
async def execute(request: AgentRequest):
    """
    Execute agent task using OpenClaw CLI with session ID
    """
    start_time = time.time()

    try:
        # Build OpenClaw command
        cmd = [
            OPENCLAW_PATH,
            "agent",
            "--session-id", OPENCLAW_SESSION_ID,
            "--message", request.prompt
        ]

        # Execute OpenClaw
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ, "OPENCLAW_SESSION_ID": OPENCLAW_SESSION_ID}
        )

        processing_time = time.time() - start_time

        if result.returncode != 0:
            # Extract meaningful error from stderr
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            raise HTTPException(
                status_code=500,
                detail=f"OpenClaw execution failed: {error_msg}"
            )

        # Parse OpenClaw output - extract the actual response
        # OpenClaw outputs warnings and then the response
        output_lines = result.stdout.strip().split('\n')
        # Get the last non-empty line as the response
        response_text = next((line for line in reversed(output_lines) if line.strip()), "No response")

        metadata = {
            "agent_type": "openclaw",
            "processing_time": processing_time,
            "session_id": OPENCLAW_SESSION_ID,
            "return_code": result.returncode
        }

        if request.context:
            metadata["context_keys"] = list(request.context.keys())

        return AgentResponse(
            response=response_text,
            metadata=metadata
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="OpenClaw execution timed out (120s)"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing OpenClaw: {str(e)}"
        )


@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Quick OpenClaw check
        result = subprocess.run(
            [OPENCLAW_PATH, "--version"],
            capture_output=True,
            text=True,
            timeout=3
        )
        healthy = result.returncode == 0
    except:
        healthy = False

    return {
        "status": "healthy" if healthy else "degraded",
        "service": "openclaw-agent",
        "openclaw_accessible": healthy
    }
